---
name: product-feasibility-scout
description: "Systematic API landscape and feasibility research for product concepts. Use when evaluating a product idea's technical viability, researching platform APIs, mapping competitor landscapes, or assessing legal/regulatory constraints. Trigger phrases: 'research APIs for', 'is this technically feasible', 'what APIs exist for', 'competitor landscape for', 'feasibility assessment'."
---

# Product Feasibility Scout

Systematically research the technical landscape for a product concept — platform APIs, competitor analysis, legal framework, and emerging approaches — producing a structured feasibility report with strategic recommendations.

## When to Use

- Evaluating whether a product idea is technically viable
- Researching what platform APIs exist for a use case
- Mapping the competitor landscape for a product category
- Assessing legal/regulatory constraints for a target market
- Before writing a spec or building a prototype

## The Research Framework

### 8 Research Axes

Every product feasibility assessment covers these axes. Skip any that don't apply, but consider all before skipping.

| # | Axis | Question Answered |
|---|------|-------------------|
| 1 | **Platform APIs** | What data/capabilities do relevant platforms expose? |
| 2 | **Data Access** | What can you actually get vs. what's blocked? |
| 3 | **Client-Side Alternatives** | Browser extensions, device agents, on-device ML? |
| 4 | **Competitor Landscape** | Who exists? What do they do well? What gaps remain? |
| 5 | **Legal/Privacy** | What regulations apply? What consent architecture is needed? |
| 6 | **Pricing & Limits** | Rate limits, API costs, scaling economics? |
| 7 | **Emerging Approaches** | New APIs, standards, or techniques on the horizon? |
| 8 | **Strategic Synthesis** | What's the highest-feasibility architecture? |

### Per-API Research Template

For each platform API investigated, capture:

```
## [Platform] API

### Access Status
[Open | Application-required | Restricted | Blocked]

### What IS Accessible
- [Data point]: [endpoint/method] — [scope/permission required]

### What is NOT Accessible
- [Data point]: [reason blocked, any workarounds]

### Rate Limits & Pricing
- Default: [X requests/day, free/paid]
- Scaling: [quota increase process]

### Restrictions for [Target Demographic]
- [Age-specific, geographic, or use-case restrictions]

### Recent Changes (past 12 months)
- [Deprecations, new endpoints, policy changes]

### Honest Assessment
[1-2 sentences: is this viable for the product? What's the critical gap?]
```

### Competitor Analysis Template

```
| Product | Approach | Strengths | Gaps | Pricing |
|---------|----------|-----------|------|---------|
| [Name]  | [Method] | [Best at] | [Missing] | [$/mo] |
```

After the table, answer: **"What gap does our product fill that no competitor occupies?"**

### Legal Framework Template

For each jurisdiction:
- Key law/regulation and effective date
- Requirements specific to the product category
- Consent architecture needed
- Penalties for non-compliance
- Practical implementation notes

### Output: Feasibility Matrix

Produce a summary matrix:

```
| Data Source | Key Capability | Difficulty | Access | Viability |
|------------|---------------|------------|--------|-----------|
| [Platform] | [What you get] | [LOW/MED/HIGH] | [Open/Restricted/Blocked] | [YES/PARTIAL/NO] |
```

### Output: Strategic Recommendations

End with 5-7 numbered recommendations, ordered by priority:
1. **[The backbone]** — What's the primary technical approach?
2. **[Best enrichment]** — Which API gives the richest supplementary data?
3. **[Hidden gem]** — Any unexpected data source worth pursuing?
4. **[Architecture]** — On-device vs. cloud vs. hybrid?
5. **[Differentiator]** — What makes this technically distinct from competitors?
6. **[Skip for MVP]** — What platforms/features to defer?
7. **[Legal priority]** — What compliance to build in from day one?

## Execution

Launch a `general-purpose` Task agent with the research prompt. Structure the prompt as:

```
Research the current landscape of [APIs/technologies] for [product concept].

Context: [What the product does, who it serves, what data it needs]

Research these specific areas:
1. [Platform API 1] — [specific questions]
2. [Platform API 2] — [specific questions]
...
N. Competitor landscape — [category]
N+1. Legal/privacy — [jurisdictions]
N+2. Emerging approaches — [technologies]

For each API, note:
- Current access status
- Key data points available
- Rate limits and pricing
- Restrictions for [target demographic]
- Recent changes (2025-2026)

This is RESEARCH ONLY — do not write any code.
Return a comprehensive, well-organized report.
```

## Quality Criteria

A complete feasibility report should:
- [ ] Cover all relevant platform APIs with honest assessments (not just feature lists)
- [ ] Distinguish between "technically possible" and "practically viable"
- [ ] Include at least 3 competitors with gap analysis
- [ ] Cover legal requirements for target jurisdictions
- [ ] Produce a feasibility matrix with clear YES/PARTIAL/NO ratings
- [ ] End with actionable strategic recommendations
- [ ] Cite sources (documentation URLs, blog posts, regulatory texts)

## Anti-Patterns

- **The Optimist**: Listing API features without noting what's blocked or restricted
- **The Pessimist**: Dismissing platforms without investigating workarounds
- **The Theorist**: Describing architectures without checking if APIs actually support them
- **The Copycat**: Describing competitors without identifying the unfilled gap
- **The Lawyer**: Over-indexing on legal constraints without practical implementation paths

## Origin

Distilled from Luciernaga feasibility research session (Feb 2026). Original session investigated YouTube Data API v3, TikTok Research API, Instagram/Meta APIs, Discord API, Chrome Extension APIs, 8+ competitors (Bark, Qustodio, BrightCanary, Canopy, etc.), COPPA 2025/GDPR/Panama Law 81, and on-device ML approaches.

---

*Part of [Claude Code Skills](https://github.com/HermeticOrmus/claude-code-skills) -- reusable skills extracted from real AI-assisted development sessions.*
