# Playbook: Hail

How to rebuild this project from scratch.

## Tech Stack

TypeScript (parser). The spec lives in `SPEC.md`. The parser lives in `packages/hail-parser/`.

## Setup

Clone the repo. Read `SPEC.md`. For practical usage patterns, read `docs/usage-guide.md`. For parser work, use `packages/hail-parser/README.md`, then run `npm test` and `npm run build` in `packages/hail-parser/`.

## Architecture

Hail is a markup language spec with three directive channels: `^:` (durable shared state), `<<:` (human-to-AI flow), `>>:` (AI-to-human feedback). Two parsing modes: native (`.hail` files or `<<:hail:` opt-in) and embedded (plain `.md` files).

## Repo Structure

```
SPEC.md                      — the language specification
README.md                    — public landing page
LICENSE                      — MIT
CLAUDE.md                    — session workflow (Claude Code)
AGENTS.md                    — session workflow (Codex)
TODO.md                      — roadmap
docs/
  usage-guide.md             — practical rules for using Hail
  readme-template.md         — snippet for repos that use Hail
  playbook.md                — this file
  proposals/                 — design proposals and reviews
examples/
  code-review.md             — code review conversation
  creative-writing.md        — blog post writing
  multi-audience.md          — same incident, three audiences
  quick-task.md              — minimal one-shot task
packages/
  hail-parser/               — TypeScript parser and CLI
    README.md                — package usage and development notes
    src/                     — tokenizer, parser, types, CLI
    tests/                   — 44 tests
```

## Gotchas

The `^:` prefix was used for human directives in v0.1 through v0.3, removed in v0.4, and reintroduced in v0.9 with new semantics as directionless shared state. Git history reflects this evolution.

## Current Status

Spec at v0.9.1 (draft). Three-channel model, native/embedded parsing modes, per-turn header scoping, stackable directive list, structural colon disambiguation, named directives. Parser built (TypeScript, 44 tests, zero runtime deps) with CLI validation and fenced-code handling. Package README added. Not yet published to npm. Next priorities: publish parser, add spec-derived conformance fixtures, tighten validator/spec alignment, and dogfood in real repos.
