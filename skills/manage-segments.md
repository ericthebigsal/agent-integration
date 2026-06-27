# Manage Segments — Klaviyo Domain Skill (Skill 3)

This skill covers dynamic, rule-based audience management.
A profile is in a segment because it matches a rule — not because anyone put it there.

**Key distinction from Skill 2 (Manage Audiences — Lists):** Segment membership is
computed and non-writable. There is no add-member or remove-member endpoint. This is
not an omission — it is the design.

---

## Create Segment — POST /api/segments

**Rate limits:** Burst 1/s · Steady 15/min · **Hard daily cap: 100 segments/day**

- A loop creating segments exhausts the daily quota quickly. The failure won't look like a rate-limit error until most of the quota is gone.
- Segment creation via API is **relatively new** — pre-2022 docs may say "not supported via API." They are outdated.

**Rule referencing a profile property:**
```json
{
  "data": {
    "type": "segment",
    "attributes": {
      "name": "VIP Gold Members",
      "definition": {
        "condition_groups": [{
          "conditions": [{
            "type": "profile/property",
            "field": "properties.vip_tier",
            "operator": "equals",
            "value": "gold"
          }]
        }]
      }
    }
  }
}
```

---

## Membership — Not Writable

- There is **no add-member or remove-member endpoint** for segments.
- To change who is in a segment, change the rule via `PATCH /api/segments/{id}`.
- Membership updates **10–60 seconds** after profile data changes. This is normal computation, not a failure.

---

## Diagnosing an Empty Segment

An empty segment after creation almost always means **profiles lack the expected property values** — not that the rule is wrong or the API call failed.

Diagnostic sequence:
1. `GET /api/profiles?filter=equals(properties.vip_tier,"gold")` — do matching profiles exist?
2. Wait 60 seconds — computation may still be in progress.
3. Only then check the rule definition for errors.

---

## Read Segment — GET /api/segments/{id}

Use to verify membership after the ~30–60s computation window.
Response includes `relationships.profiles` or use `GET /api/segments/{id}/profiles/` for the member list.

---

## Delete Segment — DELETE /api/segments/{id}

Permanent. Membership records are lost.

---

## Cross-Skill Interaction

Segment membership is driven by profile data (Skill 1).

When a profile is upserted with a custom property that a segment rule references, the profile **automatically enters that segment within 10–60 seconds** — no add-member call needed.

This is the core CDP value proposition: profile data quality drives audience membership.

See `manage-profiles.md` cross-skill note.

---

## API Facts

| Property | Value |
|---|---|
| Auth header | `Authorization: Klaviyo-API-Key {key}` |
| Revision header | `revision: 2024-10-15` |
| Daily segment cap | 100/day |
| Membership writable | No — computed from rule |
| Membership update delay | 10–60 seconds |
