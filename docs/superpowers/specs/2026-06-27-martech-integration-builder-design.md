# Design Spec: AI-Assisted Martech Integration Builder
*2026-06-27 · Status: approved*

---

## What we're building

A demo web application that takes a structured API spec (OpenAPI, Postman, or `$discovery`), matches it against codified domain knowledge ("skills") for known integration scenarios, surfaces a human-in-the-loop review with skill-sourced warnings, generates a scoped MCP server, and verifies the result with live API calls — demonstrating end-to-end that AI can accelerate and de-risk martech integration work.

**Platform:** Klaviyo (free tier). **Scenarios:** Manage Profiles (Skill 1), Manage Audiences — Lists (Skill 2), Manage Segments (Skill 3). **Format:** Standalone HTML prototypes + Python/FastAPI backend (for MCP generation and live API calls). **Not** a production tool.

---

## Architecture

Five pipeline stages, left to right:

```
[Spec Input] → [Skill Match] → [HITL Review] → [MCP Generation] → [Verification]
                    ↑               ↑                ↑                  ↑
         ┌──────────┴───────────────┘         ┌──────┴──────────────────┘
         │  Domain Skill Files                 │  MCP Companion Layer
         │  · Manage Profiles skill            │  · Enriched Klaviyo spec
         │  · Manage Audiences skill           │  · skills/klaviyo-api.md
         │  · Manage Segments skill            │
         └─────────────────────────────────────┘
```

Two skill layers run beneath the pipeline:
- **Domain skill layer** (informs stages 2–3): codified priors about how profile management, list-based audience management, and segment-based audience management APIs typically behave across platforms
- **MCP companion layer** (informs stages 4–5): Klaviyo-specific runtime guidance — enriched OpenAPI spec + companion Claude skill file

---

## Components

### 1. Spec Input (Screen 1)
- Tabbed UI: **Paste spec** (textarea) | **Load from URL**
- URL mode: detects `github.com/{owner}/{repo}` vs. direct file URL
  - GitHub repo: calls GitHub API, traverses tree (BFS depth ≤4), discovers spec files, presents segmented picker (Required / Optional / Not needed) with skill-based tier recommendations and `?` modal per file
  - Direct URL: fetches file, parses JSON/YAML, populates textarea
- Scenario selector: Manage Profiles, Manage Audiences — Lists, Manage Segments (all three default selected)
- Platform selector: Klaviyo (fixed for this demo)

### 2. Skill Match (Screen 2)
- Maps discovered spec endpoints against skill priors for selected scenarios
- Outputs: confirmed operations table per scenario, warning count, N/A-by-design count
- **Manage Profiles operations:** Upsert (`POST /api/profiles`), Delete (`POST /api/data-privacy-deletion-jobs`), Download all (`GET /api/profiles` paginated)
- **Manage Audiences — Lists:** Create, Add member (two paths), Remove member, Delete list
- **Manage Audiences — Segments:** Create, Read, Delete; Add/remove member = N/A by design
- **Cross-skill interaction flagged here:** segment rule referencing profile properties identified; user alerted that the upsert step will need matching property values

### 3. HITL Review (Screen 3)
- Condensed view: warnings in severity order (🔴 red → 🟡 amber → ℹ️ info)
- No inference shown — all endpoints are spec-confirmed; warnings are skill-sourced only
- Two required acknowledgment checkboxes gate the "Continue" button:
  - Async/irreversible profile delete + 401 post-revision-bump issue
  - Two-path list add-member consent trap
- Skill warnings surfaced (11 total: 4 Manage Profiles + 3 Manage Audiences — Lists + 4 Manage Segments — see FSD Sections 2.3, 3.3, and 4.3)

### 4. MCP Generation (Screen 4)
- **Pre-processing:** Klaviyo OpenAPI spec enriched with behavioral `description` fields on ~10 scoped operations (see FSD Section 6, Table 5.2)
- **Generator:** `ckanthony/openapi-mcp` (primary) — Dockerized, supports include/exclude tag filtering; `harsha-iiiv/openapi-mcp-generator` (fallback) — TypeScript/Zod output
- **Scope filter:** include only operations from profiles, lists, segments, data_privacy categories
- **Output:** runnable MCP server with 10 tools; terminal animation in UI followed by tool chip grid
- **Acceptance:** server starts, `tools/list` matches expected 10 operations, API key injection works

