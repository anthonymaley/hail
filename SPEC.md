# Hail: Human-AI Language

Version 0.9.1 (draft)

## What it is

Hail is a markup language for human-AI communication. Plain text with optional directives that make intent, context, and constraints explicit.

A valid Hail document can be a single sentence. The structure is there when you need it.

File extension: `.hail` (optional)
MIME type: `text/hail` (proposed, not registered)
Encoding: UTF-8

Hail directives work inside markdown files. For single-turn use, `.md` is fine. For multi-turn conversations with `---` separators, use `.hail` or put `<<:hail:` on the first line to enable native parsing.

## Design principles

Plain text is valid Hail. Any natural language sentence works. You add structure only when freeform language isn't cutting it.

Directives are persistent. You set context once and it holds across the conversation until you override it. The scaffolding stays while the conversation evolves around it.

Direction is visible. Hail uses three directive channels:

- `^:` for durable shared collaboration state
- `<<:` for human-to-AI flow directives
- `>>:` for AI-to-human flow directives

The arrows still describe conversational direction. The `^:` channel is directionless shared state.

Hail is advisory. Directives guide interpretation. They don't create executable logic.

## Directives

A directive is a line starting with `^:`, `<<:`, or `>>:`. It's metadata. It tells participants how to interpret the natural language around it.

### Shared durable directives (^:)

`^:context:` sets standing background that all participants should treat as active.

`^:goal:` sets the durable objective for the collaboration.

`^:ownership:` assigns responsibility for an area, task, file set, or role.

`^:decision:` records an accepted decision that should persist across later turns.

`^:constraint:` records a standing rule or limitation.

`^:status:` records the durable state of the work such as `todo`, `in_progress`, `review`, or `done`.

`^:artifact:` records a durable pointer to a working document, file, branch, issue, or output.

`^:blocked:` records a blocker that should remain visible until cleared. When `^:blocked:` is active, the work is considered blocked regardless of `^:status:` value. Clear `^:blocked:` when the blocker is resolved.

### Human directives (<<:)

`<<:context:` sets what the AI needs to know.

Use `^:context:` instead when the context should remain active across participants or across multiple turns. If in doubt, use `^:context:`. It is the safer default.

`<<:tone:` sets how the response should feel.

`<<:format:` sets the shape of the output (bullet list, prose, table, code).

`<<:length:` sets a size constraint.

`<<:audience:` says who the output is for.

`<<:example:` shows what you want by demonstration.

`<<:avoid:` says what not to do.

`<<:as:` sets a role or persona.

`<<:shape:` defines the expected output structure.

`<<:priority:` sets relative importance such as `low`, `medium`, `high`, or freeform text.

### AI directives (>>:)

`>>:assumed:` flags what the AI filled in on its own.

`>>:uncertain:` flags low confidence or ambiguity.

`>>:suggestion:` offers something unsolicited but useful.

`>>:ref:` cites a source.

`>>:limit:` explains what the AI couldn't do and why.

AI directives are typically placed after the main response content, so the primary answer remains easy to read.

### Named directives

In multi-party conversations (multiple humans, multiple AIs, or both), add a name after the direction prefix to identify the speaker.

```
^:ownership: {
anthony: product direction
codex: implementation
claude: review
}

<<:anthony:context: I'm the product lead
<<:sarah:context: I'm the designer

What should the landing page look like?

---

>>:claude:suggestion: start with the value prop
>>:gemini:suggestion: lead with social proof instead
```

The name is optional. If absent, the directive belongs to whoever is speaking that turn. For single-human, single-AI conversations, names aren't needed and the syntax is unchanged.

A parser disambiguates named directives structurally, not by looking up known names. The final structural colon ends the directive header and is followed by a space, `{`, or end of line. One segment before it means unnamed (`<<:context: value`). Two segments means named (`<<:anthony:context: value`). Colons after the final structural colon belong to the value. More than two segments before it is invalid.

Named directives follow the same scoping rules as unnamed ones. `<<:anthony:tone: formal` in the header persists for anthony across all turns. `<<:sarah:tone: casual` is independent and persists for sarah.

For `^:` directives, unnamed values are shared by default. Named `^:` directives apply to the named participant.

If named and unnamed directives of the same type are both present, the named value overrides the unnamed value for that participant.

### Rules

Directives can appear anywhere in the document: top, inline, bottom.

By default, restating a directive replaces the previous value. `<<:tone: formal` after `<<:tone: friendly` means formal, not both.

