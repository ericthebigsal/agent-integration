# AI-Assisted Martech Integration Builder

A portfolio demonstration of agentic API integration. An AI agent ingests an OpenAPI spec, enriches it with behavioral knowledge from domain skill files, surfaces HITL warnings for human review, generates a working MCP tool server, and proves the result against a live account.

**Live demo:** https://ericthebigsal.github.io/agent-integration  
**Backend:** https://agent-integration.onrender.com

---

## What This Proves

Most "AI + API" demos stop at code generation. This one shows the full loop:

1. **Skill-sourced enrichment** — the agent doesn't just read the spec; it cross-references domain knowledge files encoding gotchas that aren't in the spec (silent duplicates, async operations, magic number IDs).
2. **HITL gate** — risky operations surface for human acknowledgment before tool generation runs. The human reviews what the agent flagged, not a wall of raw spec.
3. **Verified output** — the generated MCP server is tested against a live account in the same flow.

The system is platform-agnostic. The same five-screen flow works for any platform with an OpenAPI spec. Two are implemented: Klaviyo and HubSpot.

---

## Architecture

```
OpenAPI spec (paste or URL)
        │
        ▼
backend/enrich.py          ← injects behavioral descriptions into spec paths
        │
        ▼
skills/{platform}-api.md   ← runtime LLM guidance: auth, gotchas, cross-object sequences
        │
        ▼
Screen 2: Skill Match      ← endpoint×skill alignment, warnings queued
        │
        ▼
Screen 3: HITL Review      ← human acknowledges flagged risks before generation
        │
        ▼
Screen 4: MCP Generation   ← openapi-mcp builds typed tool server from enriched spec
        │
        ▼
Screen 5: Live Verification ← real API call sequence proves the tools work
```

**Backend:** FastAPI on Render  
**Frontend:** Single-page HTML/JS on GitHub Pages  
**Auth:** All API keys in Render env vars — never in source

---

## Platforms

### Klaviyo (Skills 1–3)

| Scenario | Operations | Key gotcha surfaced |
|----------|-----------|-------------------|
| Manage Profiles | Upsert, delete, list, export | Delete is async and irreversible via data-privacy endpoint; 401 immediately after revision bump is a confirmed live issue, not a bad key |
| Manage Audiences — Lists | Create list, add/remove member, subscribe | Two add-member paths (`subscribe` vs `relationships/profiles`) have different consent semantics; both return 200 with no distinguishing signal |
| Manage Segments | Create, read, delete | Hard daily cap of 100 segments; membership is computed (not writable); 10–60s propagation delay after profile upsert |

**Live demo sequence:** Create profile → create segment with property condition → poll for membership (45s). Shows that segment enrollment is automatic from property match — no add-member call made.

### HubSpot (Skills 4–6)

| Scenario | Operations | Key gotcha surfaced |
|----------|-----------|-------------------|
| Manage Contacts | Create, batch upsert, update, archive, search | `POST /crm/v3/objects/contacts` creates a duplicate silently if email exists — no 409; safe path is batch upsert with `idProperty: email` |
| Manage Lists | Create list, add/remove members, get memberships | `processingType` (MANUAL vs DYNAMIC) is permanent at creation; adding a contact to a DYNAMIC list returns 200 and silently does nothing |
| Manage Associations | Create, read, delete association | Type IDs are magic numbers (contact→company = 1, contact→deal = 3); DELETE without type ID removes ALL association types between two objects |

**Live demo sequence:** Create contact → create company → associate contact→company using type ID 1. Shows the cross-object linking model and why the type ID must be known at call time.

---

## Two-Layer Skill Delivery

**Layer 1 — Enriched OpenAPI spec** (`backend/enrich.py`)

Injects behavioral descriptions directly into spec operation objects before the MCP generator runs. Warnings become part of tool descriptions, so any LLM using the tools reads the gotcha in context.

```python
("post", "/api/profiles"): (
    "⚠️ This endpoint upserts by email or external_id — re-sending the same "
    "identifier silently overwrites the existing profile. No 409, no duplicate."
)
```

**Layer 2 — Companion skill files** (`skills/`)

Runtime MCP guidance. Eight files covering auth format, per-skill operation sequences, cross-object workflows, and a Known Live Issues table. Used by an LLM building integrations with the generated tools.

```
skills/
├── klaviyo-api.md          ← auth, revision header, Skills 1–3 gotchas
├── manage-profiles.md
├── manage-audiences.md
├── manage-segments.md
├── hubspot-api.md          ← auth (Bearer), Skills 4–6 gotchas, cross-object sequence
├── manage-contacts.md
├── manage-lists-hubspot.md
└── manage-associations.md
```

---

## Walkthrough Script

Use this for a live demo with a client or interviewer. Total time: ~4 minutes for Klaviyo, ~2 minutes for HubSpot.

### Opening (30s)

> "This is a five-step flow that shows how an AI agent handles API integration — not just code generation, but the part that usually breaks: knowing which API behaviors aren't in the spec."

