# Manage Profiles — Klaviyo Domain Skill

This skill encodes priors about how profile management APIs behave in practice.
It informs the Skill Match and HITL Review stages of the integration pipeline.

---

## Upsert — POST /api/profiles

**Shape:** Idempotent by natural key (email, phone, or external_id).

- Re-sending the same identifier **silently overwrites** all provided fields — no error, no duplicate created.
- To update a single field without clobbering others, send only the fields you want to change in `attributes`.
- Setting a value in `properties` (custom attributes) **may silently change segment membership** for any segment rule referencing that property key. This is intentional Klaviyo behavior, not a side effect to be worked around.

**Request shape:**
```json
{
  "data": {
    "type": "profile",
    "attributes": {
      "email": "user@example.com",
      "properties": { "vip_tier": "gold" }
    }
  }
}
```

**Cross-skill note:** Upserting a profile property that matches a segment rule will enroll the profile in that segment within 10–60 seconds, with no add-member call. See `manage-segments.md`.

---

## Delete — POST /api/data-privacy-deletion-jobs

**Shape:** Compliance job submission. The profile is **not** gone immediately.

- Async and irreversible — no soft-delete, no undo, no restore endpoint.
- Rate limit: burst 3/s, steady **60/min** — far tighter than profile writes. A loop calling delete will hit this limit.
- **Known live issue (April 2026):** Intermittent 401 errors occur immediately after a Klaviyo API revision bump, even with a valid working key. Suspected cause: scope/permission change tied to the revision. **Wait and retry before rotating keys.**

**Request shape:**
```json
{
  "data": {
    "type": "data-privacy-deletion-job",
    "attributes": {},
    "relationships": {
      "profile": {
        "data": { "type": "profile", "id": "{profile_id}" }
      }
    }
  }
}
```

---

## Download All — GET /api/profiles (paginated)

**Shape:** Cursor-paginated loop. No single bulk-export endpoint exists.

- Each response includes a `links.next` URL. Follow it until `links.next` is null.
- The Klaviyo dashboard has a per-profile GDPR export button, but it is UI-only — not accessible via API.
- Filter profiles by property with `?filter=equals(properties.vip_tier,"gold")` syntax.

---

## API Facts

| Property | Value |
|---|---|
| Auth header | `Authorization: Klaviyo-API-Key {key}` |
| Revision header | `revision: 2024-10-15` |
| Content-Type | `application/json` |
| Base URL | `https://a.klaviyo.com` |
| JSON envelope | JSON:API — all payloads wrapped in `{"data": {...}}` |