The following directives are stackable (multiple values accumulate rather than replacing):
- `<<:example:`
- `<<:avoid:`
- `^:context:`
- `^:constraint:`
- `^:decision:`
- `^:artifact:`
- `>>:ref:`
- `>>:suggestion:`

For stackable directives, each new instance adds to the set. To clear all stacked values, use the directive with no value, then restate the ones you want to keep.

Unknown directives should be ignored rather than causing a parse failure. Forward-compatibility is best-effort: an older parser will skip directives it doesn't recognize, but it may not interpret their scoping or stacking behavior correctly.

## Scoping

Directives have two lifetimes depending on where they appear.

**Shared durable directives** using `^:` are session-level by meaning, not by position. They may appear anywhere in a document and remain active until explicitly cleared or replaced.

**Human header directives** using `<<:` appear before the first plain text line in a turn. They persist across all subsequent turns until cleared or replaced.

Each turn has its own header region. Directives before that turn's first plain text line are session-level.

**AI directives** using `>>:` are response-level. They describe the AI turn they appear in and do not persist into later turns. To make an AI observation durable, promote it to `^:`.

**Inline human directives** using `<<:` appear after plain text has started within a turn. They apply to that turn only and expire at the next `---`.

Durable `^:` directives are not affected by header/inline positioning. They are always session-level.

```
^:context: Building a mobile app
<<:tone: friendly

What colors should I use?

<<:format: bullet list

---

<<:audience: developers

Now write the CSS.
```

`^:context:` is durable. `<<:tone:` persists (turn 1 header). `<<:format:` expires (inline). `<<:audience:` persists (turn 2 header). `>>:` directives stay attached to the AI turn that produced them.

## Overrides and clearing

For replacing directives (the default), restating with a new value replaces the old one.

```
<<:tone: friendly

What colors should I use?

---

<<:tone: formal

Now write the client proposal.
```

For stackable directives, each restatement adds to the set rather than replacing.

To clear any directive (replacing or stackable), use the directive prefix and name with no value.

```
<<:tone:

Write whatever feels natural.
```

This works for any directive. `<<:avoid:` with no value removes all stacked avoid rules. `<<:as:` with no value drops the persona. `^:goal:` with no value clears the durable goal. For stackable directives, clearing removes all accumulated values. To keep some, clear first, then restate the ones you want.

## Multi-line blocks

For values longer than one line, use `{ }` brackets after the directive name.

```
^:context: {
Medication reminder app for elderly users.
React Native with Expo.
Passed accessibility audit Feb 2026.
}
```

Blocks can contain any text including code snippets or markdown. Nesting is not supported. Keep parsing trivial.

Lines inside a braced block are not parsed for directives. The block content is treated as opaque text.

AI directives use the same syntax.

```
>>:suggestion: {
Screen 2 uses "tap" but elderly users sometimes
struggle with tap targets under 44px. Consider
saying "press the big green button" instead.
}
```

## Examples and output shape

The `<<:example:` directive shows the AI what you want by demonstration.

Single line:

```
<<:example: "red" → "warm, energetic"
```

Block:

```
<<:example: {
input: "Your session has expired (error 401)"
output: "You've been signed out. Tap here to sign back in."
}
```

Multiple examples stack. The AI reads the pattern.

The `<<:shape:` directive defines expected output structure. It's loose and human-readable.

```
<<:shape: {
title: short phrase
body: 2-3 sentences
cta: button label, max 4 words
}
```

The AI interprets `body: 2-3 sentences` with common sense.

## Document structure

Hail has two parsing modes.

**Native mode** applies to `.hail` files and to any document with `<<:hail:` on the first line. In native mode, `---` on its own line (outside braced blocks and fenced code) is a turn separator. Each turn has a header region and a body region.

**Embedded mode** applies to `.md` files and other formats without `<<:hail:` on the first line. The document is parsed as a single turn. `---` keeps its host-format meaning (markdown thematic break, YAML frontmatter). Directives still work but there are no turn separators.

In both modes, `^:` directives are durable and may appear anywhere. `<<:` header directives carry forward across turns. Inline `<<:` directives expire at the next turn boundary. `>>:` directives stay attached to the AI turn that produced them.

An optional `<<:hail:` version line, if present, must be the very first line of the document.

## Parsing notes

Speaker names may contain letters, numbers, `_`, and `-`. Names don't need to avoid directive names because disambiguation is structural, not name-based.

