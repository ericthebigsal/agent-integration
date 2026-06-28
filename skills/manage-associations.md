# Manage Associations — HubSpot Domain Skill (Skill 6)

Associations link HubSpot CRM objects to each other: contacts to
companies, contacts to deals, companies to deals, etc.
There is no equivalent concept in Klaviyo.

**Auth:** `Authorization: Bearer {HUBSPOT_SERVICE_KEY}`
**Base URL:** `https://api.hubapi.com`

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

To delete only a specific association type, use the batch archive endpoint:
```
POST /crm/v4/associations/{fromObjectType}/{toObjectType}/batch/archive
Body: [{"from": {"id": "{fromId}"}, "to": {"id": "{toId}"}, "types": [{"associationCategory": "HUBSPOT_DEFINED", "associationTypeId": 1}]}]
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
