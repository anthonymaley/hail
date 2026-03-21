# Hail

## Hail Collaboration

<!-- Collaboration metadata in this file uses Hail directives: https://github.com/anthonymaley/hail/blob/main/SPEC.md -->

^:context: {
The Hail repo defines and dogfoods Hail, a plain-text protocol for human-AI collaboration.
Primary artifacts live in `SPEC.md`, `docs/usage-guide.md`, `CLAUDE.md`, `AGENTS.md`, and `packages/hail-parser/`.
Current state: draft spec v0.9.1, parser and CLI implemented locally, package not yet published to npm.
}
^:goal: Start using Hail directives in this repo for collaboration between Anthony, Codex, and Claude while hardening the spec and parser through real usage.
^:ownership: {
anthony: direction
codex: implementation
claude: review
}
^:status: in_progress
^:constraint: {
When wrapping up a session (`/kerd:switch out` or `/kerd:dian`), update `TODO.md`.
When steps, tools, config, or status change, update `docs/playbook.md` and always refresh "Current Status".
Follow the Doc Impact Table when changing `README.md`, `SPEC.md`, `docs/usage-guide.md`, `docs/playbook.md`, or `TODO.md`.
}
^:constraint: keep the spec minimal; add directives only when real usage proves the need
^:constraint: no runtime dependencies in hail-parser
^:artifact: SPEC.md
^:artifact: packages/hail-parser/
^:artifact: INBOX.hail

At the start of each session, read `INBOX.hail` for open decisions, suggestions, and blockers. Write to it when something needs Anthony's input or when a decision is made.

## Session Workflow

When wrapping up a session (`/kerd:switch out` or `/kerd:dian`):
1. Update `TODO.md`: check off completed items, add new ones.
2. Update `docs/playbook.md`: if any new steps, tools, or config were added during the session, add them to the playbook. Always update the "Current Status" section.

## Doc Impact Table

| Doc | Update When |
|-----|-------------|
| README.md | Project description, setup steps, or structure changes |
| SPEC.md | Language design changes, new directives, syntax changes |
| docs/usage-guide.md | Practical usage rules or channel guidance changes |
| docs/playbook.md | New setup steps, integrations, gotchas, tech stack changes, or status changes |
| TODO.md | Every session close-out |
