# HubSpot Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add HubSpot as a second platform to the AI-Assisted Martech Integration Builder — three new skills (Manage Contacts, Manage Lists, Manage Associations), a live demo backend endpoint, enrichment rules, and a config-driven platform selector in the prototype.

**Architecture:** All platform-specific content (scenario names, HITL warnings, acknowledgments, tool chips, demo endpoints) is extracted into a `PLATFORMS` JavaScript config object in the prototype. A platform toggle on Screen 1 switches the entire flow. The backend gains a new `/demo/hubspot/run` router, and the Klaviyo router moves from `/demo` to `/demo/klaviyo` for symmetry.

**Tech Stack:** Python 3.11+, FastAPI, httpx, pydantic-settings, vanilla JS in a single-file HTML prototype. HubSpot API v3/v4 with Bearer token auth.

## Global Constraints

- HubSpot auth header: `Authorization: Bearer {HUBSPOT_SERVICE_KEY}` — NOT a custom header name
- HubSpot base URL: `https://api.hubapi.com`
- Env var name: `HUBSPOT_SERVICE_KEY` (set in both local `.env` and Render)
- Demo secret check: same pattern as Klaviyo — `if settings.demo_secret and x_demo_key != settings.demo_secret: raise 401`
- Klaviyo router moves from prefix `/demo` to `/demo/klaviyo` — update both backend and prototype in Task 3+5 accordingly
- All tests run against real HubSpot API; tests requiring `HUBSPOT_SERVICE_KEY` use `pytest.mark.skipif` when token absent
- `backend/tests/test_hubspot.py` follows the same pattern as `backend/tests/test_klaviyo.py`
- `backend/enrich.py` enrichment keys are `(method, path)` tuples — exact path strings as they appear in the OpenAPI spec
- Prototype files to update: `index.html` AND `06-end-to-end-flow.html` (keep in sync)
- No Docker, no new Python packages beyond what's in `requirements.txt`

---

### Task 1: HubSpot skill files

**Files:**
- Create: `skills/manage-contacts.md`
- Create: `skills/manage-lists-hubspot.md`
- Create: `skills/manage-associations.md`

**Interfaces:**
- Produces: three skill files consumed by Task 2 (companion skill cross-references them by name)

No tests — verify by reading the files after writing.

- [ ] **Step 1: Write `skills/manage-contacts.md`**

```markdown
# Manage Contacts — HubSpot Domain Skill (Skill 4)

HubSpot contacts are the core CRM object: every list membership,
deal association, and activity is anchored to a contact record.

**Auth:** `Authorization: Bearer {HUBSPOT_SERVICE_KEY}`
**Base URL:** `https://api.hubapi.com`

---

## Create / Upsert Contact

**Single-object create — POST /crm/v3/objects/contacts**

⚠️ This endpoint creates a NEW contact every time. If a contact with
the same email already exists, it creates a duplicate — no 409, no error.

**Safe upsert — POST /crm/v3/objects/contacts/batch/upsert**

Use this endpoint for idempotent operations. Specify `idProperty: "email"`
to deduplicate on email address.

```json
{
  "inputs": [{
    "idProperty": "email",
    "properties": {
      "email": "user@example.com",
      "firstname": "Ada",
      "lastname": "Lovelace",
      "hs_lead_status": "IN_PROGRESS"
    }
  }]
}
```

---

## Update Contact — PATCH /crm/v3/objects/contacts/{contactId}

Updates properties on an existing contact by ID. Does not create if missing.

---

## Archive Contact — DELETE /crm/v3/objects/contacts/{contactId}

**Soft delete only.** Contacts cannot be hard-deleted via the CRM v3 API.
Archived contacts are excluded from search results by default.
Pass `archived=true` as a query param to include them.

---

## Search Contacts — POST /crm/v3/objects/contacts/search

Filter contacts by property values. Returns paginated results with a
`paging.next.after` cursor — loop until cursor is absent.

---

## Rate Limits

- 100 requests / 10 seconds per token
- 429 responses include `Retry-After` header in seconds — respect it

---

## API Facts

| Property | Value |
|---|---|
| Auth header | `Authorization: Bearer {token}` |
| Contact ID type | String (numeric string, e.g. "12345") |
| Duplicate protection | Only via batch upsert with idProperty |
| Hard delete | Not available — archive only |
| Rate limit | 100 req / 10s |
```

- [ ] **Step 2: Write `skills/manage-lists-hubspot.md`**

```markdown
# Manage Lists — HubSpot Domain Skill (Skill 5)

HubSpot ILS (Integrated List Segmentation) lists come in two types
with fundamentally different membership behaviors.

**Key distinction from Klaviyo Lists:** HubSpot uses the word "list"
for both static (manually managed) and dynamic (rule-based) lists.
In Klaviyo, these are called "Lists" and "Segments" respectively.
In HubSpot, the distinction is the `processingType` field.

---

## Create List — POST /crm/v3/lists

`processingType` is **permanent** — it cannot be changed after creation.

| processingType | Membership writable? | Updates |
|---|---|---|
| `MANUAL` | Yes — add/remove via API | Immediate |
| `DYNAMIC` | No — computed from filter | Async (seconds–minutes) |

```json
{
  "name": "VIP Customers",
  "processingType": "MANUAL",
  "objectTypeId": "0-1"
}
```

`objectTypeId: "0-1"` means contacts. Do not omit it.

---

## Add Members — PUT /crm/v3/lists/{listId}/memberships/add

**Only works for MANUAL lists.**

```json
{ "recordIdsToAdd": ["12345", "67890"] }
```

⚠️ If called on a DYNAMIC list, returns HTTP 200 and silently does nothing.
No error. No indication that the add was ignored.

---

## Remove Members — PUT /crm/v3/lists/{listId}/memberships/remove

Only works for MANUAL lists. Same silent-ignore behavior on DYNAMIC lists.

---

## Read Membership — GET /crm/v3/lists/{listId}/memberships

Returns paginated list of contact IDs. Paginate via `paging.next.after`.

---

## API Facts

| Property | Value |
|---|---|
| processingType options | MANUAL, DYNAMIC |
| processingType mutable | No — permanent at creation |
| objectTypeId for contacts | "0-1" |
| DYNAMIC membership delay | Seconds to minutes |
| Add to DYNAMIC list | Silent 200, no effect |
```

- [ ] **Step 3: Write `skills/manage-associations.md`**

```markdown
# Manage Associations — HubSpot Domain Skill (Skill 6)

