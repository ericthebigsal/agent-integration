"""
Fetch and normalize API documentation for the spec proposer.
Handles local Markdown files and remote HTML doc pages.
OpenAPI JSON/YAML support kept minimal — CAPI doesn't publish a machine-readable spec,
so the primary path is prose docs → text extraction → LLM.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import httpx


def load_docs_file(path: Path) -> str:
    """Load a local Markdown or plain-text docs file."""
    return path.read_text(encoding="utf-8")


def fetch_docs_page(url: str, timeout: int = 30) -> str:
    """
    Fetch a remote documentation page and return its text content.
    Strips HTML to produce clean input for the LLM.
    """
    with httpx.Client(timeout=timeout, follow_redirects=True) as client:
        response = client.get(url, headers={"User-Agent": "connector-agent/0.1"})
        response.raise_for_status()
    return _html_to_text(response.text)


def load_openapi_spec(path: Path) -> dict:
    """Load a local OpenAPI spec (JSON only; add PyYAML if YAML support is needed)."""
    return json.loads(path.read_text(encoding="utf-8"))


def openapi_spec_to_text(spec: dict) -> str:
    """
    Convert an OpenAPI spec dict to a compact text representation.
    Good enough for LLM consumption without blowing the context window.
    """
    lines: list[str] = [
        f"API: {spec.get('info', {}).get('title', 'Unknown')}",
        f"Version: {spec.get('info', {}).get('version', 'Unknown')}",
        f"Base URL: {_extract_base_url(spec)}",
        "",
    ]
    for path, path_item in spec.get("paths", {}).items():
        for method, operation in path_item.items():
            if method in ("get", "post", "put", "patch", "delete"):
                lines.append(f"{method.upper()} {path}")
                if summary := operation.get("summary"):
                    lines.append(f"  Summary: {summary}")
                if desc := operation.get("description"):
                    lines.append(f"  Description: {desc[:300]}")
                lines.append("")
    return "\n".join(lines)


def _extract_base_url(spec: dict) -> str:
    servers = spec.get("servers", [])
    if servers:
        return servers[0].get("url", "")
    return ""


def _html_to_text(html: str) -> str:
    # Remove script/style blocks entirely
    html = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html, flags=re.DOTALL | re.IGNORECASE)
    # Strip remaining tags
    text = re.sub(r"<[^>]+>", " ", html)
    # Decode common HTML entities
    entities = {"&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " "}
    for entity, char in entities.items():
        text = text.replace(entity, char)
    # Collapse whitespace
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
