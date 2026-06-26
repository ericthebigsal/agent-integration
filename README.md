# Agent-Built Connector

An agent that reads API documentation, proposes a structured connector spec, **flags every ambiguous decision for human review**, and then generates working integration code — along with a mock version of the target API for end-to-end testing.

Built to demonstrate the same pattern I shipped at Amperity: agentic doc ingestion + human-in-the-loop design checkpoints + generated connectors + mock third-party APIs as test harnesses.

Target API for this demo: **Meta Conversions API (CAPI)** — chosen because it's genuinely tricky (PII hashing requirements, all-or-nothing batch validation, Pixel ID vs. Dataset ID naming confusion, multiple valid integration paths).

---

## The problem

Integrating with a new API typically means:

1. Reading dense docs to understand auth, field requirements, edge cases
2. Making a series of judgment calls (which token type? which endpoint? what to hash? how to handle batch errors?)
3. Writing the connector code
4. Building a mock of the API so you can test without hitting rate limits or polluting production data

Steps 1–3 each have failure modes that don't show up until the integration is live. An agent can compress the timeline, but an agent that silently guesses on ambiguous points is trading speed for hidden risk.

This project's answer: the agent flags its uncertainty explicitly and blocks on human input before generating code.

---

## How it works

```
API docs (Markdown or URL)
        │
        ▼
┌───────────────────┐
│   spec_proposer   │  Claude reads the docs and produces a ConnectorSpec:
│   (Claude LLM)    │  auth config, endpoints, field mappings, pagination,
│                   │  rate limits — and a ReviewFlag for every decision
│                   │  it isn't confident about.
└────────┬──────────┘
         │
         ▼
┌───────────────────┐   ← THE DIFFERENTIATOR
│   Human Review    │
│   (CLI prompt)    │  Each flag is presented with the agent's reasoning
│                   │  and available options. You approve or override.
│                   │  Progress is saved after each decision.
└────────┬──────────┘
         │  approved ConnectorSpec
         ├────────────────────────────────────┐
         ▼                                    ▼
┌───────────────┐                   ┌──────────────────┐
│ code_generator│                   │  FastAPI mock    │
│               │  Python connector │  of target API   │
│               │  (standalone,     │                  │
│               │   no framework)   │  Mirrors real    │
└───────┬───────┘                   │  validation      │
        │                           │  behavior        │
        └──────────────┬────────────┘
                       ▼
              end-to-end test run
```

The review step isn't optional polish — it's the point. For Meta CAPI specifically, the agent flags things like:

- **Pixel ID vs. Dataset ID**: the docs use both terms; picking wrong silently routes events to the wrong asset
- **Integration path**: four valid paths exist (direct API, GTM server-side, gateway, partner integration); the generated code differs for each
- **PII hashing scope**: which user_data fields are arriving pre-hashed vs. needing agent-side normalization + SHA-256?
- **Batch error handling**: the API rejects the entire batch on any single invalid event — should the connector validate first, send one-at-a-time, or let the caller handle it?

---

## Quickstart

**Prerequisites:** Python 3.11+, an [Anthropic API key](https://console.anthropic.com/)

```bash
git clone https://github.com/ericthebigsal/agent-integration.git
cd agent-integration
python3 -m venv .venv && source .venv/bin/activate
pip install -e .
cp .env.example .env
# add your ANTHROPIC_API_KEY to .env
```

### Step 1 — Propose a connector spec

```bash
connector-agent propose \
  --docs docs/capi_docs.md \
  --api-name "Meta CAPI"
```

Claude reads the docs and writes a draft spec to `review/spec_draft.json`. The terminal output tells you how many review flags need your input.

### Step 2 — Review flagged decisions

```bash
connector-agent review --spec review/spec_draft.json
```

Each ambiguous decision is presented interactively with the agent's reasoning. Your choices are saved after each one, so you can quit and resume. When all flags are resolved, the spec is marked approved.

### Step 3 — Generate the connector

```bash
connector-agent generate --spec review/spec_draft.json
```

Writes a standalone Python connector to `generated_connector/`. No framework dependencies — just `httpx` and the standard library.

### Step 4 — Test against the mock API

In one terminal:
```bash
connector-agent run-mock
# FastAPI mock listening on http://127.0.0.1:8001
```

In another:
```python
from generated_connector.meta_capi_connector import MetaCAPIConnector

with MetaCAPIConnector(access_token="test", pixel_id="123456789") as conn:
    result = conn.send_events([{
        "event_name": "Purchase",
        "event_time": 1700000000,
        "action_source": "website",
        "user_data": {"email": "test@example.com"},
    }], test_event_code="TEST12345")
    print(result)
# {"events_received": 1, "fbtrace_id": "..."}
```

---

## Project structure

```
agent/
  schemas.py          # Pydantic models: ConnectorSpec, ReviewFlag, FieldMapping, etc.
  spec_proposer.py    # LLM call: docs → ConnectorSpec with ReviewFlags
  reviewer.py         # Interactive CLI for flag review (Rich-based)
  code_generator.py   # ConnectorSpec → Python connector module
  doc_ingestion.py    # Load local files or fetch/strip remote HTML docs

mock_api/
  capi_mock.py        # FastAPI mock of Meta CAPI
                      # Implements all-or-nothing batch validation,
                      # auth checks, event field validation

docs/
  capi_docs.md        # Condensed CAPI reference used as agent input

generated_connector/  # Output directory (gitignored except .gitkeep)
tests/
  test_schemas.py     # Unit tests for ConnectorSpec schema
```

---

## Design notes

**Why Pydantic for the spec?** The ConnectorSpec is the contract between the agent and the code generator. Pydantic gives us schema-validated round-trip JSON serialization, which means the review file the human edits is validated on load — bad edits fail fast with a useful error.

**Why a standalone connector (no framework)?** The output needs to be readable and portable. A connector that imports a proprietary framework is harder to evaluate and harder to drop into an existing codebase.

**Why a FastAPI mock instead of recorded fixtures?** The mock enforces real validation behavior — specifically the all-or-nothing batch rejection. Test fixtures would let invalid events pass silently. The mock also lets you test error paths (missing auth, malformed events) without hitting rate limits.

**Why does the review step save after each decision?** The review session for a real API might have 6–10 flags and involve looking things up. Losing progress on quit would be annoying enough that people skip the review — which defeats the purpose.

---

## What's out of scope (v1)

- OAuth token acquisition flow (connector takes a pre-obtained access token)
- Retry/backoff logic in the generated connector
- Full OpenAPI spec ingestion (CAPI doesn't publish one; prose docs are the primary path)
- Web UI for the review step
- Multi-page doc crawling
- Connector for any API other than Meta CAPI (the pattern generalizes; the demo doesn't)

---

## Before/after timing

*To be filled in after a timed end-to-end run.* The Amperity number (4 weeks → 2 days) covered a production SDK with 24 connectors. This demo will produce an honest single-connector number.