Associations link HubSpot CRM objects to each other: contacts to
companies, contacts to deals, companies to deals, etc.
There is no equivalent concept in Klaviyo.

---

## Create Association — PUT /crm/v4/objects/{fromType}/{fromId}/associations/{toType}/{toId}

```json
[{
  "associationCategory": "HUBSPOT_DEFINED",
  "associationTypeId": 1
}]
```

**Association type IDs are magic numbers** — they are not returned by the
API in human-readable form. You must know them at call time.

Common type IDs (HubSpot-defined, contact↔company):
| Direction | associationTypeId |
|---|---|
| Contact → Company | 1 |
| Company → Contact | 2 |
| Contact → Deal | 3 |
| Deal → Contact | 4 |
| Contact → Ticket | 16 |

Association creation is **idempotent** — re-associating already-linked
objects is safe (no error, no duplicate association).

---

## Create Default Association — PUT /crm/v4/objects/{fromType}/{fromId}/associations/{toType}/{toId}/default

Simpler endpoint — creates the default association type without specifying
a type ID. Equivalent to type ID 1 for contact→company.

---

## Read Associations — GET /crm/v4/objects/{fromType}/{fromId}/associations/{toType}

Returns all objects of `toType` associated with `fromId`.

---

## Delete Association — DELETE /crm/v4/objects/{fromType}/{fromId}/associations/{toType}/{toId}

⚠️ **Without a type ID** — deletes ALL association types between the two
objects, not just the default one.

To delete only a specific type:
```
DELETE /crm/v4/objects/{fromType}/{fromId}/associations/{toType}/{toId}/{associationTypeId}
```

---

## v3 vs v4 API

The v3 (`/crm/v3/associations/...`) and v4 (`/crm/v4/objects/.../associations/...`)
association APIs coexist. v4 is preferred for new work — it supports labeled
association types and has a cleaner URL structure.

---

## API Facts

| Property | Value |
|---|---|
| Contact → Company type ID | 1 |
| Contact → Deal type ID | 3 |
| Idempotent create | Yes |
| Delete scope (no type) | Removes ALL types between two objects |
| Preferred version | v4 |
```

- [ ] **Step 4: Commit**

```bash
git add skills/manage-contacts.md skills/manage-lists-hubspot.md skills/manage-associations.md
git commit -m "feat: add three HubSpot domain skill files (Contacts, Lists, Associations)"
```

---

### Task 2: HubSpot companion skill

**Files:**
- Create: `skills/hubspot-api.md`

**Interfaces:**
- Consumes: content from Task 1 skill files (cross-references by operation name)
- Produces: runtime companion skill consumed by MCP server and implementers

- [ ] **Step 1: Write `skills/hubspot-api.md`**

```markdown
# HubSpot API — MCP Companion Skill

Load this file at session start when driving the HubSpot MCP server.
It contains the behavioral knowledge the tool descriptions alone cannot convey.

---

## Auth

Every request requires:

```
Authorization: Bearer {HUBSPOT_SERVICE_KEY}
Content-Type: application/json
```