Directive names are case-sensitive. Use lowercase.

The final structural colon is followed by a space, `{`, or end of line. Whitespace after it is ignored.

An empty directive value clears that directive in the current scope.

Parsers should preserve directive order.

## Examples

The simplest valid Hail document:

```
What's the capital of France?
```

With one directive:

```
<<:context: studying for a geography exam
What's the capital of France?
```

A multi-party collaboration example:

```
<<:hail: 0.9

^:context: Celtic TV tvOS repo
^:goal: align the home screen with the design docs
^:ownership: {
anthony: product direction
codex: implementation
claude: review
}
^:status: in_progress

Review the current home screen and propose the next implementation slice.

<<:anthony:priority: high
<<:anthony:avoid: unnecessary churn

---

>>:codex:assumed: the design docs in kivna/input are the current source of truth
>>:codex:suggestion: fix the hero Match Hub CTA before broader IA changes

---

>>:claude:suggestion: keep Match Hub as the primary organizing concept but challenge whether the rail card should expand on focus
^:decision: Match Hub remains the primary organizing concept

---

^:blocked: waiting on API credentials for replay validation

Can the implementation proceed without live playback verification?

---

>>:codex:limit: full playback verification can't be completed until credentials are available
>>:codex:suggestion: continue with non-network UI and navigation work while blocked

---

^:blocked:
^:status: review
```

A full conversation showing scoping, overrides, AI directives, multi-line blocks, examples, and shape:

```
<<:hail: 0.9

^:context: {
Medication reminder app for elderly users.
React Native with Expo. Passed accessibility audit Feb 2026.
Target: iOS and Android.
}
<<:audience: end users, age 65+
<<:tone: warm, encouraging
<<:avoid: medical jargon, technical error messages
<<:example: {
input: "Error 403: Authentication failure"
output: "We couldn't sign you in. Check your password and try again."
}

Write onboarding copy for the first 3 screens.

<<:length: 50 words per screen max
<<:shape: {
screen: int
heading: short phrase
body: 2-3 sentences, simple language
}

---

Here's your onboarding copy:

1. **Welcome**
   You're in the right place. SimpleHealth helps you take your
   medication on time, every time. No fuss.

2. **Set Your Reminders**
   Tell us what you take and when. We'll send you a gentle
   nudge when it's time. You can change this whenever you like.

3. **You're All Set**
   That's it. We'll remind you, you stay healthy.
   Tap the big green button to get started.

>>:assumed: screens will have a "Next" button at the bottom
>>:suggestion: {
Screen 2 says "tell us" but the input form only has
medication name and time fields. Consider saying
"add your medication and pick a time" to match the UI.
}
>>:ref: Apple HIG, Accessibility Guidelines 2026

---

Good. Now write the push notification for a missed dose.

<<:tone: concerned but not alarming
<<:length: 2 sentences max

---

You missed your 2pm medication. Open SimpleHealth to
mark it as taken or skip it for today.

>>:assumed: the notification shows the specific time
>>:uncertain: {
Do you want the medication name in the notification?
Some users take multiple meds and the name helps.
}

---

<<:tone:

Yes, include the med name. And drop the tone directive,
just write it plain.

---

You missed your 2pm Metformin. Open SimpleHealth to
mark it as taken or skip it for today.

>>:assumed: "Metformin" is a placeholder, the app fills in the real name
```

The example shows `^:context:` persisting, `<<:tone:` being overridden and then cleared, and inline directives expiring at each turn separator.

## Versioning

A Hail document can declare which spec version it targets using `<<:hail:` as the first line of the file.

```
<<:hail: 0.9

<<:context: Building a CLI tool in Rust

How should I structure the argument parser?
```

The version is optional. In `.hail` files, native mode applies regardless. In `.md` files, omitting the version line keeps the document in embedded single-turn mode. The version number follows major.minor only. No patch versions. New directives bump the minor. Breaking changes bump the major.

A parser that doesn't support the declared version should warn but still try. The version line is a hint, not a gate.

## What Hail is not

Hail is not a programming language. There's no logic, no conditionals, no loops.

Hail is not a schema language. `<<:shape:` is a suggestion, not a contract. The natural language between directives is where the real communication happens. Directives are scaffolding.

## Status

This is a draft spec. The directive set will grow based on what people actually need. The design is intentionally minimal so there's room to discover what's missing.
