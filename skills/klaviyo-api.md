# Klaviyo API — MCP Companion Skill

Load this file at session start when driving the Klaviyo MCP server.
It contains the behavioral knowledge the tool descriptions alone cannot convey.

---

## Auth

Every request requires two headers:

```
Authorization: Klaviyo-API-Key {KLAVIYO_API_KEY}
revision: 2024-10-15
```

Never hardcode the key. Source it from the `KLAVIYO_API_KEY` environment variable.

---

## Manage Profiles — Skill 1

### Before calling `upsert_profile` (POST /api/profiles)

- **Idempotent:** same email/phone/external_id = silent overwrite of all provided fields. No error, no duplicate.
- Setting `properties.{key}` may silently enroll or remove the profile from segments whose rules reference that key. Expect ~30–60s delay before segment membership reflects the change.

### Before calling `delete_profile` (POST /api/data-privacy-deletion-jobs)

- **Async and irreversible.** Profile is not gone immediately after the call returns.
- Rate limit: 60/min steady — far below profile write limits.
- **If you receive a 401 and the key was working moments ago:** wait 30 seconds and retry before rotating keys. This is a confirmed live issue (April 2026) tied to Klaviyo API revision bumps.

### Before calling `list_profiles` (GET /api/profiles)

- No bulk export. Follow `links.next` cursor in each response until it is null.
- Use `?filter=equals(properties.key,"value")` to narrow results.

---

## Manage Audiences — Lists — Skill 2

### Before calling `add_list_member`

**Two endpoints exist with different consent outcomes — choose carefully:**

| Endpoint | Adds immediately? | Grants consent? | Double opt-in trap? |
|---|---|---|---|
| `POST /api/lists/{id}/relationships/profiles` | Yes | No | No |
| `POST /api/lists/{id}/subscribe` | Only after confirmation | Yes | Yes — 200 empty response if double opt-in is on |

Both return HTTP 200 on "success." The real-world outcome is completely different.

- Check double opt-in settings before using `subscribe` in a demo.
- `relationships/profiles` requires a **profile ID**, not an email. Call `upsert_profile` first if the contact does not have an ID yet.

### Before calling `remove_list_member`

- Removes from the list only. Does **not** unsubscribe or revoke consent.
- Call `POST /api/profile-suppression-bulk-create-jobs` to stop marketing communications.

---

## Manage Segments — Skill 3

### Before calling `create_segment`

- Hard **daily cap: 100 segments/day**. Check remaining quota before running in a loop.
- Segment membership is not writable — there is no add-member call to make after creation.

### Diagnosing a segment with zero members

Do this in order:
1. Verify profiles with the expected property values exist: `GET /api/profiles?filter=equals(properties.key,"value")`
2. Wait 60 seconds — membership computation may be in progress.
3. Only then review the rule definition.

Empty segment = data quality signal, not config error.

### Segment membership is computed, not writable

- No add-member or remove-member endpoint exists.
- To change who is in a segment, update the rule via `PATCH /api/segments/{id}`.
- After a profile upsert that matches a segment rule, membership updates within **10–60 seconds**.

---

## Cross-Skill Interaction — Profile Properties → Segment Membership

Upserting a profile with `properties.vip_tier = "gold"` automatically enrolls that profile in any segment whose rule matches `properties.vip_tier = "gold"`. No add-member call. No extra API call. This is the causation the demo is built to show.

**Demo sequence:**
1. `POST /api/segments` — create segment with property rule
2. `POST /api/profiles` — upsert profile with matching property
3. Wait ~30 seconds (show countdown in UI — this is computation, not a hang)
4. `GET /api/segments/{id}/profiles/` — confirm 1 member, no add-member call made

---

## Known Live Issues

| Issue | Symptom | Resolution |
|---|---|---|
| 401 on data-privacy-deletion-jobs after revision bump | 401 with valid key | Wait 30s, retry. Do not rotate key. |
| subscribe returns 200 empty, no member added | List stays empty after subscribe call | Double opt-in is enabled. Disable on test list or use relationships/profiles path. |
| Segment shows 0 members after creation | Empty membership | Check profile data first. Wait 60s. Do not debug the rule until data is confirmed. |