Source the token from the `HUBSPOT_SERVICE_KEY` environment variable.
Never hardcode it. This is a Bearer token format — different from platforms
that use custom header names (e.g. Klaviyo's `Klaviyo-API-Key`).

---

## Manage Contacts — Skill 4

### Before calling `create_contact` (POST /crm/v3/objects/contacts)

- **Creates a new record every time** — does NOT check for existing email.
  If the email already exists, a duplicate contact is created. No error.
- For safe deduplication, use `batch_upsert_contacts`
  (POST /crm/v3/objects/contacts/batch/upsert) with `idProperty: "email"`.

### Before calling `archive_contact` (DELETE /crm/v3/objects/contacts/{id})

- Soft delete only — contact is archived, not removed.
- Archived contacts are hidden from search results by default.
  Pass `archived=true` to include them.

### Rate limit

100 requests / 10 seconds. On 429, read the `Retry-After` header and wait.

---

## Manage Lists — Skill 5

### Before calling `create_list` (POST /crm/v3/lists)

- `processingType` is **permanent** — set correctly at creation.
  - `MANUAL`: membership is writable via add/remove calls
  - `DYNAMIC`: membership is computed from a filter, not writable
- Always include `objectTypeId: "0-1"` for contact lists.

### Before calling `add_list_members` (PUT /crm/v3/lists/{id}/memberships/add)

- **Only works on MANUAL lists.**
- Called on a DYNAMIC list: returns HTTP 200, does nothing, no error.
- Check `processingType` before calling if unsure of list type.

---

## Manage Associations — Skill 6

### Before calling `create_association` (PUT /crm/v4/objects/.../associations/...)

- Association type IDs are magic numbers you must know in advance:
  contact→company = `1`, contact→deal = `3`, contact→ticket = `16`.
- For the default contact→company association, use the `/default` endpoint
  to avoid specifying a type ID.
- Association creation is **idempotent** — safe to call multiple times.

### Before calling `delete_association`

- Without a type ID: removes ALL association types between the two objects.
- To delete a specific type only, include the type ID in the URL.

---

## Cross-Object Interaction — Contacts + Associations

Typical sequence for linking a contact to a company:

1. `POST /crm/v3/objects/contacts/batch/upsert` — create/upsert contact
2. `POST /crm/v3/objects/companies` — create company (or look up existing)
3. `PUT /crm/v4/objects/contacts/{contactId}/associations/companies/{companyId}/default` — associate

Verify with:
`GET /crm/v4/objects/contacts/{contactId}/associations/companies`

---

## Known Live Issues

| Issue | Symptom | Resolution |
|---|---|---|
| Duplicate contacts | POST /crm/v3/objects/contacts creates duplicate | Use batch upsert with idProperty=email |
| Silent add-to-list failure | 200 returned but contact not in DYNAMIC list | DYNAMIC lists don't accept manual membership — this is by design |
| Association delete too broad | All links between objects removed | Include associationTypeId in the DELETE URL |
```

- [ ] **Step 2: Commit**

```bash
git add skills/hubspot-api.md
git commit -m "feat: add HubSpot MCP companion skill file"
```

---

### Task 3: Backend — HubSpot router, config update, routing change, tests

**Files:**
- Modify: `backend/config.py` — add `hubspot_service_key`
- Create: `backend/hubspot.py` — FastAPI router with `/run` endpoint
- Modify: `backend/main.py` — mount HubSpot router at `/demo/hubspot`; move Klaviyo router from `/demo` to `/demo/klaviyo`
- Create: `backend/tests/test_hubspot.py`

**Interfaces:**
- Consumes: `settings.hubspot_service_key`, `settings.demo_secret` from config
- Produces:
  - `POST /demo/hubspot/run` → `{"steps": [...], "contact_id": str, "company_id": str}`
  - `POST /demo/klaviyo/run` (Klaviyo path updated — was `/demo/run`)

**IMPORTANT:** Moving the Klaviyo router from `/demo` to `/demo/klaviyo` breaks the existing `/demo/run` endpoint. This is intentional — Task 5 updates the prototype to use `/demo/klaviyo/run`. Both tasks must be deployed together (one push covers both).

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/test_hubspot.py`:

```python
import os
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.skipif(
    not os.getenv("HUBSPOT_SERVICE_KEY"),
    reason="HUBSPOT_SERVICE_KEY not set in environment"
)
def test_hubspot_run_returns_expected_shape():
    r = client.post("/demo/hubspot/run", headers={"X-Demo-Key": ""})
    assert r.status_code == 200
    data = r.json()
    assert "steps" in data
    assert "contact_id" in data
    assert "company_id" in data


@pytest.mark.skipif(
    not os.getenv("HUBSPOT_SERVICE_KEY"),
    reason="HUBSPOT_SERVICE_KEY not set in environment"
)
def test_hubspot_run_steps_have_ok_status():
    r = client.post("/demo/hubspot/run", headers={"X-Demo-Key": ""})
    assert r.status_code == 200
    steps = r.json()["steps"]
    assert all(s["status"] == "ok" for s in steps)
    assert len(steps) == 3
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
source .venv/bin/activate && pytest backend/tests/test_hubspot.py -v
```

Expected: `test_health` PASSES (health endpoint already exists). The two HubSpot tests SKIP (token not in env... wait, actually it IS in .env now). If `HUBSPOT_SERVICE_KEY` is in `.env`, the live tests will run and FAIL with import errors until hubspot.py exists.

- [ ] **Step 3: Update `backend/config.py`**

Full file content:

```python
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    klaviyo_api_key: str = Field(alias="KLAVIYO_PRIVATE_API_KEY")
    klaviyo_revision: str = "2024-10-15"
    klaviyo_base_url: str = "https://a.klaviyo.com"
    demo_secret: str = Field(default="", alias="DEMO_SECRET")
    hubspot_service_key: str = Field(default="", alias="HUBSPOT_SERVICE_KEY")

    model_config = {"env_file": ".env", "populate_by_name": True, "extra": "ignore"}


settings = Settings()
```

- [ ] **Step 4: Create `backend/hubspot.py`**

```python
import httpx
import uuid
from fastapi import APIRouter, Header, HTTPException
from backend.config import settings

router = APIRouter()

BASE = "https://api.hubapi.com"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.hubspot_service_key}",
        "Content-Type": "application/json",
    }


async def _post(client: httpx.AsyncClient, path: str, body: dict) -> dict:
    r = await client.post(f"{BASE}{path}", json=body, headers=_headers())
    if r.status_code not in (200, 201):
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json()


async def _put(client: httpx.AsyncClient, path: str, body=None) -> dict:
    r = await client.put(f"{BASE}{path}", json=body, headers=_headers())
    if r.status_code not in (200, 201):
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json() if r.content else {}


@router.post("/run")
async def run_demo(x_demo_key: str = Header(default="")):
    if settings.demo_secret and x_demo_key != settings.demo_secret:
        raise HTTPException(status_code=401, detail="Invalid demo key")
    if not settings.hubspot_service_key:
        raise HTTPException(status_code=503, detail="HUBSPOT_SERVICE_KEY not configured")

    results = []
    run_id = uuid.uuid4().hex[:8]

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1 (Skill 4): Create contact
        contact = await _post(client, "/crm/v3/objects/contacts", {
            "properties": {
                "email": f"demo-{run_id}@example.com",
                "firstname": "Demo",
                "lastname": f"User {run_id}",
                "hs_lead_status": "IN_PROGRESS",
            }
        })
        contact_id = contact["id"]
        results.append({"step": "create_contact", "id": contact_id, "status": "ok"})

        # Step 2 (Skill 6): Create company to associate with
        company = await _post(client, "/crm/v3/objects/companies", {
            "properties": {
                "name": f"Demo Company {run_id}",
                "domain": f"demo-{run_id}.example.com",
            }
        })
        company_id = company["id"]
        results.append({"step": "create_company", "id": company_id, "status": "ok"})

        # Step 3 (Skill 6): Associate contact → company (default type = contact_to_company)
        await _put(
            client,
            f"/crm/v4/objects/contacts/{contact_id}/associations/companies/{company_id}/default"
        )
        results.append({
            "step": "associate_contact_company",
            "association": f"contact {contact_id} → company {company_id}",
            "status": "ok",
        })

    return {
        "steps": results,
        "contact_id": contact_id,
        "company_id": company_id,
    }
```

- [ ] **Step 5: Update `backend/main.py`**

Full file content — note Klaviyo prefix changes from `/demo` to `/demo/klaviyo`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.klaviyo import router as klaviyo_router
from backend.hubspot import router as hubspot_router

app = FastAPI(title="Martech Integration Builder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(klaviyo_router, prefix="/demo/klaviyo")
app.include_router(hubspot_router, prefix="/demo/hubspot")


@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 6: Run all tests**

```bash
source .venv/bin/activate && pytest backend/tests/ -v
```

Expected output:
```
backend/tests/test_enrich.py::test_enriches_profile_upsert PASSED
backend/tests/test_enrich.py::test_enriches_delete_job PASSED
backend/tests/test_enrich.py::test_enriches_list_subscribe PASSED
backend/tests/test_enrich.py::test_enriches_segment_create PASSED
backend/tests/test_enrich.py::test_preserves_existing_description PASSED
backend/tests/test_enrich.py::test_skips_unmatched_paths PASSED
backend/tests/test_enrich.py::test_does_not_mutate_input PASSED
backend/tests/test_enrich.py::test_handles_missing_description_key PASSED
backend/tests/test_hubspot.py::test_health PASSED
backend/tests/test_hubspot.py::test_hubspot_run_returns_expected_shape PASSED
backend/tests/test_hubspot.py::test_hubspot_run_steps_have_ok_status PASSED
backend/tests/test_klaviyo.py::test_health PASSED
backend/tests/test_klaviyo.py::test_run_demo_returns_expected_shape PASSED
backend/tests/test_klaviyo.py::test_run_demo_steps_have_ok_status PASSED
```

Note: `test_klaviyo.py` still calls `/demo/run` — you need to update it to `/demo/klaviyo/run` before running. Edit `backend/tests/test_klaviyo.py`:
- Change `client.post("/demo/run", ...)` → `client.post("/demo/klaviyo/run", ...)`

- [ ] **Step 7: Commit**

```bash
git add backend/config.py backend/hubspot.py backend/main.py backend/tests/test_hubspot.py backend/tests/test_klaviyo.py
git commit -m "feat: add HubSpot backend router; move Klaviyo to /demo/klaviyo prefix"
```

---

### Task 4: HubSpot enrichment rules

**Files:**
- Modify: `backend/enrich.py` — add 4 HubSpot enrichment entries
- Modify: `backend/tests/test_enrich.py` — add 3 HubSpot enrichment tests

**Interfaces:**
- Consumes: `enrich_spec()` from `backend/enrich.py` (unchanged signature)
- Produces: enriched HubSpot spec operations with behavioral descriptions

**Note:** HubSpot's OpenAPI spec paths come from the public spec collection at https://github.com/HubSpot/HubSpot-public-api-spec-collection/tree/main/PublicApiSpecs. Before adding enrichment keys, verify the exact path strings used in the Contacts, Lists, and Associations spec files — they must match exactly. Look at the `paths` keys in those JSON files. The paths below are expected based on HubSpot's documented API but **must be confirmed against the actual spec files** before committing.

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/test_enrich.py` (append after existing tests):

```python
def test_enriches_hubspot_contact_single_create():
    result = enrich_spec(_spec("/crm/v3/objects/contacts", "post"))
    desc = result["paths"]["/crm/v3/objects/contacts"]["post"]["description"]
    assert "duplicate" in desc.lower()


def test_enriches_hubspot_list_create():
    result = enrich_spec(_spec("/crm/v3/lists", "post"))
    desc = result["paths"]["/crm/v3/lists"]["post"]["description"]
    assert "processingType" in desc or "MANUAL" in desc


def test_enriches_hubspot_association_create():
    path = "/crm/v4/objects/{fromObjectType}/{fromObjectId}/associations/{toObjectType}/{toObjectId}"
    result = enrich_spec(_spec(path, "put"))
    desc = result["paths"][path]["put"]["description"]
    assert "type ID" in desc or "magic" in desc.lower()
```

- [ ] **Step 2: Run new tests — verify they fail**

```bash
source .venv/bin/activate && pytest backend/tests/test_enrich.py::test_enriches_hubspot_contact_single_create backend/tests/test_enrich.py::test_enriches_hubspot_list_create backend/tests/test_enrich.py::test_enriches_hubspot_association_create -v
```

Expected: all 3 FAIL (paths not in ENRICHMENTS yet).

- [ ] **Step 3: Add HubSpot enrichment rules to `backend/enrich.py`**

Add to the `ENRICHMENTS` dict (append after the last Klaviyo entry):

```python
    ("post", "/crm/v3/objects/contacts"): (
        "⚠️ Creates a NEW contact record every time — does NOT deduplicate on email. "
        "If a contact with the same email already exists, a duplicate is created silently. "
        "For safe upsert, use POST /crm/v3/objects/contacts/batch/upsert with idProperty: 'email'."
    ),
    ("post", "/crm/v3/objects/contacts/batch/upsert"): (
        "✅ Safe upsert: deduplicates on the specified idProperty (use 'email' for email-based dedup). "
        "Existing contacts are updated; new contacts are created. "
        "Rate limit: 100 requests / 10 seconds. On 429, read Retry-After header."
    ),
    ("post", "/crm/v3/lists"): (
        "⚠️ processingType is permanent — cannot be changed after creation. "
        "MANUAL = writable membership (add/remove via API). "
        "DYNAMIC = computed from a filter; membership is not writable. "
        "Adding a contact to a DYNAMIC list returns HTTP 200 and silently does nothing. "
        "Always include objectTypeId: '0-1' for contact lists."
    ),
    ("put", "/crm/v4/objects/{fromObjectType}/{fromObjectId}/associations/{toObjectType}/{toObjectId}"): (
        "⚠️ Association type IDs are magic numbers: contact→company = 1, contact→deal = 3, contact→ticket = 16. "
        "These are not returned by the API in human-readable form — you must know them. "
        "Association creation is idempotent (safe to repeat). "
        "DELETE without a type ID removes ALL association types between two objects — "
        "include the type ID in the DELETE URL to remove only a specific type."
    ),
```

- [ ] **Step 4: Run all enrich tests — verify they pass**

```bash
source .venv/bin/activate && pytest backend/tests/test_enrich.py -v
```

Expected: 11 tests PASS (8 existing + 3 new).

- [ ] **Step 5: Commit**

```bash
git add backend/enrich.py backend/tests/test_enrich.py
git commit -m "feat: add HubSpot enrichment rules for Contacts, Lists, Associations"
```

---

### Task 5: Prototype platform selector

**Files:**
- Modify: `index.html` — PLATFORMS config + functional platform toggle + config-driven Screen 1/3/4/5
- Modify: `06-end-to-end-flow.html` — identical changes (keep in sync)

**Interfaces:**
- Consumes: `/demo/klaviyo/run` (updated from `/demo/run`) and `/demo/hubspot/run` from backend
- Produces: working two-platform prototype deployed via GitHub Pages

**What changes:**
1. Screen 1 — Platform toggle becomes functional (HubSpot button added); scenario buttons rendered from `PLATFORMS[selectedPlatform].scenarios`; URL examples update per platform
2. Screen 3 — Warning items rendered from `PLATFORMS[selectedPlatform].scenarios[selectedScenarioIndex].warnings`; acknowledgment checkboxes rendered from config
3. Screen 4 — Tool chips rendered from `PLATFORMS[selectedPlatform].tools`; subtitle includes platform name
4. Screen 5 — `runLiveDemo()` uses `PLATFORMS[selectedPlatform].demoEndpoint`; Klaviyo polls, HubSpot does not

**Approach:** Read the current `index.html` carefully before editing. The PLATFORMS config goes in the `<script>` block near the top (after the `const BACKEND_URL` line). All hardcoded Klaviyo content in Screens 1, 3, 4, 5 gets replaced with calls to rendering functions that read from `PLATFORMS`.

- [ ] **Step 1: Read the current `index.html`** — understand the existing structure before changing it. Specifically read: the Screen 1 scenario toggle HTML, the Screen 3 warning-list HTML, the Screen 4 gen-tools HTML, and the `runLiveDemo()` function. Verify line numbers for each section.

- [ ] **Step 2: Add the PLATFORMS config to `index.html`**

In the `<script>` block, after `const BACKEND_URL = '...';`, add the full PLATFORMS config:

```js
let selectedPlatform = 'klaviyo';
let selectedScenarioIndex = 0;

const PLATFORMS = {
  klaviyo: {
    name: 'Klaviyo',
    scenarios: [
      {
        name: 'Manage Profiles',
        skillLabel: 'Skill 1',
        description: 'Upsert, delete, and export contact profiles',
        warnings: [
          { sev: 'sev-red', icon: '🔴', title: 'Profile delete is async and irreversible',
            desc: '<code style="font-family:\'IBM Plex Mono\',monospace;font-size:11px">POST /api/data-privacy-deletion-jobs</code> submits a request — the profile is not gone immediately. No soft-delete, no undo. Rate limit is 60/min steady, far below profile writes. A 401 immediately after an API revision bump is not a bad key — confirmed live issue, April 2026.' },
          { sev: 'sev-amber', icon: '🟡', title: 'Upsert is silent — no create vs. update distinction',
            desc: 'Re-sending the same email or external ID silently overwrites the existing profile. No error, no duplicate. Design your pipeline to treat every <code style="font-family:\'IBM Plex Mono\',monospace;font-size:11px">POST /api/profiles</code> as an overwrite.' },
        ],
        acks: [
          { id: 'ack-delete', label: 'I understand that profile deletion is async, irreversible, and rate-limited at 60/min. I will test the delete step before running a live demo.' },
        ]
      },
      {
        name: 'Manage Audiences — Lists',
        skillLabel: 'Skill 2',
        description: 'Add, remove, and subscribe contacts to lists',
        warnings: [
          { sev: 'sev-red', icon: '🔴', title: 'Two list add-member paths — different consent outcomes',
            desc: '<code style="font-family:\'IBM Plex Mono\',monospace;font-size:11px">subscribe</code> is consent-aware but returns 200 empty and adds nobody if double opt-in is on (Klaviyo\'s default). <code style="font-family:\'IBM Plex Mono\',monospace;font-size:11px">relationships/profiles</code> adds immediately but grants no consent. Both look identical in the response.' },
          { sev: 'sev-info', icon: 'ℹ️', title: 'Add member requires a profile ID, not an email',
            desc: 'For a net-new contact, this is a two-step sequence: create/resolve the profile first, get back an ID, then add to the list by ID. The Bulk Profile Import API can do both in one call.' },
          { sev: 'sev-amber', icon: '🟡', title: 'Remove from list ≠ unsubscribe',
            desc: 'Removing a profile from a list does not revoke marketing consent. Use the Profile Suppression endpoint to stop communications.' },
        ],
        acks: [
          { id: 'ack-subscribe', label: 'I understand the two list add-member paths have different consent semantics and will confirm double opt-in settings before testing the subscribe endpoint.' },
        ]
      },
      {
        name: 'Manage Segments',
        skillLabel: 'Skill 3',
        description: 'Create and read rule-based audience segments',
        warnings: [
          { sev: 'sev-red', icon: '🔴', title: 'Segment creation: 100/day hard daily cap',
            desc: 'Burst 1/s, steady 15/min, and a hard 100-per-day ceiling. A loop exhausts quota silently before the failure pattern becomes obvious. Segment membership is computed — you cannot add or remove members directly.' },
          { sev: 'sev-amber', icon: '🟡', title: 'Empty segment after creation = data quality signal, not config error',
            desc: 'If a newly created segment has zero members, the most likely cause is that no profiles have the property values the rule references — not that the rule is wrong. Verify profile data exists before debugging the segment definition. Membership updates 10–60 seconds after a matching profile is upserted.' },
          { sev: 'sev-info', icon: 'ℹ️', title: 'Segment membership is not writable — by design',
            desc: 'There is no add-member or remove-member endpoint for segments. To change who is in a segment, change the rule. This is intentional CDP behavior.' },
        ],
        acks: [
          { id: 'ack-segments', label: 'I understand that segment membership is computed automatically and cannot be set manually, and that the daily cap is 100 segments.' },
        ]
      },
    ],
    tools: [
      'upsert_profile','delete_profile','list_profiles',
      'create_list','add_list_member','remove_list_member','delete_list',
      'create_segment','get_segment','delete_segment',
    ],
    toolCount: 10,
    demoEndpoint: '/demo/klaviyo/run',
    demoPollPath: (segId) => `/demo/klaviyo/segment/${segId}/members`,
    screen4Sub: 'Running <code style="font-family:\'IBM Plex Mono\',monospace">openapi-mcp</code> against the enriched Klaviyo spec, scoped to the 10 confirmed operations. Behavioral warnings are embedded in tool descriptions.',
    screen5Desc: 'Real API calls against a Klaviyo free-tier account. Segment membership computed automatically — no add-member call.',
    specExamples: [
      { tag: 'Profiles', text: 'raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/categories/profiles.json' },
      { tag: 'Lists', text: 'raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/categories/lists.json' },
      { tag: 'Segments', text: 'raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/categories/segments.json' },
      { tag: 'Data Privacy', text: 'raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/categories/data_privacy.json' },
    ],
    pasteExample: `{\n  "openapi": "3.0.0",\n  "info": { "title": "Klaviyo API", "version": "2024-10-15" },\n  "servers": [{ "url": "https://a.klaviyo.com" }],\n  "paths": {\n    "/api/profiles": {\n      "post": { "operationId": "createProfile", "tags": ["Profiles"] },\n      "get":  { "operationId": "getProfiles", "tags": ["Profiles"] }\n    },\n    "/api/data-privacy-deletion-jobs": {\n      "post": { "operationId": "requestProfileDeletion", "tags": ["Data Privacy"] }\n    },\n    "/api/lists": {\n      "post": { "operationId": "createList", "tags": ["Lists"] }\n    }\n  }\n}`,
  },

  hubspot: {
    name: 'HubSpot',
    scenarios: [
      {
        name: 'Manage Contacts',
        skillLabel: 'Skill 4',
        description: 'Create, upsert, update, and archive contacts',
        warnings: [
          { sev: 'sev-red', icon: '🔴', title: 'Single-object create duplicates on existing email',
            desc: '<code style="font-family:\'IBM Plex Mono\',monospace;font-size:11px">POST /crm/v3/objects/contacts</code> creates a new record every time. If the email already exists, a duplicate is created silently — no 409, no error. Use the batch upsert endpoint with <code style="font-family:\'IBM Plex Mono\',monospace;font-size:11px">idProperty: "email"</code> for safe deduplication.' },
          { sev: 'sev-amber', icon: '🟡', title: 'Archive ≠ delete — no hard delete via API',
            desc: 'The DELETE endpoint archives the contact (soft delete). Archived contacts are hidden from search results by default but can be retrieved with <code style="font-family:\'IBM Plex Mono\',monospace;font-size:11px">archived=true</code>. There is no permanent removal via the CRM v3 API.' },
          { sev: 'sev-info', icon: 'ℹ️', title: 'Auth format: Bearer token',
            desc: 'HubSpot uses <code style="font-family:\'IBM Plex Mono\',monospace;font-size:11px">Authorization: Bearer {token}</code> — not a custom header name like some other platforms. Rate limit: 100 req / 10s. On 429, read the <code style="font-family:\'IBM Plex Mono\',monospace;font-size:11px">Retry-After</code> header.' },
        ],
        acks: [
          { id: 'ack-hs-contacts', label: 'I understand that single-object contact creation does not deduplicate and will use batch upsert with idProperty=email for safe upsert operations.' },
        ]
      },
      {
        name: 'Manage Lists',
        skillLabel: 'Skill 5',
        description: 'Create and manage static and dynamic contact lists',
        warnings: [
          { sev: 'sev-red', icon: '🔴', title: 'processingType is permanent — MANUAL vs DYNAMIC cannot be changed',
            desc: 'Set <code style="font-family:\'IBM Plex Mono\',monospace;font-size:11px">processingType</code> correctly at creation. <code style="font-family:\'IBM Plex Mono\',monospace;font-size:11px">MANUAL</code> lists accept add/remove calls. <code style="font-family:\'IBM Plex Mono\',monospace;font-size:11px">DYNAMIC</code> lists compute membership from a filter rule. Once set, processingType cannot be changed.' },
          { sev: 'sev-red', icon: '🔴', title: 'Adding contact to DYNAMIC list returns 200 and silently does nothing',
            desc: 'The add-members endpoint returns HTTP 200 on DYNAMIC lists with no indication of failure. The contact is not added — membership is computed only. This is the same pattern as Klaviyo\'s segments but called a "list" here.' },
          { sev: 'sev-info', icon: 'ℹ️', title: 'Always include objectTypeId for contact lists',
            desc: '<code style="font-family:\'IBM Plex Mono\',monospace;font-size:11px">objectTypeId: "0-1"</code> specifies that this is a contact list. Omitting it may cause unexpected behavior.' },
        ],
        acks: [
          { id: 'ack-hs-lists', label: 'I understand that DYNAMIC lists do not accept manual membership writes and that processingType is permanent at creation.' },
        ]
      },
      {
        name: 'Manage Associations',
        skillLabel: 'Skill 6',
        description: 'Link contacts to companies, deals, and tickets',
        warnings: [
          { sev: 'sev-red', icon: '🔴', title: 'Association type IDs are magic numbers',
            desc: 'The type ID is required to create or delete specific association types. Contact→Company = <code style="font-family:\'IBM Plex Mono\',monospace;font-size:11px">1</code>, Contact→Deal = <code style="font-family:\'IBM Plex Mono\',monospace;font-size:11px">3</code>, Contact→Ticket = <code style="font-family:\'IBM Plex Mono\',monospace;font-size:11px">16</code>. These are not returned by the API in human-readable form.' },
          { sev: 'sev-red', icon: '🔴', title: 'Delete without type ID removes ALL associations between two objects',
            desc: 'Calling DELETE on an association without specifying a type ID removes every association type between the two objects — not just the default one. Include the type ID in the URL to scope the deletion.' },
          { sev: 'sev-info', icon: 'ℹ️', title: 'v3 and v4 association APIs coexist',
            desc: 'Prefer the v4 API (<code style="font-family:\'IBM Plex Mono\',monospace;font-size:11px">/crm/v4/objects/.../associations/...</code>) for new work. The v3 API (<code style="font-family:\'IBM Plex Mono\',monospace;font-size:11px">/crm/v3/associations/...</code>) has a different URL structure and response shape.' },
        ],
        acks: [
          { id: 'ack-hs-assoc', label: 'I understand that association type IDs are magic numbers and that deleting without a type ID removes all associations between two objects.' },
        ]
      },
    ],
    tools: [
      'create_contact','batch_upsert_contacts','update_contact','archive_contact','search_contacts',
      'create_list','add_list_members','remove_list_members','get_list_memberships',
      'create_association','get_associations','delete_association',
    ],
    toolCount: 12,
    demoEndpoint: '/demo/hubspot/run',
    demoPollPath: null,
    screen4Sub: 'Running <code style="font-family:\'IBM Plex Mono\',monospace">openapi-mcp</code> against the enriched HubSpot spec, scoped to the 12 confirmed operations. Behavioral warnings are embedded in tool descriptions.',
    screen5Desc: 'Real API calls against a HubSpot free account. Creates a contact, creates a company, then associates them — demonstrating the cross-object linking model.',
    specExamples: [
      { tag: 'Contacts', text: 'raw.githubusercontent.com/HubSpot/HubSpot-public-api-spec-collection/main/PublicApiSpecs/Crm/Contacts.json' },
      { tag: 'Lists', text: 'raw.githubusercontent.com/HubSpot/HubSpot-public-api-spec-collection/main/PublicApiSpecs/Crm/Lists.json' },
      { tag: 'Associations', text: 'raw.githubusercontent.com/HubSpot/HubSpot-public-api-spec-collection/main/PublicApiSpecs/Crm/Associations.json' },
    ],
    pasteExample: `{\n  "openapi": "3.0.0",\n  "info": { "title": "HubSpot CRM API", "version": "v3" },\n  "servers": [{ "url": "https://api.hubapi.com" }],\n  "paths": {\n    "/crm/v3/objects/contacts": {\n      "post": { "operationId": "createContact", "tags": ["Contacts"] },\n      "get":  { "operationId": "listContacts", "tags": ["Contacts"] }\n    },\n    "/crm/v3/lists": {\n      "post": { "operationId": "createList", "tags": ["Lists"] }\n    }\n  }\n}`,
  },
};
```

- [ ] **Step 3: Add rendering functions to the `<script>` block**

Add these functions after the PLATFORMS config:

```js
function switchPlatform(platform) {
  selectedPlatform = platform;
  selectedScenarioIndex = 0;
  document.querySelectorAll('.platform-btn').forEach(b => b.classList.toggle('selected', b.dataset.platform === platform));
  renderScenarioButtons();
  renderUrlExamples();
  updatePasteExample();
}

function renderScenarioButtons() {
  const p = PLATFORMS[selectedPlatform];
  const container = document.getElementById('scenario-toggle');
  container.innerHTML = p.scenarios.map((s, i) => `
    <button class="toggle-btn${i === selectedScenarioIndex ? ' selected' : ''}"
      onclick="selectScenarioIndex(${i})">${s.name}</button>
  `).join('');
}

function selectScenarioIndex(i) {
  selectedScenarioIndex = i;
  document.querySelectorAll('#scenario-toggle .toggle-btn').forEach((b, idx) =>
    b.classList.toggle('selected', idx === i));
}

function renderUrlExamples() {
  const examples = PLATFORMS[selectedPlatform].specExamples;
  const container = document.getElementById('url-examples');
  if (!container) return;
  container.innerHTML = examples.map(e => `
    <div class="url-example">
      <span class="url-example-tag">${e.tag}</span>
      <span class="url-example-text">${e.text}</span>
    </div>
  `).join('');
}

function updatePasteExample() {
  const ta = document.querySelector('.spec-input');
  if (ta) ta.value = PLATFORMS[selectedPlatform].pasteExample;
}

function renderWarnings() {
  const scenario = PLATFORMS[selectedPlatform].scenarios[selectedScenarioIndex];
  const wList = document.getElementById('warning-list');
  const ackSection = document.getElementById('ack-section');
  if (!wList || !scenario) return;

  wList.innerHTML = scenario.warnings.map(w => `
    <div class="warning-item ${w.sev}">
      <div class="warn-icon">${w.icon}</div>
      <div class="warn-body">
        <div class="warn-title">${w.title}</div>
        <div class="warn-desc">${w.desc}</div>
      </div>
    </div>
  `).join('');

  ackSection.innerHTML = `
    <div class="ack-label">Required acknowledgments</div>
    ${scenario.acks.map(a => `
      <div class="ack-item">
        <input type="checkbox" id="${a.id}" onchange="checkAcks()">
        <label for="${a.id}">${a.label}</label>
      </div>
    `).join('')}
  `;
}

function renderScreen4() {
  const p = PLATFORMS[selectedPlatform];
  const sub = document.getElementById('screen4-sub');
  const badge = document.getElementById('screen4-badge');
  const grid = document.getElementById('tool-grid');
  if (sub) sub.innerHTML = p.screen4Sub;
  if (badge) badge.textContent = `✓ ${p.toolCount} tools generated`;
  if (grid) grid.innerHTML = p.tools.map(t => `<div class="tool-chip">${t}</div>`).join('');
}

function renderScreen5() {
  const p = PLATFORMS[selectedPlatform];
  const sub = document.getElementById('screen5-sub');
  if (sub) sub.textContent = p.screen5Desc;
}
```

- [ ] **Step 4: Update `goTo()` to call render functions on screen transitions**

Find the existing `goTo()` function and add render calls for screens 3, 4, and 5:

```js
function goTo(n) {
  if (n < 1 || n > total) return;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${n}`).classList.add('active');
  document.querySelectorAll('.step-pip').forEach((p, i) => {
    p.classList.toggle('active', i + 1 === n);
    p.classList.toggle('visited', i + 1 < n);
  });
  current = n;
  if (n === 3) renderWarnings();
  if (n === 4) renderScreen4();
  if (n === 5) renderScreen5();
}
```

- [ ] **Step 5: Update Screen 1 HTML — platform toggle and scenario container**

Replace the existing platform toggle `<div>` (currently shows only "Klaviyo" as a non-functional button) with:

```html
<div class="field-group">
  <span class="field-label">Platform</span>
  <div class="toggle-group">
    <button class="platform-btn toggle-btn selected" data-platform="klaviyo" onclick="switchPlatform('klaviyo')">Klaviyo</button>
    <button class="platform-btn toggle-btn" data-platform="hubspot" onclick="switchPlatform('hubspot')">HubSpot</button>
  </div>
</div>
```

Replace the existing scenario toggle `<div class="toggle-group">` (currently three hardcoded Klaviyo buttons) with:

```html
<div class="toggle-group" id="scenario-toggle">
  <!-- rendered by renderScenarioButtons() on load and on platform switch -->
</div>
```

Replace the URL examples container with:

```html
<div class="url-examples" id="url-examples">
  <!-- rendered by renderUrlExamples() on load and on platform switch -->
</div>
```

- [ ] **Step 6: Update Screen 3 HTML — dynamic warning container**

Replace the hardcoded `<div class="warning-list">...</div>` and `<div class="ack-section">...</div>` blocks with:

```html
<div class="warning-list" id="warning-list">
  <!-- rendered by renderWarnings() when navigating to screen 3 -->
</div>
<div class="ack-section" id="ack-section">
  <!-- rendered by renderWarnings() -->
</div>
```

- [ ] **Step 7: Update Screen 4 HTML — dynamic tool chips and subtitle**

Add `id` attributes to the elements that need to update:

```html
<div class="screen-sub" id="screen4-sub"><!-- rendered by renderScreen4() --></div>
...
<span class="gen-success-badge" id="screen4-badge">✓ 10 tools generated</span>
...
<div class="tool-grid" id="tool-grid">
  <!-- rendered by renderScreen4() -->
</div>
```

- [ ] **Step 8: Update Screen 5 subtitle and `runLiveDemo()` function**

Add `id="screen5-sub"` to Screen 5's subtitle element.

Replace the existing `runLiveDemo()` function with a platform-aware version:

```js
async function runLiveDemo() {
  const platform = PLATFORMS[selectedPlatform];
  const btn = document.querySelector('[onclick="runLiveDemo()"]');
  if (btn) btn.disabled = true;

  const demoKey = (document.getElementById('demo-password')?.value || '').trim();
  const container = document.getElementById('live-steps');
  if (!container) return;
  container.innerHTML = '<p style="color:var(--ink-muted);font-size:13px">Calling API…</p>';

  try {
    const run = await fetch(`${BACKEND_URL}${platform.demoEndpoint}`, {
      method: 'POST',
      headers: { 'X-Demo-Key': demoKey }
    });
    if (!run.ok) throw new Error(`${platform.demoEndpoint} returned ${run.status}`);
    const result = await run.json();

    // Render initial steps
    const stepsHtml = result.steps.map(s => `
      <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--green);font-weight:600;min-width:16px">✓</span>
        <div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:500">${s.step}</div>
          ${s.id ? `<div style="font-size:12px;color:var(--ink-muted)">id: ${s.id}</div>` : ''}
          ${s.association ? `<div style="font-size:12px;color:var(--ink-muted)">${s.association}</div>` : ''}
          ${s.message ? `<div style="font-size:12px;color:var(--ink-muted)">${s.message}</div>` : ''}
        </div>
        <span style="margin-left:auto;font-size:11px;color:var(--green)">${s.status}</span>
      </div>
    `).join('');
    container.innerHTML = stepsHtml;

    if (platform.demoPollPath) {
      // Klaviyo: poll for segment membership
      const segmentId = result.segment_id;
      if (!segmentId) throw new Error('segment_id missing from demo/run response');

      const countdownEl = document.createElement('p');
      countdownEl.style.cssText = 'font-size:13px;color:var(--ink-muted);margin-top:12px';
      container.appendChild(countdownEl);

      let remaining = 45;
      const tick = setInterval(() => {
        remaining--;
        countdownEl.textContent = `Waiting for Klaviyo to compute segment membership… ${remaining}s`;
        if (remaining <= 0) clearInterval(tick);
      }, 1000);

      await new Promise(r => setTimeout(r, 45000));
      clearInterval(tick);

      const poll = await fetch(`${BACKEND_URL}${platform.demoPollPath(segmentId)}`);
      if (!poll.ok) throw new Error(`poll returned ${poll.status}`);
      const members = await poll.json();

      countdownEl.innerHTML = `
        <span style="color:var(--green);font-weight:600">✓ Segment has ${members.member_count} member(s)</span>
        — profile enrolled automatically via property match. No add-member call made.
      `;
    }

  } catch (err) {
    container.innerHTML = `<p style="color:var(--red)">${err.message} — is the backend running at ${BACKEND_URL}?</p>`;
  } finally {
    if (btn) btn.disabled = false;
  }
}
```

- [ ] **Step 9: Add initialization call at the end of the `<script>` block**

Add before the closing `</script>` tag:

```js
// Initialize platform-driven UI on load
renderScenarioButtons();
renderUrlExamples();
```

- [ ] **Step 10: Apply identical changes to `06-end-to-end-flow.html`**

The two files must stay in sync. Apply every change from Steps 2–9 to `06-end-to-end-flow.html`. The only difference is that `06-end-to-end-flow.html` keeps `BACKEND_URL = 'http://localhost:8000'` while `index.html` keeps `BACKEND_URL = 'https://agent-integration.onrender.com'`.

- [ ] **Step 11: Run all backend tests before pushing**

```bash
source .venv/bin/activate && pytest backend/tests/ -v
```

All tests must pass before commit.

- [ ] **Step 12: Visual check — open `06-end-to-end-flow.html` in browser**

Verify:
- Platform toggle shows Klaviyo and HubSpot buttons
- Switching to HubSpot updates the scenario list to show Manage Contacts / Manage Lists / Manage Associations
- Switching back to Klaviyo restores Manage Profiles / Manage Audiences / Manage Segments
- Navigating to Screen 3 shows platform-appropriate warnings
- Navigating to Screen 4 shows platform-appropriate tool chips

- [ ] **Step 13: Commit and push**

```bash
git add index.html 06-end-to-end-flow.html
git commit -m "feat: add platform selector; HubSpot scenarios, warnings, tools config-driven"
git push origin main
```

---

## Self-Review

**Spec coverage check:**
- ✅ Three HubSpot skill files — Task 1
- ✅ Companion MCP skill — Task 2
- ✅ Backend router + config + tests — Task 3
- ✅ Enrichment rules + tests — Task 4
- ✅ Platform selector prototype refactor — Task 5
- ✅ HUBSPOT_SERVICE_KEY env var documented in config.py and .env.example
- ✅ Klaviyo router rename from /demo to /demo/klaviyo — Task 3 (main.py) + Task 5 (prototype)
- ✅ Both index.html and 06-end-to-end-flow.html updated

**Placeholder scan:** No TBDs. All warning text, tool names, and code is fully specified.

**Type consistency:**
- `PLATFORMS[selectedPlatform].demoEndpoint` used in `runLiveDemo()` ✅
- `PLATFORMS[selectedPlatform].demoPollPath` checked for null before polling ✅
- `selectedScenarioIndex` used in `renderWarnings()` to index `scenarios[]` ✅
- `id="scenario-toggle"` in HTML matches `document.getElementById('scenario-toggle')` in JS ✅
- `id="warning-list"` and `id="ack-section"` match renderWarnings() targets ✅
