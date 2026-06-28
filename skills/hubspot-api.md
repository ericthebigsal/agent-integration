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