### 5. Verification / Payoff (Screen 5)
Cross-skill causation sequence (replaces isolated operations):
1. `POST /api/segments` — create "VIP Gold Members" with rule `properties.vip_tier = "gold"`
2. `POST /api/profiles` — upsert test profile with `properties.vip_tier = "gold"` set
3. `POST /api/lists/{id}/subscribe` — add profile to test list (double opt-in disabled on test list)
4. Wait ~30 seconds (surfaced explicitly in UI — computation, not failure)
5. `GET /api/segments/{id}` — confirm profile appears in segment (no add-member call made)
6. Dashboard confirmation: profile, list membership, segment membership all visible

All steps show green status in sequence. The 30-second wait has a visible countdown/spinner with label "Klaviyo computing segment membership…".

---

## Skill files

### Domain skill files (informs Skill Match + HITL Review)
Three markdown files encoding prior knowledge:

**`skills/manage-profiles.md`**
- Expected operations and their real shapes (upsert = idempotent, delete = async compliance job, download-all = cursor pagination loop)
- Gotchas: silent overwrite, async delete, 401 post-revision-bump, rate limit cliff
- Cross-skill note: upserting a profile property silently affects segment membership

**`skills/manage-audiences.md`**
- Lists = static, manually-curated, writable membership
- Gotchas: two-path list add-member consent trap, profile ID vs. email requirement, remove ≠ unsubscribe

**`skills/manage-segments.md`**
- Segments = dynamic, computed, non-writable membership; to change who's in a segment, change the rule
- Gotchas: daily creation cap (100/day), empty segment = data quality signal not config error, membership update delay (10–60s)
- Cross-skill note: segment rule properties must be present on profiles for membership to work

### Companion skill file (informs MCP usage at runtime)
**`skills/klaviyo-api.md`**
- Same domain knowledge from all three skills, restructured for per-tool LLM guidance at call time
- Sections: Auth, Manage Profiles (per operation), Manage Audiences — Lists (per operation), Manage Segments (per operation), Cross-skill interaction, Known Live Issues
- Loaded at session start when Claude drives the Klaviyo MCP server

---

## Data flow

```
User pastes/fetches spec
    → Spec text stored in memory (no server needed for screens 1–3)
    → Skill match runs client-side against hardcoded skill priors
    → HITL review rendered from match output
    → On "Continue": POST spec + scenario to backend
        → Backend enriches spec, runs openapi-mcp, returns tool list
        → Backend holds Klaviyo API key (env var), makes live calls
        → Results streamed back to verification screen
```

Screens 1–3 are fully client-side (static HTML). Screens 4–5 require a backend for MCP generation and live API calls. For the demo prototype (current phase), screens 4–5 are simulated; real backend is the next implementation phase.

---

## Error handling

| Failure point | Handling |
|---|---|
| GitHub API rate limit (60 req/hr unauthenticated) | Surface error message; suggest raw file URL as fallback |
| Spec fetch fails (CORS, auth, 404) | Error state in URL mode; instruct user to paste directly |
| MCP generator fails on Klaviyo JSON:API envelope | Fall back to `harsha-iiiv/openapi-mcp-generator`; document in README |
| Klaviyo delete 401 post-revision-bump | Surfaced as skill warning at HITL; retry before key rotation |
| Segment membership delay exceeds 60s | UI countdown; if no membership after 90s, flag as possible rule mismatch |
| Double opt-in blocks list subscribe | Surfaced at HITL acknowledgment; pre-demo checklist item |

---

## Testing

- **Prototypes (current):** Open HTML files in browser, click through all 5 screens, verify GitHub fetch + file picker + modal on real Klaviyo repo URL
- **MCP server (next phase):** Start server, run `tools/list`, call each of the 10 tools against Klaviyo sandbox, confirm responses
- **Live verification:** Run full causation sequence against real Klaviyo account; confirm segment membership updates within 60s; screenshot dashboard
- **No automated test suite** for the demo prototype — manual verification is the acceptance gate

---

## Open questions (from FSD Section 10)

1. **List add-member severity** — currently red/danger; confirm after fresh review of `04-manage-profiles-and-audiences-klaviyo.html`
2. **Segment-snapshot bridge card** — in scope or cut?
3. **Footer gate behavior** — require explicit acknowledgment of top-2 severity warnings, or "0 blocking flags" is enough?
