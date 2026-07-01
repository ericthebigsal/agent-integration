# Project Handoff — AI-Assisted Martech Integration Builder

**Last session ended:** 2026-07-01  
**Repo:** https://github.com/ericthebigsal/agent-integration  
**Live demo:** https://ericthebigsal.github.io/agent-integration  
**Backend:** https://agent-integration.onrender.com  
**Branch:** `main` — everything is deployed, no open branches

---

## What This Is

A five-screen portfolio demo proving that an AI agent can do the full API integration loop — not just code gen. It ingests an OpenAPI spec, cross-references domain skill files for behavioral gotchas, surfaces Human-in-the-Loop warnings for review, generates a live MCP tool server, then runs the tools against a real account and shows the results.

Two platforms are fully implemented: **Klaviyo** (3 scenarios) and **HubSpot** (3 scenarios).

---

## Current State — What's Working

Every screen is fully functional for both platforms.

| Screen | What it does | Status |
|--------|--------------|--------|
| 1 — Spec Input | Paste or URL; platform + scenario selector; auto-fetch on switch | ✅ complete |
| 2 — Skill Match | Endpoint × skill alignment; confirmed/warning/multi-step tags; expandable detail badges | ✅ complete |
| 3 — HITL Review | Three warnings per scenario; acknowledgment checkbox gates progression | ✅ complete |
| 4 — MCP Generation | Calls `/api/generate`; shows generated Python; tool chips; enrichment stats | ✅ complete |
| 5 — Live Verification | Animated SVG sequence diagram; password entry; Go button; result tiles | ✅ complete |

### Step 5 detail (most recently built)

- Platform toggle gated — HubSpot tab disabled until its spec is fetched in Step 1
- Animated sequence diagram: arrows draw in sequence (tool call → HTTP → response), actor boxes glow during each step
- Password UX: persistent "DEMO KEY" section above diagram; stored once, chevron confirms `✓ Key stored`; `change` link to reset
- **Expandable result tiles** (built this session, commit `8e167d0`): clicking any `✓ tool() … 200` row expands to show:
  - **REQUEST** — HTTP method + full URL, platform headers, args JSON
  - **RESPONSE** — raw API response JSON (scrollable)
  - **WHAT THIS MEANS** — per-tool human explanation (written for all 10 tools)

---

## Architecture

```
Frontend          index.html on GitHub Pages (pure HTML/JS, no build step)
Backend           FastAPI on Render — agent-integration.onrender.com
Auth              All API keys in Render env vars, never in source
```

### Key backend files

| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI app; mounts all routers |
| `backend/generate.py` | `TOOL_LIBRARY` data + `generate_mcp_server()` — the MCP code generator |
| `backend/generate_router.py` | `POST /api/generate` and `POST /api/run-tool` endpoints |
| `backend/enrich.py` | Injects behavioral descriptions into spec operation objects |
| `backend/tools.py` | `run_tool()` — executes a named tool against the real platform API |
| `backend/klaviyo.py` | Klaviyo-specific API logic |
| `backend/hubspot.py` | HubSpot-specific API logic |
| `backend/config.py` | Pydantic settings — reads env vars |

### Key frontend structures (all in `index.html`)

| Symbol | What it is |
|--------|-----------|
| `PLATFORMS` | Config object for each platform: scenarios, spec preview, server domain |
| `SCENARIOS` | Six keyed entries (`klaviyo-0` … `hubspot-2`) — each has steps with `tool`, `endpoint`, `args(ctx)`, `extract(data, ctx)` |
| `SCENARIO_META` | Display metadata for the SVG diagram (call/http/ret/captures labels) |
| `TOOL_LIBRARY` | Mirrored in backend — same tool definitions used for code gen and result rendering |
| `resultStore[]` | Module-level array; populated per step after each `runScenario()` run; used by expandable tile detail |
| `demoKey` | Module-level string; set once via `storeDemoKey()`, read by `runScenario()` and the Go button |

### Env vars (set in Render dashboard)

