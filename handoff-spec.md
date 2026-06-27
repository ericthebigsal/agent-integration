# AI-Assisted Martech/Adtech Integration Builder
### Requirements & Design Handoff
*Last updated: 2026-06-27*

---

## 1. Problem Statement

Integrating with martech/adtech platform APIs is slow and error-prone because platforms vary wildly in documentation quality, testability, and how they model common concepts (e.g. static vs. dynamic audiences). This project demonstrates how AI can accelerate and de-risk that integration work — not by guessing at undocumented APIs, but by combining **structured spec input** with **codified domain knowledge ("skills")** about how categories of integration (e.g. profile management, audience management) typically work.

The deliverable is a **demo**, not a production tool. It needs a real, visible payoff: send something to a real platform and show that it worked.

---

## 2. Key Decisions & Pivots (chronological)

This project went through several scoping changes. Recording them here so the reasoning isn't lost:

1. **Started broad**: RAG + web search for arbitrary martech API integration. Rejected — too generic, didn't showcase anything distinctive.
2. **Narrowed to**: an agentic pipeline — discover API docs (OpenAPI/$discovery/Postman/scraped prose) → extract → human-in-the-loop (HITL) review → generate an MCP server → verify it works against a real account.
3. **Picked 4 target platforms** across categories (Owned Channel, Offline Conversion Events, Profiles & Audiences, Paid Media journey triggering) based on free-tier + good-docs research. Klaviyo, Meta CAPI, Segment, Snapchat Ads were confirmed candidates.
4. **Major simplification (the actual pivot that stuck)**: input is now **always structured** (OpenAPI spec, Postman collection, or `$discovery` doc) — the prose-scraping fallback path was dropped entirely. Scope narrowed to exactly **two scenarios**: **Manage Profiles** and **Manage Audiences**. The "secret sauce" is a **skill** — codified prior knowledge of how each scenario usually works (expected operations, common gotchas, common multi-step patterns) — which gets matched against whatever spec is fed in, rather than the AI extracting structure from scratch with no domain priors.
5. **Manage Profiles operations locked at 3**: Upsert (single), Delete (single), Download all (bulk). A 4th op, "Delete all," was discussed and **dropped** — too platform-divergent, usually resolves to a workaround rather than a real endpoint, not worth the complexity for this demo.
6. **Platform selection for the prototype**: Braze was investigated and **rejected** — despite a strong endpoint match (`/users/track`, `/users/delete`, `/users/export/segment`), the free 14-day trial is a sales-funnel/dashboard-only experience and does **not** include REST API key issuance (confirmed both by web research and by the user's own prior hands-on experience). This is recorded as a cautionary example: marketing-facing "free trial" pages are not a reliable signal for "free developer/API sandbox," and this distinction is itself a good demo beat for the tool's honesty thesis.
7. **Klaviyo confirmed and locked in** as the platform for both scenarios. All endpoints below are verified against Klaviyo's actual developer documentation (not inferred/guessed).

---

## 3. Scope (current, locked)

**In scope:**
- Two scenarios: **Manage Profiles**, **Manage Audiences**
- One platform: **Klaviyo**
- Input: structured spec only (OpenAPI / Postman / `$discovery`) — no prose-scraping fallback
- HITL review step — but only meaningful when fields are genuinely uncertain/inferred; when everything resolves cleanly against a spec (as with Klaviyo), the review screen shows confirmed facts + skill-sourced warnings, not an edit-everything UI
- MCP server generation — **using a free, existing open-source OpenAPI→MCP generator**, not built from scratch (budget constraint: free tools only)
- A verification/payoff step: actually call the Klaviyo API and show it worked

**Out of scope (explicitly cut):**
- Prose-doc scraping fallback
- CAPI / Offline Conversion Events scenario
- Paid media journey-triggering stretch goal (Snapchat)
- Multi-platform side-by-side comparison matrix (was prototyped, superseded by the skill-matching pivot)
- "Delete all" bulk profile operation
- Braze as a platform (no viable free API sandbox)

**Format decisions already made:**
- Demo, not a production tool
- Web UI (not CLI)
- Adapt an existing free OpenAPI→MCP generator rather than build one
- Prototypes built as standalone downloadable HTML files (not the in-chat Visualizer widget format), so they can be opened locally and clicked through

---

## 4. The "Skill" Concept

A **skill** = codified domain knowledge about a category of integration work, used to interrogate an unfamiliar spec intelligently rather than just keyword-matching paths.

Concretely, a skill should know, per operation:
- **Expected shape** — is this normally one call, or a multi-step sequence (e.g. "download all" is almost always pagination, not a single bulk-export endpoint)
- **Common gotchas** — known failure modes seen across platforms in this category (silent upserts, async deletes, rate-limit cliffs, ambiguous "success" responses)
- **Where to look** if the obvious endpoint name doesn't exist (e.g. bulk delete is often a privacy/compliance-job endpoint, not a DELETE)

This is what justifies the HITL review screen surfacing **skill-sourced warnings** even on a fully spec-confirmed integration — the value isn't just "did we find the endpoint," it's "do you know what will bite you once you use it."

Two skills are defined so far: **Manage Profiles**, **Manage Audiences**.

---

## 5. Confirmed Klaviyo API Research

All of the below is verified against Klaviyo's published developer documentation and/or Klaviyo Developer Community threads — not inferred from prose, not guessed.

### 5.1 Auth
- Header: `Authorization: Klaviyo-API-Key {key}`
- Private API keys have configurable scopes (Read-only / Full / Custom) set at creation; scopes cannot be edited after the fact — must delete and recreate the key to change scope.

### 5.2 Manage Profiles

| Operation | Endpoint | Method | Notes / Gotchas |
|---|---|---|---|
| **Upsert** | `/api/profiles` | POST | JSON:API body, identified by email/phone/external_id. **Gotcha**: no distinct create vs. update — sending the same identifier again just updates the existing profile. No error, no duplicate. |
| **Delete** | `/api/data-privacy-deletion-jobs` | POST | Exactly one identifier allowed (`email`, `phone_number`, or `id`) — providing more than one returns an error. **Async** — request returns before deletion completes; check the Deleted Profiles page. **Irreversible**, no soft-delete. Rate limit: burst 3/s, steady 60/m (much tighter than profile writes). **Known live issue (confirmed via dated community thread, April 15 2026)**: this endpoint intermittently returned 401s immediately after an API revision bump, even with valid, working keys — root cause suspected to be a scope/permission change tied to the revision, not a bad key. Worth a specific warning in the skill: "401 on delete right after a revision change ≠ assume bad key." |
| **Download all** | `/api/profiles` | GET, paginated | **No single bulk-export endpoint exists in the API.** (The dashboard has a one-profile-at-a-time "Export profile" button for GDPR requests, but that's UI-only.) "Download all" = loop `GET /api/profiles` following the `links.next` cursor until exhausted. |

**Dropped from scope:** "Delete all" bulk operation (decided not worth the complexity/platform-divergence for this demo).

### 5.3 Manage Audiences

Klaviyo splits audiences into two genuinely different object types — this distinction is the core teaching point of this scenario.

**Lists — static, manually-curated:**

| Operation | Endpoint | Method | Notes / Gotchas |
|---|---|---|---|
| Create | `/api/lists` | POST | Straightforward. |
| **Add member** | `/api/lists/{id}/relationships/profiles` **or** `/api/lists/{id}/subscribe` | POST | **This is the headline trap.** Two endpoints exist with different consent semantics. The `relationships/profiles` endpoint adds immediately but does **not** grant marketing consent. `subscribe` is the consent-aware path Klaviyo recommends — but if double opt-in is enabled (Klaviyo's **default**), `subscribe` returns a *successful, empty* response and adds no one until they confirm. **Both calls look identical in success/failure shape; only the real-world outcome differs.** Confirmed via Klaviyo's own docs + multiple developer community threads describing exactly this confusion. Also: this endpoint requires a profile **ID**, not an email — adding a brand-new contact is a 2-step sequence (resolve/create profile first, then add by ID), unless using the separate Bulk Profile Import API which can do both in one call. |
| Remove member | `/api/lists/{id}/relationships/profiles` | DELETE | Max 1000 profile IDs per call. **Gotcha**: removing from a list does *not* change subscription/consent status — a profile can be on zero lists and still technically subscribed. Use the Unsubscribe endpoint if the goal is actually to stop marketing to them. |
| Delete list | `/api/lists/{id}` | DELETE | Destructive, removes associated flow triggers too. |

**Segments — dynamic, rule-based:**

| Operation | Endpoint | Method | Notes / Gotchas |
|---|---|---|---|
| Create | `/api/segments` | POST | Body = condition groups (OR within a group, AND across groups) over profile attributes, events, or list membership. **Gotcha**: tightest rate limit found anywhere in this spec — burst 1/s, steady 15/m, **daily cap 100/d**. A loop that creates segments will exhaust the daily quota fast, and the failure pattern won't look like a typical rate-limit error until most of the day's quota is gone. **Historical note**: this endpoint didn't exist for years — segment creation was dashboard-only, and Klaviyo's developer community has a multi-year thread of repeated requests before it shipped. Worth flagging in case a skill or cached doc still says "not supported." |
| Read | `/api/segments/{id}` | GET | — |
| **Add/remove member** | — | — | **Not applicable, by design** — not a missing feature. Segment membership is computed continuously from the segment's rule definition; profiles enter/exit automatically as they match/unmatch conditions, "in close to real time." There is no add/remove-member endpoint because the concept doesn't apply — to change membership, change the rule (Update Segment). |
| Delete | `/api/segments/{id}` | DELETE | Exists in the spec; not yet exhaustively cross-checked against community reports the way Delete Profile was — treat as spec-confirmed but lower depth-of-research than the rest of this table. |

**Bridge between the two object types:**
- **Segment snapshot**: captures everyone currently matching a segment's rules into a brand-new **static List**. The original segment keeps growing/shrinking dynamically; the snapshot is frozen at the moment it's taken. This is the closest thing to "manually fix segment membership" — you're not editing the segment, you're forking a moment of it into a List. Confirmed via Klaviyo Help Center documentation.

---

## 6. Prototypes Built So Far

All are standalone HTML files (open directly in a browser, no server needed), in the same visual language (warm paper background, IBM Plex Mono/Sans, a 5-state status vocabulary). Located wherever you saved the `present_files` outputs from this conversation.

1. **`01-review.html`** — First HITL review screen concept. Per-field review with spec-vs-inferred provenance tags and expandable "why was this inferred" panels. Built before the scope pivot — uses the old multi-platform framing. **Largely superseded**, but the visual vocabulary (provenance tags, confidence levels, expandable reasoning) may still be useful for any future scenario that *does* need prose-fallback extraction.

2. **`02-matrix.html`** — CRUD-operations × platform comparison matrix (Klaviyo / Segment / Snapchat) for Profiles & Audiences. Built right before the "two skills, structured-input-only" pivot. **Superseded by the pivot** — multi-platform comparison isn't current scope — but the 5-state cell vocabulary (spec-confirmed / inferred / multi-step / not-applicable-by-design / not-supported-gap) is reused in later prototypes and is probably the single most reusable design decision from this whole session.

3. **`03-manage-profiles-klaviyo.html`** — First "real data only" prototype. One card per operation (Upsert, Delete, Download-all) against confirmed Klaviyo endpoints, with color-coded gotcha callouts (amber = behavioral quirk, red = irreversible/destructive). No editable fields, since nothing here is uncertain.

4. **`04-manage-profiles-and-audiences-klaviyo.html`** — **Current/most complete prototype.** Extends #3 with a full "Manage Audiences" section: Lists (create/add/remove/delete), Segments (create/read, plus an explicit "not applicable" card for add/remove-member styled with a diagonal-hatch background to visually distinguish it from a real gap), and a dashed-border "bridge" card for the segment-snapshot-to-list operation. This is the one to keep building on.

**Open design questions flagged but not yet resolved (from the end of the audiences work):**
- Severity/framing of the List add-member trap — currently styled as the most severe (red/danger) warning in the whole prototype since it fails silently; worth deciding if that's the right call once you're looking at this with fresh eyes.
- Whether the segment-snapshot "bridge" card is in scope or scope creep beyond the two named skills — currently kept, but flagged as cuttable.
- Whether the footer's "ready to generate" gate should require explicit acknowledgment of the two highest-severity warnings (irreversible delete, the live 401 issue) rather than just "0 data-quality flags."

---

## 7. Not Yet Started

- **MCP server generation step.** Two free/open-source OpenAPI→MCP generator candidates were identified but not yet evaluated hands-on:
  - `ckanthony/openapi-mcp` — Dockerized, reads OpenAPI spec directly, supports include/exclude filtering by tag/operation (useful for scoping down to just the Manage Profiles/Audiences endpoints out of Klaviyo's full API surface), API key injection via header/query/path/cookie.
  - `harsha-iiiv/openapi-mcp-generator` — outputs typed TypeScript, Zod-based runtime validation, supports API key/Bearer/Basic/OAuth2.
  - Neither has been pulled down or test-run yet. `ckanthony/openapi-mcp`'s filtering capability seems like the better fit given the "AI picked the relevant endpoints out of the full spec" narrative beat, but this hasn't been validated hands-on.
- **The actual Klaviyo OpenAPI spec file itself** has not been downloaded/inspected directly — all endpoint facts above came from Klaviyo's reference documentation pages and developer community threads, not from parsing the machine-readable spec. Before wiring up an OpenAPI→MCP generator, the real spec file (`stable/categories/profiles.json`, `.../lists.json`, `.../segments.json`, `.../data-privacy.json` per Klaviyo's own per-category spec links) should be pulled and validated against the table in Section 5.
- **Verification/payoff step** — no real Klaviyo account has been created or tested against yet. This is the actual "send something, show it worked" step the whole demo is building toward, and it's fully unstarted.
- **Requirements spec tooling** — a "product-management" plugin skill (`write-spec` and siblings) was referenced as installed but was not actually accessible in this session's filesystem (`/mnt/skills/plugins/` does not exist here). This document was written by hand as a substitute. Worth checking whether the plugin loads correctly in the terminal/Claude Code session.

---

## 8. Suggested Next Steps (in terminal)

1. Verify the PM plugin actually loads in the new session (`/mnt/skills/plugins/product-management:*`) — if it works there, consider regenerating a more structured version of this document with it.
2. Pull Klaviyo's real OpenAPI spec files for Profiles, Lists, Segments, and Data Privacy; diff against Section 5's table to confirm nothing was misremembered or has since changed.
3. Stand up `ckanthony/openapi-mcp` (or the alternative) against the real spec, scoped to just the ~10 endpoints in Section 5, and confirm it generates a working MCP server.
4. Create a real free Klaviyo account, generate a private API key with the right scopes, and run a live end-to-end test: upsert a test profile → add to a test list → create a test segment → confirm in the Klaviyo dashboard.
5. Revisit the three open design questions in Section 6 once the prototype is in front of fresh eyes.

---

## Appendix: Sources

All Klaviyo facts in Section 5 are drawn from `developers.klaviyo.com` reference pages (Create Profile, Request Profile Deletion, Get Profiles, Lists API overview, Add/Remove Profiles to List, Subscribe Profiles, Segments API overview, Create Segment, Get Segment(s)) and the Klaviyo Developer Community (specifically: a dated April 15 2026 thread on Data Privacy API 401 errors post-revision; multiple threads on the historical absence of a create-segment endpoint; a thread on the two-endpoint list-add consent confusion; a thread on the profile-ID-vs-email requirement for list membership calls). The Braze rejection in Section 2.6 is drawn from Braze's own free-trial marketing pages (which describe dashboard-only trial features) contrasted with third-party integration docs (Make.com) that explicitly state a paid account is required for API access — plus direct confirmation from the user's own prior hands-on experience with Braze.
