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
