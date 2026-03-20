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

Spec at v0.9.0 (draft). Three-channel model (`^:` / `<<:` / `>>:`), named directives for multi-party work, durable shared state, scoping rules, multi-line blocks, examples, versioning. Reviewed by Claude and Gemini. Usage guide and README template written. Ready for real-world use in repos. No tooling yet.
