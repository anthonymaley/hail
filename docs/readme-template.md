## Hail Collaboration

This repo may use [Hail](https://github.com/anthonymaley/hail/blob/main/SPEC.md) for human/AI collaboration.

Hail is plain text with lightweight directives for shared state and workflow metadata.

Prefixes:
- `^:` durable shared state
- `<<:` human-to-AI flow guidance
- `>>:` AI-to-human feedback

Example:

```text
^:context: Celtic TV tvOS repo
^:goal: align the home screen with the design docs
^:ownership: {
anthony: product direction
codex: implementation
claude: review
}

Review the current home screen and propose the next implementation slice.

<<:priority: high
<<:avoid: unnecessary churn

>>:assumed: the design docs in kivna/input are the current source of truth
```

Guidelines:
- Use `^:` for goals, constraints, decisions, blockers, and ownership.
- Use `<<:` for temporary instructions about the current request.
- Use `>>:` for assumptions, uncertainty, references, and limits. These don't persist across turns.
- For multi-turn `.md` files, add `<<:hail:` on the first line to enable turn separators.
- If in doubt, use plain language first and add Hail directives only where they improve clarity.
