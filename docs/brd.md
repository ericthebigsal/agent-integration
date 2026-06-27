# Business Requirements Document
## AI-Assisted Martech/Adtech Integration Builder

**Version:** 1.0  
**Date:** 2026-06-27  
**Status:** Draft  
**References:** [Functional Specification](fsd.md) · [Architecture](architecture.md) · [Design Doc](superpowers/specs/2026-06-27-martech-integration-builder-design.md)

---

## 1. Executive Summary

Integrating with martech and adtech platforms is consistently slow and error-prone — not because the APIs are secret, but because documentation quality varies wildly, common failure modes are underdocumented, and teams repeatedly rediscover the same gotchas from scratch. This project demonstrates how AI can accelerate and de-risk that integration work by combining structured spec input with codified domain knowledge ("skills") about how categories of integration typically behave — surfacing what will bite you before you hit it in production, not after.

The deliverable is a demo, not a production tool. Success means: a real API call hits a real platform and works, the AI-assisted path visibly shortened the time to get there, and the domain skill surfaced warnings a naive integration would have missed — at the review step and again at call time via a companion skill that travels with the MCP server. The demo also surfaces the causal link across the three integration scenarios: a profile upsert with the right custom property automatically changes segment membership, with no explicit audience-management call. That causation — profile data quality driving audience composition — is the core CDP value proposition made visible.

---

## 2. Business Objectives

- **Demonstrate credibility:** Produce a public, runnable artifact that substantiates the claim that AI can cut third-party API integration time by an order of magnitude — with an honest, measured number from this build, not recycled from prior work.
- **Show the "skill" concept in action:** Make visible that the AI is not just keyword-matching endpoint names, but applying codified domain priors to interrogate an unfamiliar spec intelligently — and that those priors persist beyond the review screen as a companion skill that guides correct MCP tool usage at runtime.
- **Prove the HITL model:** Surface genuinely useful warnings at review time — warnings that a developer integrating without domain expertise would not have known to look for.
- **Demonstrate cross-skill causation:** Show that profile data quality directly drives segment membership — upsert a profile with the right custom property, and the matching segment updates automatically. No explicit add-member call. This makes the connection across all three skills visible and demonstrates a CDP concept that most integrations treat as implicit.
- **Complete end-to-end:** Ship the demo completable in under 10 minutes, with a real Klaviyo API call as the payoff moment.

---

## 3. Stakeholders & Roles

| Role | Who | Responsibility |
|---|---|---|
| Builder | Eric Salerno | Design, implementation, demo |
| Reviewer | Target startup CTO / founder | Portfolio audience; evaluates technical credibility |
| Demo subject | Klaviyo (free tier) | Integration target; provides real API sandbox |
| Evaluator | Future clients / collaborators | Assess approach for reuse in their stack |

---

## 4. Scope

### In scope
- Three integration scenarios: **Manage Profiles**, **Manage Audiences** (Lists), **Manage Segments**
- One target platform: **Klaviyo** (free tier, private API key)
- Input: structured spec only — OpenAPI / Postman / `$discovery` document
- Human-in-the-loop (HITL) review step, surfacing skill-sourced warnings on confirmed specs
- MCP server generation using a free open-source OpenAPI→MCP tool, against an enriched Klaviyo OpenAPI spec (critical behavioral facts injected into tool descriptions pre-generation)
- Companion Claude skill file (`skills/klaviyo-api.md`) encoding full domain knowledge for LLM-assisted MCP usage at runtime
- Cross-skill interaction scenario: profile property upsert → automatic segment membership update, demonstrating causation across all three skills (FSD Section 4)
- End-to-end verification: live Klaviyo API call confirmed in dashboard

### Out of scope
- Prose-doc scraping fallback path
- CAPI / Offline Conversion Events scenario
- Paid media journey-triggering (Snapchat)
- Multi-platform comparison matrix
- "Delete all" bulk profile operation
- Braze (no viable free API sandbox — free trial is dashboard-only, REST API requires paid account)

---

## 5. Success Criteria

| Criterion | Definition of done |
|---|---|
| Live API call | Upsert a test profile → add to a test list → create segment with matching property rule → confirm profile appears in segment automatically (no add-member call) — all confirmed in Klaviyo dashboard |
| Cross-skill causation | Segment membership updates within 60 seconds of profile upsert; wait surfaced explicitly in demo UI so it reads as computation, not failure |
| MCP server generation | Server starts from enriched Klaviyo OpenAPI spec, tools list matches the ~10 expected operations, behavioral facts visible in tool descriptions |
| Companion skill | `skills/klaviyo-api.md` exists, covers all ~10 operations, and surfaces at least the 4 highest-severity gotchas from the FSD warning tables |
| HITL review surface area | Review screen shows ≥2 skill-sourced warnings per scenario (Manage Profiles, Manage Audiences, Manage Segments) that are not derivable from the spec alone |
| Demo time | End-to-end walkthrough completable in under 10 minutes |
| Portfolio readiness | GitHub repo is public, README is navigable, prototype HTML files open without a server |

---

## 6. Constraints & Assumptions

- **Free tools only:** No paid API sandboxes, no paid SaaS. Klaviyo free tier confirmed viable.
- **Structured spec input only:** The OpenAPI→MCP generator path requires a machine-readable spec. Prose-scraping is explicitly out of scope for this build.
- **Klaviyo is sole platform:** All API facts in the FSD are verified against Klaviyo's published developer documentation and developer community threads — not inferred.
- **MCP generator is adapted, not built:** `ckanthony/openapi-mcp` or `harsha-iiiv/openapi-mcp-generator` will be used as-is (with filtering configuration), not reimplemented.
- **Demo format:** Web UI, standalone HTML prototypes (no build step, open locally).

---

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Klaviyo Data Privacy API (delete) returns intermittent 401s post-revision-bump | Known live issue (confirmed April 2026 community thread) | Medium — demo might fail during delete step | Warn in HITL review; test before demo; script retry logic |
| Double opt-in on list subscribe silently succeeds but adds no one | High likelihood on default Klaviyo account settings | High — demo looks broken with no error | Explicitly surface in skill warning; confirm opt-in setting before demo run |
| OpenAPI→MCP generator doesn't handle Klaviyo's JSON:API envelope format | Unknown until tested | Medium — MCP server generates but tools fail at runtime | Pull and test generator against real Klaviyo spec early; have fallback generator ready |
| Klaviyo segment creation rate limit (100/day) exhausted during testing | Medium if running tests repeatedly | Low for demo (only creating 1 segment) | Track usage; run segment creation tests sparingly |
| Segment membership update delay (10–60 seconds) makes demo look broken | High — this is always true, not an edge case | Medium — audience appears empty while Klaviyo is still computing | Surface the wait explicitly in the verification UI; pre-seed test data before live demo run |

---

## 8. References

- [Functional Specification](fsd.md)
- [Handoff Spec / Design Notes](../handoff-spec.md)
- [Klaviyo Developer Docs](https://developers.klaviyo.com)
- [Klaviyo Developer Community](https://community.klaviyo.com)
- [`ckanthony/openapi-mcp`](https://github.com/ckanthony/openapi-mcp)
- [`harsha-iiiv/openapi-mcp-generator`](https://github.com/harsha-iiiv/openapi-mcp-generator)