Open https://ericthebigsal.github.io/agent-integration.

### Screen 1 — Spec Input (30s)

> "The agent accepts any OpenAPI spec. I'll show you two platforms — they use the exact same flow."

- Click **HubSpot** — scenarios update to Contacts / Lists / Associations, paste example switches to HubSpot spec
- Click back to **Klaviyo**
- Leave Manage Profiles selected, click **Continue**

> "No prose scraping, no free-text docs — structured spec only. That's intentional: the enrichment layer adds the behavioral knowledge the spec doesn't have."

### Screen 2 — Skill Match (45s)

> "The agent aligns each endpoint against its domain skill file. Notice the status tags."

Point out:
- **confirmed** — endpoint verified against real API response
- **2 warnings** — the skill flagged risks the spec doesn't mention
- **multi-step** — this operation requires a sequence, not a single call
- **2 paths** — two valid implementations with different outcomes

> "6 warnings surfaced from 10 operations. These come from the skill file, not the spec. The spec just says POST /api/lists/{id}/subscribe returns 200. The skill knows that on a double opt-in account, that 200 means nobody was added."

Click **Continue**.

### Screen 3 — HITL Review (60s)

> "Before the agent generates anything, the human reviews the flagged risks. This is the gate."

Walk through the three warnings for Manage Profiles:
- 🔴 **Delete is async and irreversible** — point out the rate limit detail and the April 2026 live issue note
- 🟡 **Upsert is silent** — no create vs. update distinction in the response
- ℹ️ **Auth format** — revision header specific to Klaviyo

> "The acknowledgment checkbox is required. The agent won't generate tools until the human has seen this."

Check the box, click **Continue**.

### Screen 4 — MCP Generation (30s)

> "openapi-mcp runs against the enriched spec. The behavioral warnings are embedded in the tool descriptions — so any LLM using these tools reads the gotcha in the same context as the function signature."

Point to the tool chips: `upsert_profile`, `delete_profile`, `create_segment`, etc.

> "10 tools. The enrichment descriptions travel with them."

Click **Continue**.

### Screen 5 — Live Verification (60–90s for Klaviyo / 15s for HubSpot)

> "Real API call against my Klaviyo free account. Watch what it does."

Enter the demo password, click **Run live demo**.

**Klaviyo:**
- Creates a profile with a custom property
- Creates a segment with a condition matching that property
- Waits 45 seconds for Klaviyo to compute membership
- Polls and shows the member count

> "The profile enrolled automatically. No add-member call. That's what the skill means when it says segment membership is computed — the demo makes it concrete."

**HubSpot** (switch platform first, go back to Screen 1):

> "Same flow, different platform. HubSpot's gotcha is the association type IDs."

- Creates a contact
- Creates a company
- Associates them using type ID 1

> "That '1' is a magic number. It means contact→company. The spec doesn't tell you that — the skill file does."

---

## Local Development

```bash
# Clone and install
git clone https://github.com/ericthebigsal/agent-integration.git
cd agent-integration
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Add credentials
cp .env.example .env
# Fill in KLAVIYO_PRIVATE_API_KEY, HUBSPOT_SERVICE_KEY, DEMO_SECRET

# Run backend
uvicorn backend.main:app --reload

# Open prototype
open 06-end-to-end-flow.html
```

### Tests

```bash
pytest backend/tests/ -v
# 17 tests: enrich (11), klaviyo (3), hubspot (3)
# Live tests require KLAVIYO_PRIVATE_API_KEY and HUBSPOT_SERVICE_KEY in .env
```

### Endpoints

| Route | Description |
|-------|-------------|
| `GET /health` | Health check |
| `POST /demo/klaviyo/run` | Klaviyo 3-step demo sequence |
| `GET /demo/klaviyo/segment/{id}/members` | Poll segment membership |
| `POST /demo/hubspot/run` | HubSpot 3-step demo sequence |

All demo endpoints require `X-Demo-Key` header matching `DEMO_SECRET`.

---

## File Structure

```
backend/
├── main.py           ← FastAPI app; routers at /demo/klaviyo and /demo/hubspot
├── config.py         ← pydantic-settings; reads KLAVIYO_PRIVATE_API_KEY, HUBSPOT_SERVICE_KEY, DEMO_SECRET
├── enrich.py         ← behavioral description injection for Klaviyo + HubSpot endpoints
├── klaviyo.py        ← Klaviyo demo router
├── hubspot.py        ← HubSpot demo router
└── tests/

skills/
├── klaviyo-api.md    ← MCP companion: auth, Skills 1–3, known live issues
├── hubspot-api.md    ← MCP companion: auth, Skills 4–6, cross-object sequence
└── manage-*.md       ← per-skill domain files (6 total)

mcp-server/           ← generated TypeScript MCP server (portfolio artifact)
index.html            ← production frontend (GitHub Pages)
06-end-to-end-flow.html ← local dev frontend (localhost:8000)
render.yaml           ← Render deployment config
```
