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
