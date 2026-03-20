# Review: SPEC.md Public Readiness

Date: 2026-03-20
Reviewer: Codex (public-consumption and scrutiny review)
Scope: `/Users/anthonymaley/hail/SPEC.md`

## Overall Judgment

The spec is strong conceptually, but it is not yet publication-tight for external scrutiny. The main problems are semantic: parser behavior, scoping, and compatibility claims are not fully coherent as written. An outside implementer would challenge these before debating naming or examples.

## Findings by Severity

### 1. HIGH: Forward-compatibility claim is false with the current name-disambiguation rule

`SPEC.md` says unknown directives are ignored. But the named-directive parsing rule says a parser decides whether the segment after a directive prefix is a speaker name by checking the parser's known directive list.

That creates a contradiction. A future directive can be misread by an older parser as a speaker name or malformed directive instead of being cleanly ignored. Under public scrutiny, this will be treated as a spec-level incompatibility, not a corner case.

Relevant lines in `SPEC.md`: 117-118, 131.

Recommendation: either change the name-disambiguation rule so it does not depend on a parser's known directive set, or narrow the forward-compatibility claim so it is explicitly best-effort rather than guaranteed ignore behavior.

### 2. HIGH: Header scoping is internally inconsistent after turn 1

The scoping section defines header directives as directives before the first line of plain text in a document. Later text says you can promote an inline directive to session-level by restating it in a new turn's header block.

Those models conflict. A directive placed after a `---` separator but before that turn's plain text is inside the document body, but the spec also implies it can act like a header. That leaves parser authors without a stable rule for later turns.

Relevant lines in `SPEC.md`: 139-143, 160, 251-256.

Recommendation: choose one explicit model and state it normatively:

- either only the document has a header, and everything after turn 1 is inline
- or each turn has its own header block, with separate persistence rules

### 3. HIGH: Repeated-directive semantics are contradictory

One rule says multiple directives of the same type stack. The overrides section then says restating a directive replaces the old value. The spec only partly resolves this by mentioning that `<<:example:` is stackable, but it never defines the full set of stackable directives versus replacing directives.

That leaves important behavior undefined for directives like `<<:tone:`, `<<:avoid:`, `^:constraint:`, and `^:blocked:`.

Relevant lines in `SPEC.md`: 129, 164-188.

Recommendation: add a normative table or a universal rule with explicit exceptions. Without that, different implementations will make incompatible choices.

### 4. MEDIUM: Markdown-first positioning conflicts with the turn-separator syntax

The spec recommends Markdown as the default container until dedicated Hail tooling exists. It also gives a bare `---` line structural meaning as a turn separator.

In normal Markdown, `---` already appears as a thematic break and in front matter. That means ordinary `.md` files can change meaning simply by containing standard Markdown syntax.

Relevant lines in `SPEC.md`: 15, 255-259.

Recommendation: add an escape rule, narrow the turn-separator syntax, or stop recommending plain Markdown as the default embedding format until the collision is resolved.

## Open Assumptions

- This review assumes the goal is real backward compatibility for older parsers, not just best-effort parsing.
- This review assumes later turns are intended to be able to set session-level flow directives deliberately.
- This review assumes interoperability between independent parser implementations matters for public release.

## Additional Publication Risk

`SPEC.md` presents `.hail` and `text/hail` as if they are established identifiers:

- File extension: `.hail`
- MIME type: `text/hail`

If those are proposed or informal rather than registered, say so explicitly. Otherwise readers may interpret the spec as claiming a registration status that does not exist.

Relevant lines in `SPEC.md`: 11-12.

## Final Take

This is close, but not yet hardened enough for external scrutiny. The right next move is not broad rewriting. It is tightening the parsing and scoping model so that the compatibility and lifecycle claims are defensible in a public spec.
