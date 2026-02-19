# Hermetic Distillations

Reusable [Claude Code](https://docs.anthropic.com/en/docs/build-with-claude/claude-code) skills extracted from real AI-assisted development sessions.

Every skill here was built to solve a real problem on a real project -- then generalized into a reusable framework. Not theoretical. Battle-tested.

---

## Skills

| Skill | What It Does | Origin |
|-------|-------------|--------|
| [product-feasibility-scout](./product-feasibility-scout/) | Systematic API landscape and feasibility research for product concepts | Parental awareness app research (Feb 2026) |
| [site-perf-audit](./site-perf-audit/) | Diagnose and fix performance issues on Next.js / React websites | Medical clinic website optimization (Feb 2026) |

---

## How to Use

These are Claude Code skills. To use one:

1. Copy the skill directory to `~/.claude/skills/`
2. Invoke by name in Claude Code (e.g., type the trigger phrase)
3. Or read the SKILL.md and apply the framework manually

Each skill is self-contained with clear instructions, templates, quality criteria, and anti-patterns.

## Structure

```
hermetic-distillations/
  README.md              # This catalog
  LICENSE                # MIT + Gold Hat Addendum
  CLAUDE.md              # Repo instructions for Claude Code
  <skill-name>/
    SKILL.md             # The skill
    references/          # Optional supporting files
```

## The Extraction Process

Skills are extracted from real development sessions through a structured process:

1. **Identify** -- What repeatable pattern emerged from this session?
2. **Abstract** -- Separate the reusable structure from the specific context
3. **Generalize** -- Make it work for any project, not just the original one
4. **Validate** -- Does it hold up when applied to a different problem?

The goal: turn one-off problem-solving into permanent capability.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Skills should:

- Emerge from real work (not invented for the repo)
- Include an "Origin" section documenting the source project
- Be self-contained and clearly documented
- Follow the Gold Hat philosophy: empower, never extract

## Philosophy

These skills follow the **Gold Hat** principle: every tool should empower its user, not create dependency. Skills teach a process, not just execute a task. If you're curious about the deeper methodology behind the extraction process, see the [wiki](https://github.com/HermeticOrmus/hermetic-distillations/wiki).

## License

MIT + Gold Hat Addendum. See [LICENSE](LICENSE).
