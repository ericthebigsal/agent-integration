# Manage Audiences — Lists — Klaviyo Domain Skill (Skill 2)

This skill covers static, manually-curated list membership.
Someone is in a list because a human or system explicitly put them there.

**Key distinction from Skill 3 (Manage Segments):** List membership is writable.
Segment membership is computed. Do not confuse them.

---

## Create List — POST /api/lists

No gotchas. Straightforward resource creation.

```json
{
  "data": {
    "type": "list",
    "attributes": { "name": "Demo Test List" }
  }
}
```

---

## Add Member — TWO PATHS — read before calling

### Path A: POST /api/lists/{id}/relationships/profiles

- Adds the profile to the list **immediately**.
- Does **not** grant marketing consent.
- Use when: contact already has consent and you are tracking them in a list.
- Requires **profile ID**, not email. Resolve/create profile first via POST /api/profiles.

```json
{
  "data": [{ "type": "profile", "id": "{profile_id}" }]
}
```

### Path B: POST /api/lists/{id}/subscribe

- Consent-aware path.
- If double opt-in is **enabled** (Klaviyo's default): returns HTTP 200 with an **empty response body** and adds **nobody** until the contact confirms via email.
- If double opt-in is **disabled**: adds and grants consent immediately.
- Both paths return 200 on "success" — the real-world outcome is completely different.
- **Pre-demo checklist:** confirm double opt-in is disabled on test list.

```json
{
  "data": [{
    "type": "profile",
    "attributes": { "email": "user@example.com" }
  }]
}
```

---

## Remove Member — DELETE /api/lists/{id}/relationships/profiles

- Removes from the **list only**.
- Does **not** change subscription or consent status.
- A profile removed from all lists may still be subscribed to marketing.
- Use `POST /api/profile-suppression-bulk-create-jobs` to unsubscribe.

---

## Delete List — DELETE /api/lists/{id}

Permanent. No soft-delete.

---

## API Facts

| Property | Value |
|---|---|
| Auth header | `Authorization: Klaviyo-API-Key {key}` |
| Revision header | `revision: 2024-10-15` |
| Add member requires | Profile ID (not email) — upsert profile first |
| Alternative | Bulk Profile Import API can create profile + add to list in one call |
