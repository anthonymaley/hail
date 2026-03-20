# How We Use Hail In Repos

Use Hail as a collaboration layer, not as a replacement for normal writing.

## Core Model

- `^:` is durable shared state
- `<<:` is human-to-AI flow guidance
- `>>:` is AI-to-human feedback

## When To Use Each Channel

Use `^:` for things that should stay true until changed:
- goals
- constraints
- ownership
- decisions
- blockers
- artifacts

Use `<<:` for what you want right now:
- tone
- format
- audience
- examples
- priority
- temporary context

Use `>>:` for what the AI needs to surface without cluttering the main answer:
- assumptions
- uncertainty
- suggestions
- references
- limits

`>>:` directives are response-level. They describe the AI turn they appear in and don't persist. To make something durable, promote it to `^:`.

## File Format

For single-turn use (repo docs, notes), `.md` works fine. Directives embed in markdown without issues.

For multi-turn conversations with `---` turn separators, use `.hail` or put `<<:hail:` on the first line. This enables native parsing where `---` means a turn boundary, not a markdown thematic break.

## Practical Rules

- default to plain language first; add directives only when they help
- use `^:context:` by default for persistent project context
- use `<<:context:` only for turn-specific context
- keep durable state near the top when possible, but update it inline when reality changes
- put `>>:` notes after the main answer
- clear stale directives explicitly instead of letting them linger
- do not add Hail comments to files that do not use Hail
- some directives stack (`<<:example:`, `<<:avoid:`, `^:context:`, `^:constraint:`, `^:decision:`, `^:artifact:`, `>>:ref:`, `>>:suggestion:`); all others replace on restatement

## Minimal Repo Pattern

```text
^:context: tvOS app redesign repo
^:goal: align implementation with design docs
^:ownership: {
anthony: product direction
codex: implementation
claude: review
}
^:status: in_progress

Review the current home screen and propose the next slice.

<<:priority: high
<<:avoid: unnecessary churn
```

## Reference

- [Hail SPEC](https://github.com/anthonymaley/hail/blob/main/SPEC.md)
