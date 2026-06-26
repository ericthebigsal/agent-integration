"""
LLM-based connector spec proposer.
Sends API docs to Claude and gets back a structured ConnectorSpec,
with every ambiguous decision surfaced as a ReviewFlag instead of a silent guess.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional

import anthropic

from .schemas import ConnectorSpec

_DEFAULT_MODEL = os.getenv("CONNECTOR_AGENT_MODEL", "claude-opus-4-8")

_SYSTEM_PROMPT = """\
You are an expert API integration engineer. Given API documentation, produce a \
structured ConnectorSpec JSON describing how to build a connector for that API.

Rules you must follow:
1. Return ONLY valid JSON matching the schema provided. No prose, no markdown fences.
2. NEVER silently guess on ambiguous points. When something could go multiple ways, \
add a ReviewFlag. Err on the side of flagging too much — a missed flag means silent \
bugs in production.
3. Assign a confidence score (0.0–1.0) to auth, each endpoint, pagination, and rate limits. \
Anything below 0.85 must have a corresponding ReviewFlag.
4. Pay extra attention to: authentication token placement, required vs. optional fields, \
PII transformations (hashing/normalization), batch error semantics, path parameter \
naming ambiguities, and multiple valid integration paths.
5. For field transformations, list them in the order they must be applied.
"""


def propose_spec(
    docs_text: str,
    api_name: str,
    client: Optional[anthropic.Anthropic] = None,
    model: str = _DEFAULT_MODEL,
) -> ConnectorSpec:
    """
    Call Claude with the API docs and return a proposed ConnectorSpec.

    The returned spec will have ReviewFlags for every decision the agent
    wasn't confident about. Expect 3–6 flags for a well-documented but
    genuinely ambiguous API like Meta CAPI.
    """
    if client is None:
        client = anthropic.Anthropic()

    schema_hint = json.dumps(ConnectorSpec.model_json_schema(), indent=2)

    user_message = (
        f"API Name: {api_name}\n\n"
        f"--- DOCUMENTATION START ---\n{docs_text}\n--- DOCUMENTATION END ---\n\n"
        f"ConnectorSpec JSON schema (your response must match this exactly):\n{schema_hint}\n\n"
        "Produce the ConnectorSpec JSON now."
    )

    response = client.messages.create(
        model=model,
        max_tokens=8096,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    raw = response.content[0].text.strip()
    # Strip accidental markdown fences if the model adds them
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    return ConnectorSpec.model_validate_json(raw)


def save_draft(spec: ConnectorSpec, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(spec.model_dump_json(indent=2), encoding="utf-8")


def load_draft(path: Path) -> ConnectorSpec:
    return ConnectorSpec.model_validate_json(path.read_text(encoding="utf-8"))