| Var | Purpose |
|-----|---------|
| `KLAVIYO_PRIVATE_API_KEY` | Live Klaviyo account key |
| `HUBSPOT_SERVICE_KEY` | Live HubSpot service account key |
| `DEMO_SECRET` | Password required by frontend to call `/api/run-tool` |

---

## How to Run Locally

```bash
git clone https://github.com/ericthebigsal/agent-integration.git
cd agent-integration
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Create .env with real keys
# KLAVIYO_PRIVATE_API_KEY=pk_...
# HUBSPOT_SERVICE_KEY=...
# DEMO_SECRET=whatever

uvicorn backend.main:app --reload
# Then open index.html in browser — it points to agent-integration.onrender.com by default
# Change BACKEND_URL in index.html to http://localhost:8000 for local backend
```

```bash
# Tests (17 total — 11 generate, 3 klaviyo, 3 hubspot)
pytest backend/tests/ -v
# Live tests skip unless real API keys are set in env
```

---

## Deployment

- **Frontend:** Push to `main` → GitHub Pages auto-deploys (1–2 min CDN lag; append `?v=<sha>` to bust cache)
- **Backend:** Render auto-deploys from `main` on push; check https://agent-integration.onrender.com/health

---

## What to Work On Next

These are the natural next moves, roughly in priority order:

### 1. Polish / UX
- **"Run again" scroll behavior** — after a run completes, the results area can scroll out of view. Auto-scroll to the first result tile when the run starts.
- **Error state in tiles** — error tiles currently have no expand behavior. Consider showing the error detail (HTTP body from the API) in the same expandable format.
- **Mobile layout** — not tested below ~900px. The SVG sequence diagram has fixed widths.

### 2. New scenarios
Each platform has 3 scenarios; adding 1–2 more per platform would expand the demo surface:
- Klaviyo: **Send Campaign** (create email template → create campaign → schedule send)
- HubSpot: **Deal Pipeline** (create deal → associate contact → move stage)

Adding a scenario means:
1. Add entry to `SCENARIOS` in `index.html` with steps
2. Add entry to `SCENARIO_META` for the diagram labels
3. Add entry to `TOOL_LIBRARY` in `backend/generate.py`
4. Add tool implementations to `backend/tools.py`
5. Add entries to `backend/enrich.py` for behavioral descriptions
6. Add `detailExplain()` cases for the new tools in `index.html`

### 3. Third platform
The frontend is already platform-agnostic — adding a third platform (e.g., Salesforce, Segment, Braze) follows the same pattern as HubSpot. Estimated work: 1–2 sessions.

### 4. Shareable demo link
Currently the demo key must be typed on every visit. Options:
- Encode the key in a URL param (`?k=...`) so a shareable link pre-fills it
- Add a "copy shareable link" button to the DEMO KEY section

### 5. Scenario timing display
Step 5 sequences that have async waits (e.g., segment membership propagation in Klaviyo) could show a live elapsed timer in the result tile rather than just the status icon.

---

## Recent Commit History

```
8e167d0  Step 5: expandable result tiles with request/response inspector
5e15d09  Step 5: password entry UX — store-once + Go button inside diagram
8761dbd  Step 5: animated sequence diagram with integrated run bar
7db6b52  Step 5: disable platform tabs for platforms not fetched in Step 1
37fd60c  Fix all steps to aggregate across all scenarios, not just the toggled one
6fee569  Decouple scenarios from MCP generation — always generate all tools
c08a91b  Step 5: replace step table with SVG sequence diagram
2557d02  Step 5: platform + scenario selectors, all 6 scenarios browsable
```

---

## Files You Won't Need to Touch

- `skills/` — companion skill files for the MCP server; content is complete
- `mcp-server/` — generated TS MCP server; portfolio artifact, not actively used by demo
- `01-review.html`, `04-*.html`, `05-*.html` — prototype iterations, superseded by `index.html`
- `klaviyo-openapi/` — OpenAPI spec files used during development
- `render.yaml` — Render deployment config; no changes needed unless adding new env vars
