# HubSpot Integration — Design Doc

**Date:** 2026-06-28
**Status:** Approved

---

## Goal

Extend the AI-Assisted Martech Integration Builder to support HubSpot as a second platform, proving the system is genuinely platform-agnostic rather than a Klaviyo-specific demo. The prototype gains a platform selector; all platform-specific content is driven by a config object so adding a third platform requires only a config entry.

---

## Skills (HubSpot)

Three integration scenarios, mirroring the Klaviyo structure but with HubSpot-specific gotchas:

### Skill 4: Manage Contacts

HubSpot's core CRM object. Analogous to Klaviyo's Manage Profiles.

**Key operations:** create/upsert contact, update properties, delete contact, search contacts.

**Gotchas:**
- No single upsert endpoint. The batch upsert endpoint (`POST /crm/v3/objects/contacts/batch/upsert`) deduplicates on a specified `idProperty` (typically `email`). The single-object endpoint (`POST /crm/v3/objects/contacts`) will create a duplicate if the email already exists — no 409, no error.
- Auth format is `Authorization: Bearer {HUBSPOT_PRIVATE_APP_TOKEN}` — different from Klaviyo's `Klaviyo-API-Key {key}` custom header.
- Rate limit: 100 requests / 10 seconds per token. 429 responses include a `Retry-After` header in seconds.
- Archived contacts (soft-deleted) are excluded from search results by default. Pass `archived=true` to include them. Hard delete is not available via API — contacts can only be archived.

### Skill 5: Manage Lists

HubSpot ILS (Integrated List Segmentation) lists. Analogous to Klaviyo's Manage Audiences — Lists + Segments combined.

**Key distinction:** `processingType` field at creation determines list behavior permanently:
- `MANUAL` — static list; membership is fully writable via add/remove member calls
- `DYNAMIC` — rule-based list; membership is computed from a filter definition and is not writable

**Gotchas:**
- Adding a contact to a `DYNAMIC` list returns HTTP 200 and silently does nothing. There is no error.
- `processingType` cannot be changed after creation. A MANUAL list cannot be converted to DYNAMIC.
- List membership for DYNAMIC lists updates within seconds to minutes depending on list size — faster than Klaviyo's 10–60s segment delay, but still async.
- `listId` (integer) and `listIlsFilterBranchType` are separate concepts; don't confuse list ID with filter branch ID.

### Skill 6: Manage Associations

HubSpot's mechanism for linking CRM objects (contacts, companies, deals, tickets). No direct Klaviyo equivalent — this skill exists only in HubSpot.

**Key operations:** create association, read associations, delete association.

**Gotchas:**
- Association type IDs are magic numbers not documented inline: contact→company = `1`, contact→deal = `3`, contact→ticket = `16`, company→deal = `5`. These must be known at call time — the API does not return human-readable type names in the association response.
- Association creation is idempotent: associating already-associated objects is safe (no error, no duplicate).
- Deletion without specifying a type ID removes ALL association types between two objects, not just one. Use `DELETE /crm/v4/objects/{fromObjectType}/{fromObjectId}/associations/{toObjectType}/{toObjectId}/{associationTypeId}` to delete a specific type.
- The v3 and v4 association APIs coexist with different URL structures and different response shapes. v4 is preferred for new work.

---

## Two-Layer Skill Delivery

Same pattern as Klaviyo:

**Layer 1 — Enriched OpenAPI spec:** HubSpot publishes official specs at `https://github.com/HubSpot/HubSpot-public-api-spec-collection`. Enrichment rules added to `backend/enrich.py` inject behavioral descriptions into the three target endpoint groups.

**Layer 2 — Companion skill file:** `skills/hubspot-api.md` — runtime LLM guidance covering auth format, per-skill gotchas, cross-object interaction sequence, and known live issues.

---

## Live Demo Sequence

Three-step cross-skill causation demo showing Contacts + Associations together:

1. **Skill 4 — Create contact** (`POST /crm/v3/objects/contacts`): upsert a contact with email and a custom property (`hs_lead_status: IN_PROGRESS`)
2. **Skill 6 — Create company** (`POST /crm/v3/objects/companies`): create a company object to associate with
3. **Skill 6 — Associate contact → company** (`PUT /crm/v4/objects/contacts/{id}/associations/companies/{companyId}/1`): link using association type ID 1

