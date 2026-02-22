---
name: osint
description: Open-Source Intelligence research methodology -- multi-wave, progressively deepening investigation with structured intel output
version: 1.0.0
triggers:
  - "osint on"
  - "do osint"
  - "investigate"
  - "intelligence on"
  - "research on"
  - "dig into"
  - "deep dive on"
---

# OSINT: Open-Source Intelligence Research

**Purpose:** Conduct structured, multi-wave open-source intelligence research on a subject (person, organization, event, or topic) using publicly available sources. Produce a formatted intelligence briefing with sourced analysis and prediction matrices.

**Pattern:** The Investigative Spiral -- each wave narrows focus, increases depth, and builds on prior findings.

---

## Scope & Ethics

This skill is for research using **publicly available information only**:
- News media, government databases, court records
- Academic publications, think tank analyses
- Public social media, corporate filings
- Sanctions lists, wanted databases, org charts

**Never:**
- Attempt to access private/authenticated systems
- Dox private individuals
- Generate information that enables targeting or violence
- Fabricate or speculate beyond what sources support

---

## Methodology: The Four Waves

### Wave 1: Broad Reconnaissance

**Goal:** Establish baseline profile. Cast wide net.

Launch **3-4 parallel WebSearch** queries covering different angles:

```
WebSearch: "$SUBJECT profile background biography"
WebSearch: "$SUBJECT latest news [current year]"
WebSearch: "$SUBJECT [domain] structure leadership"
WebSearch: "$SUBJECT [government/legal] status charges"
```

**Output:** Basic identity, timeline, key relationships, current status.

### Wave 2: Targeted Deep Dive

**Goal:** Drill into key figures, relationships, and dynamics identified in Wave 1.

Launch **3-4 parallel WebSearch** queries on specific findings:

```
WebSearch: "[Key Figure A] role connection to $SUBJECT"
WebSearch: "[Organization] structure members sanctions"
WebSearch: "[Event/Conflict] details timeline analysis"
WebSearch: "[Financial/Legal] aspect indictments court records"
```

**Supplement with WebFetch** on high-value URLs found in Wave 1 (government profiles, think tank reports, court documents).

**Output:** Detailed profiles of key figures, org charts, relationship maps.

### Wave 3: Analytical Sources

**Goal:** Get expert analysis, academic research, and predictive frameworks.

Target **authoritative analytical sources**:
- Think tanks: Brookings, ACLED, InSight Crime, CFR, ICG, RAND
- Government: DEA, State Dept, Treasury/OFAC, DNI/NCTC, FBI
- Academic: university research centers, peer-reviewed journals
- Investigative: Bellingcat, OCCRP

```
WebSearch: "$SUBJECT [analytical angle] analysis expert assessment"
WebFetch: [think tank URL] "Extract all analytical details about..."
WebFetch: [government URL] "Extract complete profile/designation..."
```

**Output:** Expert predictions, historical parallels, structural analysis.

### Wave 4: User-Directed Drill-Down

**Goal:** Go deep on whatever angle the user requests.

This wave is triggered by user direction ("dig deeper into X"). Apply the same multi-parallel search pattern but focused entirely on the requested angle.

**Output:** Exhaustive detail on the specific sub-topic.

---

## Source Hierarchy

Prioritize sources by reliability:

| Tier | Source Type | Examples | Trust Level |
|------|-----------|----------|-------------|
| 1 | Government primary | DEA, State Dept, OFAC, court records | Highest (official) |
| 2 | Academic/Think tank | Brookings, ACLED, university research | High (peer-reviewed) |
| 3 | Quality investigative | InSight Crime, Bellingcat, OCCRP | High (methodology-driven) |
| 4 | Major news wire | AP, Reuters, AFP, NPR, PBS | Medium-high (editorial standards) |
| 5 | Regional/specialized | Domain-specific news outlets | Medium (domain expertise, less editorial rigor) |
| 6 | Social media/unverified | X/Twitter, Telegram, anonymous sources | Low (corroborate before using) |

**Rule:** Never state something as fact from Tier 6 alone. Always triangulate across tiers.

---

## Output Structure: Intelligence Briefing

### Standard Report Sections

```markdown
# OSINT [PROFILE/BRIEFING/ANALYSIS]: $SUBJECT

## 1. IDENTITY / OVERVIEW
[Basic profile, aliases, DOB, origin, physical description if known]

## 2. TIMELINE / HISTORY
[Chronological key events, rise to prominence, arrests, etc.]

## 3. ORGANIZATIONAL STRUCTURE
[Org chart table: Name | Alias | Role | Status | Reward]
[Key relationships, family connections, alliances]

## 4. OPERATIONAL ANALYSIS
[How they operate, territorial control, revenue streams, methods]

## 5. CURRENT DYNAMICS
[Breaking news, recent developments, ongoing conflicts]

## 6. SCENARIO ANALYSIS
[Prediction matrix with probability, timeline, triggers]
| Scenario | Probability | Timeline | Trigger |

## 7. KEY METRICS
[Numbers table: members, revenue, territory, etc.]

## 8. SOURCES
[All URLs as markdown hyperlinks, organized by tier]
```

### Formatting Standards

- **Tables** for structured data (org charts, metrics, scenarios)
- **Bold** for key names, terms, and emphasis
- **Tiered headers** for scannable structure
- **Source links** always included at bottom
- **Prediction matrices** with probability ratings (LOW/MEDIUM/MEDIUM-HIGH/HIGH/CERTAIN)

---

## Error Recovery

| Problem | Recovery |
|---------|----------|
| WebFetch returns 403/blocked | Fall back to WebSearch for same info from different sources |
| Source contradicts another | Note the contradiction, cite both, assess which is more reliable |
| Paywall blocks key article | Search for the same story on wire services (AP/Reuters) or quote the preview |
| Limited English sources | Search in the subject's native language, translate key findings |
| Information is stale | Note the date, flag as potentially outdated, search for updates |

---

## Modifiers

| Modifier | Values | Default | Description |
|----------|--------|---------|-------------|
| @depth: | 1-4 | 3 | Number of research waves |
| @focus: | string | broad | Initial angle to emphasize |
| @output: | report, brief, profile | report | Output format (full report, executive brief, or identity profile) |

---

## Usage Examples

```bash
# Full OSINT research
/osint "subject name"

# Quick profile only
/osint @depth:1 @output:profile "target name"

# Focused angle
/osint @focus:finances "organization name"
```

---

## Origin

Extracted from a real OSINT research session (Feb 2026). The session involved 4 progressive research waves, 27 parallel web searches, and 10 deep article extractions, producing 2 structured intelligence briefings with prediction matrices, org charts, and link analysis. The multi-wave parallel search methodology proved significantly more effective than sequential single queries.

---

*Part of the [Claude Code Skills](https://github.com/HermeticOrmus/claude-code-skills) collection -- skills extracted from real AI-assisted development sessions.*
