# Project Brief: Agent-Built Connector (portfolio side-project)

## Who this is for
Eric Salerno — laid-off Technical Product Manager (Amperity, Press Ganey, Accolade, Microsoft) pivoting to **freelance/contract work** in agentic AI, targeting vertical SaaS startups (healthcare, fintech, legal). Background: ~30 years technical PM/eng leadership; most recently built a multi-agent RAG SDK (Python + LLM/MCP) at Amperity that cut third-party API integration time ~90% (4 weeks → 2 days), shipped 24 production connectors, built 30+ MCP servers/tools and 6 mock third-party APIs as test harnesses.

## Strategy context (why this project exists)
- Chosen go-to-market: **direct outreach to startups**, not marketplaces (Upwork etc.) — better rates, more interesting work, plays to Eric's TPM + hands-on-builder combo.
- Target companies identified so far (for later outreach, not part of this build):
  - Smaller/early-stage: Supio (legal AI, Seattle), AttorneyAide (legal/medical records AI), Caseflood.ai (YC, legal ops AI)
  - Larger but still relevant: Tennr (healthcare claims/documentation AI), Corti (healthcare claims AI)
  - Source for more: YC's Seattle company directory, GeekWire "Startup Radar" series
- Problem identified: cold outreach needs **proof, not just resume claims**. A public side-project that mirrors Eric's strongest resume claim (the Amperity connector SDK) is more convincing than another bullet point.
- This project is that proof artifact.

## The project: "Agent-Built Connector"
A small, polished, public demo that mirrors the Amperity achievement on public data, so Eric can talk about it concretely without touching proprietary code.

**Core loop:**
1. Input: target API's docs (OpenAPI spec or docs pages)
2. Agent reads the docs and proposes a connector spec — auth method, endpoints, field mappings, pagination strategy, rate limits
3. **Agent flags decisions it's not confident about for human review**, with its reasoning — this is the key differentiator (echoes Eric's "autonomous-vs-human-in-the-loop design" resume line). Do not let the agent silently guess on ambiguous points.
4. Human reviews/approves flagged items (simple CLI prompt or an editable JSON file is enough for v1 — no UI needed)
5. Agent generates working integration code from the approved spec
6. Agent also generates a **mock version of the target API** (FastAPI) so the connector is testable end-to-end without hammering the real API — this directly echoes the "6 mock third-party APIs" pattern from Amperity
7. Output includes a before/after time estimate (hand-building vs. agent-assisted) — get an honest, small-scale real number from this build; do NOT reuse the Amperity "90%" stat since this is a different system

## Target API: Meta Conversions API (CAPI)
Chosen because it's in the exact family of system Eric's resume already claims ("server-side event/CAPI APIs" was explicitly called out as part of the 24 shipped Amperity connectors), and it's genuinely messy in instructive ways:
- Fields must be SHA-256 hashed (email, phone) before sending — easy for a naive agent to miss
- Batching: API accepts up to 1,000 events/batch but **rejects the entire batch if any one event is invalid** — good "flag this risk" moment
- Common real-world confusion: Pixel ID vs. Dataset ID look similar but are different fields — another good flag-for-review case
- Event Match Quality (EMQ) depends on correct field normalization (UTC timestamps, deduplication via event_id) — more ambiguity to surface
- Multiple valid integration paths exist (direct API, GTM server-side, gateway services, partner integrations) — agent should flag/ask which applies rather than assume

Public docs: https://developers.facebook.com/docs/marketing-api/conversions-api/

If CAPI's auth/sandbox setup proves too high-friction for a demo, fallback options to revisit: an ESP API or another ad-network API (also in-scope per Eric's Amperity background), or a messy public/government open-data API (Socrata-style) as a non-domain-specific backup.

## Deliverable shape (decided)
- **Two weeks**, polished — not a weekend hack
- **GitHub repo + README** AND a **short demo video** (~90 seconds) — most founders will watch the video before reading code
- Demo video should show: messy docs going in → agent's proposed spec coming out → a flagged ambiguous decision → Eric's review → generated code running successfully against the mock API

## Build plan (2 weeks)
- **Days 1–2:** Pull CAPI docs/spec, define agent output schema (connector spec format: auth, endpoints, field mappings, pagination, rate limits, confidence/review flags), scaffold repo (`/agent`, `/mock_api`, `/generated_connector`, `/docs`)
- **Days 3–6:** Core agent loop — doc ingestion, spec proposal, confidence-flagging step (the differentiator — spend real care here), human-review checkpoint
- **Days 7–9:** Code generation from approved spec, build the FastAPI mock of CAPI (mirroring real validation behavior like all-or-nothing batch rejection), wire up end-to-end test run
- **Days 10–11:** Polish + honest before/after timing metric, clean README (problem, approach, architecture diagram, how to run, what's out of scope for v1)
- **Days 12–14:** Record 90-second demo video, final repo/code polish (some founders' engineers will click through the code, so it should hold up)

## Open items / not yet decided
- Exact connector spec schema (fields, format) — not yet designed
- Whether the human-review checkpoint is CLI-based or a simple editable file for v1
- Final repo name / branding
- Outreach message drafts (one tone for smaller/early-stage companies, one for larger ones) — explicitly deferred until after this project exists, so the outreach can link to it

## Immediate next step
Start scaffolding the repo and designing the agent architecture/connector-spec schema in more detail (this was the decision point reached right before moving to Claude Code).
