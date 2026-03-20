# Hail

**Human-AI Language**

A plain-text protocol for structured human-AI communication. Three prefixes. No tooling required.

```
^:context: Mobile app for elderly users
^:goal: write onboarding copy

Write the first 3 screens.

<<:tone: warm, encouraging
<<:length: 50 words per screen

---

Here's your onboarding copy:

1. Welcome to SimpleHealth...

>>:assumed: screens have a Next button
>>:suggestion: say "press the big green button" instead of "tap"
```

## The three channels

`^:` is **durable shared state**. Goals, decisions, ownership, blockers, constraints. Persists until you change it. Anyone can write to it.

`<<:` is **human to AI**. Tone, format, audience, priority. Guides the current request. Header directives persist. Inline directives expire at the next turn.

`>>:` is **AI to human**. Assumptions, uncertainty, suggestions, references, limits. Attached to the response that produced them. Don't persist.

## Why

Prompt engineering is people reverse-engineering what structure AI models respond to. Hail makes that structure explicit. You write `<<:tone: direct` instead of burying "please be direct and concise" in a paragraph. You write `^:goal: ship v1` once instead of restating it every turn.

It works inside markdown files. No special editor, no tooling, no dependencies. A `.md` file with Hail directives renders fine on GitHub, in Obsidian, anywhere.

For multi-turn conversations, use `.hail` or add `<<:hail:` on the first line to enable turn separators.

## Docs

- **[SPEC.md](SPEC.md)** — the full language specification
- **[Usage Guide](docs/usage-guide.md)** — practical rules for using Hail in repos
- **[README Template](docs/readme-template.md)** — snippet to paste into your own repo
- **[Examples](examples/)** — code review, creative writing, multi-audience, quick tasks

## Status

Draft spec (v0.9.1). Designed by a human, reviewed by Claude, Gemini, ChatGPT, and Codex. Ready for real-world use. No tooling yet.

## License

MIT
