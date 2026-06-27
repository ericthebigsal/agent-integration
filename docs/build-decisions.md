# Build Decision Log

*Key decisions made during the build of the AI-Assisted Martech Integration Builder, with context and reasoning.*

---

## Decision 1 — Target Klaviyo, not Braze

**Trigger:** Chose the integration target platform.

**Context:** I considered Braze (broad enterprise adoption, well-known brand) but Braze's free trial is dashboard-only — the REST API requires a paid account. Klaviyo offers a full free tier with complete API access, which means the demo can make real live calls against a real account with no cost and no procurement.

**My call:** Klaviyo. Free tier, complete API, well-documented, and enough gotcha density (async deletes, two-path list add-member, computed segment membership) to make surfacing skill-sourced warnings genuinely meaningful.

**What I ruled out:** Prose-scraping as a fallback path. If the spec isn't machine-readable (OpenAPI, Postman, `$discovery`), the demo doesn't run. This is a deliberate constraint that forces the demo to prove its point on real structured specs.

---

## Decision 2 — Both portfolio artifact and working document

**Trigger:** Claude asked who the audience for the BRD and FSD was.

**Context:** I could have written them purely as portfolio pieces (polished, reader-friendly, no implementation detail) or purely as working docs (dense, engineering-focused, full spec). The honest answer is that I need both — something that reads well to a CTO reviewing my portfolio and is also detailed enough to hand to an engineer on day one.

**My call:** Both. Markdown with Mermaid diagrams, hosted in a public GitHub repo where the markdown renders natively. Portfolio-quality prose, working-document depth. The two audiences get the same file.

---

## Decision 3 — Two-layer skill delivery (enriched spec + companion skill)

**Trigger:** I asked directly: does the MCP server contain the skill to understand the APIs, or does it just wrap them?

**Context:** The OpenAPI→MCP generator produces API wrappers. Tool definitions know what endpoints exist and what parameters they take. They don't know that profile delete is async and irreversible, or that `subscribe` returns 200 empty when double opt-in is on, or that segment membership is computed rather than writable. An LLM driving a generated MCP server without additional context would make all of those mistakes.

**What Claude surfaced:** A two-layer approach. Layer 1: enrich the OpenAPI spec before generation — inject behavioral descriptions into the tool definitions so the MCP server itself carries the most critical facts. Layer 2: a companion skill file (`skills/klaviyo-api.md`) loaded at session start, containing the full domain knowledge structured for per-tool LLM guidance.

**My call:** Both layers. The enriched spec makes the MCP server safer in standalone use. The companion skill makes it correct. The demo beat is that the skill's value doesn't end at the HITL review screen — it travels with the MCP server.

---

## Decision 4 — Segment membership causation as the payoff moment

**Trigger:** I pushed on the difference between Klaviyo lists and segments, and asked whether upserting a profile with the right custom property would automatically land it in a matching segment.

**Context:** I suspected Klaviyo segments worked this way but wanted to be precise. The answer confirmed it: when you upsert a profile with `properties.vip_tier = "gold"` and a segment rule matches that property, the profile appears in the segment within 10–60 seconds — automatically, with no add-member call.

**What this changed:** Everything. The verification step changed from "call these endpoints in sequence" to "demonstrate that profile data quality drives audience membership." The FSD got a new section (Cross-Skill Interaction). The BRD updated its executive summary. The architecture diagram got a causation sequence. The implementation plan's live demo sequence was rewritten around this payoff.

**My call:** Make this the centerpiece of the demo. Not just one of several operations — the thing the demo is specifically designed to show. It demonstrates the CDP value proposition (data quality → audience composition) in a way that's concrete, live, and thirty seconds long.

---

## Decision 5 — Split Manage Audiences into Lists and Segments as separate skills

**Trigger:** After adding the cross-skill causation section, it became clear that lists and segments are fundamentally different enough to be separate scenarios.

**Context:** Lists hold manually-curated, writable membership. Segments hold computed, non-writable membership. The HITL warnings are completely different (two-path consent trap for lists; daily creation cap and empty = data quality for segments). The failure modes are different. The API semantics are different. And the cross-skill interaction only makes sense if segments are their own thing with their own skill.