The demo shows that association type IDs are magic numbers (the "1" in the URL) — a concrete example of the kind of gotcha the skill system encodes. Unlike Klaviyo's async segment membership delay, this causation is synchronous: the association is immediately verifiable.

**Endpoint:** `POST /demo/hubspot/run`
**Response:** `{ steps, contact_id, company_id, association_type_id }`

Auth: `HUBSPOT_PRIVATE_APP_TOKEN` env var (Render + local `.env`).

---

## Prototype Changes

### Config-driven architecture

All platform-specific content extracted into a `PLATFORMS` config object:

```js
const PLATFORMS = {
  klaviyo: {
    name: 'Klaviyo',
    scenarios: [...],      // skill names, descriptions, HITL warnings
    demoEndpoint: '/demo/klaviyo/run',
    // ...
  },
  hubspot: {
    name: 'HubSpot',
    scenarios: [...],
    demoEndpoint: '/demo/hubspot/run',
    // ...
  }
};
```

The prototype reads from `PLATFORMS[selectedPlatform]` throughout. Switching platforms on Screen 1 resets scenario selection and re-renders all platform-specific UI.

### Screen 1 changes

- Platform toggle added above scenario selector: `[ Klaviyo ] [ HubSpot ]`
- Scenario list updates to show the selected platform's skills
- HITL warning counts update accordingly

### Screens 2–4

- Skill recommendation text, HITL warnings, and enriched spec content all driven from the platform config
- No structural changes to the screen layout

### Screen 5

- Demo calls `PLATFORMS[selectedPlatform].demoEndpoint`
- Step labels update to reflect HubSpot operations vs Klaviyo operations
- Password input remains; same `DEMO_SECRET` used for both platforms

---

## Backend Changes

### New file: `backend/hubspot.py`

FastAPI router mounted at `/demo/hubspot`. Reads `HUBSPOT_PRIVATE_APP_TOKEN` from settings. Implements `POST /demo/hubspot/run` (three-step sequence above).

### `backend/config.py`

Add `hubspot_token: str = Field(default="", alias="HUBSPOT_PRIVATE_APP_TOKEN")`.

### `backend/enrich.py`

Add HubSpot enrichment rules for:
- `POST /crm/v3/objects/contacts` — batch upsert vs single-create duplicate risk
- `POST /crm/v3/lists` — processingType MANUAL vs DYNAMIC, silent 200 on DYNAMIC add-member
- `PUT /crm/v4/objects/.../associations/...` — magic number type IDs, deletion scope

### `backend/main.py`

Mount HubSpot router at `/demo/hubspot`.

---

## File Structure

**New files:**
- `skills/manage-contacts.md`
- `skills/manage-lists-hubspot.md` (distinct from `manage-audiences.md`)
- `skills/manage-associations.md`
- `skills/hubspot-api.md`
- `backend/hubspot.py`
- `backend/tests/test_hubspot.py`

**Modified files:**
- `backend/config.py` — add HubSpot token field
- `backend/enrich.py` — add HubSpot enrichment rules
- `backend/main.py` — mount HubSpot router
- `index.html` — platform selector + PLATFORMS config
- `06-end-to-end-flow.html` — same changes as index.html

---

## Authentication

- **HubSpot:** `Authorization: Bearer {HUBSPOT_PRIVATE_APP_TOKEN}`
- Stored in Render env vars and local `.env` (gitignored)
- Local dev: set `HUBSPOT_PRIVATE_APP_TOKEN` in `.env`; if absent, HubSpot demo endpoint returns a clear error

---

## Testing

`backend/tests/test_hubspot.py` — same pattern as `test_klaviyo.py`:
- `test_health` — no live call
- `test_hubspot_run_returns_expected_shape` — live call, checks response keys
- `test_hubspot_run_steps_have_ok_status` — live call, checks all steps report ok

Live tests require `HUBSPOT_PRIVATE_APP_TOKEN` in `.env`. Tests are skipped gracefully if token is absent.

---

## Open Questions

1. HubSpot free account needed — user needs to create one and generate a private app token before live tests can run.
2. HubSpot spec files to use from the public collection: `Contacts.json`, `Lists.json`, `Associations.json` — confirm paths in the repo before implementation.
