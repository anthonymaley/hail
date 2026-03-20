# Playbook: Hail

How to rebuild this project from scratch.

## Tech Stack

Pure spec project. No code dependencies. The spec lives in `SPEC.md` at the repo root.

## Setup

Clone the repo. Read `SPEC.md`. For practical usage patterns, read `docs/usage-guide.md`.

## Architecture

Hail is a markup language spec with three directive channels: `^:` (durable shared state), `<<:` (human-to-AI flow), `>>:` (AI-to-human feedback). The core artifact is `SPEC.md`. Supporting docs live in `docs/`. Examples live in `examples/`.

## Repo Structure

```
SPEC.md                      — the language specification
README.md                    — project overview and quick example
CLAUDE.md                    — session workflow for Claude Code
AGENTS.md                    — session workflow for Codex
docs/
  usage-guide.md             — practical rules for using Hail in repos
  readme-template.md         — snippet to paste into repos that use Hail
  playbook.md                — this file
  proposals/                 — historical spec proposals and reviews
examples/
  code-review.md             — code review conversation
  creative-writing.md        — blog post writing
  multi-audience.md          — same incident, three audiences
  quick-task.md              — minimal one-shot task
```

## Integrations

None yet.

## Deployment

Not applicable. The spec is the deliverable. When tooling is built (parser, syntax highlighting, CLI), deployment will be via npm/crates/pip.

## Gotchas

The `^:` prefix was used for human directives in v0.1 through v0.3. It was removed in v0.4 when we switched to `<<:`/`>>:`. In v0.9, `^:` returned with new semantics as directionless shared state. Git history reflects this evolution.

## Current Status

Spec at v0.9.1 (draft). Three-channel model (`^:` / `<<:` / `>>:`), named directives, durable shared state, per-turn header scoping, stackable directive list, native/embedded parsing modes, structural colon disambiguation. Reviewed by Claude, Gemini, ChatGPT, and Codex. Usage guide and README template written. Ready for real-world use. No tooling yet.
