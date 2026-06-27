# How This Was Built

*A first-person account of building an AI-assisted integration demo using Claude Code*

---

## The Problem I Was Trying to Solve

I spent years as a TPM watching the same integration failure repeat itself across every company I worked with. A developer pulls an API spec, skims the docs, and starts writing. Three weeks later they're in a postmortem explaining why profile deletes weren't showing up in the audit log, or why the segment they built in the morning has zero members by afternoon. The knowledge to avoid that was always available — someone on the team had been burned by that exact API before — but it never made it into the code in time.

What I wanted to build was a demo that proves a specific claim: AI can codify that institutional knowledge and put it in the room before the first line of code is written, not after the first production incident.

The target was Klaviyo. Not because it's the most complex platform, but because it has exactly the kind of gotcha density that makes this worth demonstrating — async deletes that look synchronous, two add-member endpoints that return identical 200 responses but produce completely different outcomes, segment membership that's computed rather than writable. Enough real traps that surfacing them looks meaningful, not contrived.

---

## How I Approached the Build

I decided to do the entire thing through Claude Code — not as a novelty, but as a deliberate choice about how I want to work. My thesis is that experienced technical PMs who can direct AI agents precisely are going to be more effective than developers who write code manually. This project is the proof of concept for that thesis, which means the build process itself is part of the demo.

I started with a handoff spec I'd already written — a loose set of notes about what I wanted to build. From there I directed Claude to produce a proper BRD, then an FSD tied to the BRD, then a design doc, then an implementation plan, and finally to execute the plan task by task. The entire thing — requirements through working artifacts — built through conversation.

What I found is that the quality of what you get out depends entirely on how precisely you direct it. Vague prompts produce generic outputs. Specific decisions — what audience, what format, what scope — produce documents that are actually useful. The skill is in knowing what questions to ask and when to push back on the answer.

---

## The Moments That Shaped the Design

### The companion skill question

Midway through the FSD, I asked a direct question: does the MCP server contain the skill to understand the APIs, or does it just wrap them? This turned out to be the most important architectural question in the project.

The answer was that the MCP generator produces an API wrapper — tool definitions that map calls to endpoints — but doesn't encode behavioral knowledge. An LLM using a generated MCP server with no other context will call `delete_profile` and assume the profile is gone immediately. It will call `subscribe` to add someone to a list and see a 200 response, and assume it worked, when Klaviyo's default double opt-in setting means nobody was actually added.

This led to the two-layer skill architecture: enrich the OpenAPI spec with behavioral descriptions before generation (so the tool definitions carry the most critical facts), and load a companion skill file at session start (so the model has full domain context when it's actually driving the server). The design doc ended up being built around this insight.

### The segment membership causation

I knew there was a difference between Klaviyo lists and segments, but I was treating them as variations of the same scenario rather than fundamentally different things. I pushed on this, and what came back clarified something I'd been treating as implicit: **profile data quality directly drives segment membership, with no explicit add-member call.**

This isn't a footnote. It's the core CDP value proposition. When you upsert a profile with `properties.vip_tier = "gold"` and a segment rule matches that property, the profile appears in the segment in about thirty seconds — automatically, without any audience management call. That causation — data quality driving audience composition — is exactly what differentiates a real CDP from a list management tool, and it's almost never surfaced explicitly in API documentation.

Once I understood this, I reframed the entire verification payoff. The demo doesn't just show that you can call Klaviyo APIs. It shows that profile data quality drives audience membership, and that the AI knows to surface this connection before you write a single line of code.

### Splitting into three scenarios

The original scope was two scenarios: Manage Profiles and Manage Audiences. I'd been treating lists and segments as two facets of audience management. The more I worked through the FSD, the more obvious it became that they're fundamentally different skills.

Lists have manually-curated, writable membership. Segments have computed, non-writable membership. The HITL warnings are completely different, the failure modes are completely different, and the cross-skill interaction (where profile data drives segment membership) only makes sense if segments are their own thing. Merging them into one scenario would have buried the most interesting part of the demo.

So I made the call to split: Manage Profiles (Skill 1), Manage Audiences — Lists (Skill 2), Manage Segments (Skill 3). That decision rippled through the BRD, FSD, design doc, architecture diagram, implementation plan, and prototype. Propagating it correctly across six documents is exactly the kind of work that's tedious to do manually and that Claude handles well when directed precisely.

---

## What the Actual Build Looked Like

I directed the work in this sequence:

1. **BRD** — established the business case, success criteria, and scope. The constraint that mattered most: structured spec input only, no prose scraping. This forces the demo to prove the point on real API specs, not cherry-picked documentation.

2. **FSD** — nine sections, then ten after splitting into three scenarios. The HITL warning tables are the heart of it — each row is a real gotcha that a developer integrating without this domain knowledge would have hit in production. I validated every fact against Klaviyo's developer docs and community threads before it went into the spec.

3. **Architecture diagram** — Mermaid diagrams in GitHub-native markdown. A pipeline diagram, a two-layer skill delivery diagram, and a cross-skill causation sequence diagram. The goal was something that renders beautifully in the repo and communicates the architecture at a glance.

4. **Design doc** — synthesized everything into a single spec: component breakdown, data flow, error handling for every known failure point, testing approach. The design doc is what I'd hand an engineer on the first day.

5. **Implementation plan** — eight tasks across three phases. Phase 1 (skill files + prototype) has no infrastructure dependencies and is independently shippable. Phase 2 (FastAPI backend) needs a Python environment and a Klaviyo API key. Phase 3 (MCP generation) needs Docker. The phasing is deliberate: each phase produces a demonstrable artifact.

6. **Execution** — the plan is being executed task by task through subagent-driven development. Each task goes to a fresh subagent, gets reviewed for spec compliance and code quality, and is fixed if needed before the next task starts.

---

## What I Learned About Directing AI

The biggest shift from how most people use AI coding tools is treating the output as something you're directing, not something you're accepting. When Claude produced the initial FSD with lists and segments merged into one scenario, I didn't accept it — I pushed on it until the underlying concept was clear, then made the call to split.

That dynamic — AI surfacing what it knows, human deciding what matters — is what makes this approach different from just generating code. The AI can hold more domain knowledge than any individual developer, but it doesn't know which tradeoffs matter for your specific demo, your specific audience, your specific claim. That's judgment, and judgment is what I bring.

The other thing I learned: precision compounds. Every time I gave a vague direction, I got a generic output and had to iterate. Every time I gave a precise direction — specific format, specific audience, specific scope decision — I got something I could use. The skill of working with AI agents is the same as the skill of working with any team: clear requirements produce good work, vague requirements produce anything that satisfies the letter of the ask.

---

## The Honest Version of the Claim

I didn't build Klaviyo expertise by using Claude. I brought domain knowledge from years of working with martech platforms and directed an AI that has broad API knowledge to encode it into structured artifacts. What came back was better organized, more complete, and more consistent than what I would have produced alone — but the judgment calls were mine.

That's the actual value of this approach. Not that AI replaces expertise, but that it lets someone with expertise produce at a scale and speed they couldn't match working manually. The BRD, FSD, design doc, implementation plan, architecture diagram, and skill files in this repo represent maybe forty hours of equivalent manual work. The time I spent directing and reviewing them was a fraction of that.

That ratio — direction and review time versus manual production time — is what I'm claiming. And this repo is the proof.

---

*Built June 2026 using Claude Code (claude-sonnet-4-6). All Klaviyo API facts verified against official developer documentation and community threads.*
