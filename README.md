# Hail: Human-AI Interaction Layer

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
- **[Parser README](packages/hail-parser/README.md)** — API, CLI, parsing modes, development notes

## Parser

`hail-parser` is a TypeScript parser with zero runtime dependencies. Two layers: a tokenizer (string to token stream) and a parser (tokens to turn tree with resolved directive state).

```bash
npm install hail-parser
```

```typescript
import { parse, tokenize, validate } from 'hail-parser'

const doc = parse(source)
const tokens = tokenize(source)
const issues = validate(source)
```

CLI:

```bash
npx hail-parser document.md              # full parse tree
npx hail-parser document.hail --state    # active directive state
npx hail-parser document.hail --tokens   # raw token stream
npx hail-parser document.hail --validate # check for issues
```

## Next Up

- publish `hail-parser` to npm
- add conformance fixtures derived from canonical `SPEC.md` examples
- tighten validator/spec alignment and improve CLI diagnostics
- dogfood Hail in real repos before expanding the directive set

## Status

Draft spec (v0.9.1). Designed by a human, reviewed by Claude, Gemini, ChatGPT, and Codex. Parser built (44 tests). Not yet published to npm.

## License

MIT