**What I ruled out:** Keeping them merged as "Manage Audiences." That framing buried the most interesting part of the demo and made the cross-skill causation harder to explain.

**My call:** Three scenarios — Manage Profiles (Skill 1), Manage Audiences — Lists (Skill 2), Manage Segments (Skill 3). This decision propagated through the BRD, FSD, design doc, architecture diagram, implementation plan, and prototype. Propagating it correctly was the main work of a full session.

---

## Decision 6 — Real GitHub repo traversal for spec discovery

**Trigger:** I wanted the demo to work with the real Klaviyo OpenAPI GitHub repo URL, not just a pasted spec.

**Context:** The Klaviyo OpenAPI spec lives at `https://github.com/klaviyo/openapi`. I wanted to paste that URL and have the tool discover the spec files automatically. The challenge: the repo has hundreds of JSON files across multiple directories, and the GitHub API has a 60 req/hr rate limit for unauthenticated requests.

**What Claude built:** BFS traversal of the GitHub repo tree (max depth 4, parallel batches of 4), filtering for spec files by extension and path heuristics, returning a grouped file picker. Rate limit errors handled gracefully with a fallback instruction to use raw file URLs.

**My call:** Make it work with the real URL. The demo loses credibility if the spec input step requires manual file selection. A real tool would discover the files automatically.

---

## Decision 7 — Segmented control (not tabs) for the file picker

**Trigger:** The file picker showed 464 Klaviyo spec files by default — an overwhelming list.

**Context:** I needed a way to make the list manageable without hiding the scope. I asked for tabs (Required / Optional / Not Needed) but deferred to Claude on the UX pattern, noting I was going for "slick."

**What Claude recommended:** Segmented control defaulting to the Required view (4 pre-checked files), with each file showing a description of what it enables and a `?` modal explaining the skill's verdict on why it's required, optional, or not needed. The key insight was leading with what the collection enables, not why it's filtered out.

**My call:** Segmented control. It communicates the filter state more clearly than tabs and handles the scale of the Klaviyo spec without overwhelming. The `?` modal format — description first, then skill verdict — was a specific direction I gave after reviewing the first version.

---

## Decision 8 — Remove handoff-spec.md, add architecture.md

**Trigger:** Cleanup before the implementation plan.

**Context:** `handoff-spec.md` was a loose notes file from before the BRD/FSD existed. Everything useful in it had been captured in structured form. It was clutter. Meanwhile, there was no standalone architecture document that rendered nicely in GitHub — the `05-architecture.html` file is good as a prototype but doesn't render in the repo browser.

**My call:** Delete the handoff spec, create `docs/architecture.md` with GitHub-native Mermaid diagrams. The architecture doc became the visual companion to the FSD — pipeline diagram, two-layer skill delivery diagram, cross-skill causation sequence diagram, component map, and links to all other documents. This is now the first document I'd show someone who asks how the system works.

---

## Decision 9 — Three-phase implementation plan

**Trigger:** Writing the implementation plan.

**Context:** The plan covers three separable workstreams: skill files (markdown, no infrastructure), prototype update (HTML, no infrastructure), and backend + live integration (Python, Docker, Klaviyo API key). These could have been three separate plans.

**My call:** One plan, three phases. Phase 1 (Tasks 1–3) is independently shippable with zero infrastructure dependencies — just writing files. Phase 2 (Tasks 4–6) needs Python and a Klaviyo API key. Phase 3 (Tasks 7–8) needs Docker. The phasing means I can ship a demonstrable portfolio artifact even if the backend work takes longer, and the plan is structured so each phase's deliverable is visible and credible on its own.

---

## Decision 10 — Subagent-driven execution

**Trigger:** Choosing how to execute the implementation plan.

**Context:** Two options: subagent-driven (fresh subagent per task, review after each, no pausing) or inline execution (same session, checkpoints). Subagent-driven is more expensive in API calls but produces higher-quality output because each task gets focused context and a review gate.

**My call:** Subagent-driven. For a portfolio artifact where quality matters more than speed, the review-after-each-task model is worth the overhead. I want spec compliance confirmed before the next task starts, not discovered at the end.

---

*All decisions made June 2026. Platform: Claude Code (claude-sonnet-4-6).*
