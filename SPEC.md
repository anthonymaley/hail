# Hail: Human-AI Language

Version 0.9.0 (draft)

## What it is

Hail is a lightweight markup language for structured communication between humans and AI. Plain text with optional directives that make intent, context, and constraints explicit without making the conversation robotic.

A valid Hail document can be a single sentence. The structure is there when you need it.

File extension: `.hail`
MIME type: `text/hail`
Encoding: UTF-8

## Design principles

Plain text is valid Hail. Any natural language sentence works. You add structure only when freeform language isn't cutting it.

Directives are persistent. You set context once and it holds across the conversation until you override it. The scaffolding stays while the conversation evolves around it.

Direction is visible. Hail uses three directive channels:

- `^:` for durable shared collaboration state
- `<<:` for human-to-AI flow directives
- `>>:` for AI-to-human flow directives

The arrows still describe conversational direction. The `^:` channel is directionless shared state.

Hail is advisory by default. Directives guide interpretation and coordination, but they do not create executable logic or guaranteed enforcement.

## Directives

A directive is a line starting with `^:`, `<<:`, or `>>:`. It's metadata. It tells the other side how to interpret the natural language around it.

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

A parser disambiguates names from directives by checking against the known directive list. If the segment after a directive prefix is a recognized directive name, there's no speaker name. If it's not, it's a speaker name and the directive follows.

Named directives follow the same scoping rules as unnamed ones. `<<:anthony:tone: formal` in the header persists for anthony across all turns. `<<:sarah:tone: casual` is independent and persists for sarah.

For `^:` directives, unnamed values are shared by default. Named `^:` directives apply to the named participant.

If named and unnamed directives of the same type are both present, the named value overrides the unnamed value for that participant.

### Rules

Directives can appear anywhere in the document: top, inline, bottom.

Multiple directives of the same type stack. `<<:tone: warm` plus `<<:tone: concise` means warm and concise.

Unknown directives are ignored. This keeps the language forward-compatible. A parser from 2026 won't choke on a directive added in 2028.

## Scoping

Directives have two lifetimes depending on where they appear.

**Shared durable directives** using `^:` are session-level by meaning, not by position. They may appear anywhere in a document and remain active until explicitly cleared or replaced.

**Header directives** appear before the first line of plain text in a document. They are session-level. They persist across all turns until explicitly cleared or replaced.

**Inline directives** appear inside the body, after plain text has started. They are turn-level. They apply to the current turn only and expire at the next `---` separator.

This header/inline distinction applies to `<<:` and `>>:`. Durable `^:` directives are not turn-scoped.

```
^:context: Building a mobile app
<<:tone: friendly

What colors should I use?

<<:format: bullet list

---

Now write the CSS.
```

In the example above, `^:context:` remains active until changed. `<<:tone:` persists because it is a header directive. `<<:format:` applies only to the first turn and expires at the separator.

To promote an inline flow directive to session-level, move it to the header or restate it in a new turn's header block.

## Overrides and clearing

To replace a directive, restate it with a new value. The old value is gone.

```
<<:tone: friendly

What colors should I use?

---

<<:tone: formal

Now write the client proposal.
```

To clear a directive entirely, use the directive prefix and name with no value.

```
<<:tone:

Write whatever feels natural.
```

This works for any directive. `<<:avoid:` with no value removes all avoid rules. `<<:as:` with no value drops the persona. `^:goal:` with no value clears the durable goal.

For stacking directives like `<<:example:`, clearing removes all stacked values. To replace just one, clear and restate the ones you want to keep.

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

The `<<:shape:` directive defines expected output structure without being a schema language. It's loose and human-readable.

```
<<:shape: {
title: short phrase
body: 2-3 sentences
cta: button label, max 4 words
}
```

This is communication, not enforcement. The AI interprets `body: 2-3 sentences` with common sense.

## Document structure

A Hail document has two regions. The header is every `<<:` or `>>:` directive before the first line of plain text. The body is everything after. See the Scoping section for how these regions affect directive lifetime.

Shared `^:` directives are durable by meaning and may appear in either region.

For multi-turn conversations, `---` separates turns. Shared directives and header directives carry forward across all turns. Inline directives expire at the next `---`.

A `---` line is a turn separator only when it appears on its own line outside a braced directive block and outside fenced code.

An optional `<<:hail:` version line, if present, must be the very first line of the document, before the header directives.

## Parsing notes

Speaker names may contain letters, numbers, `_`, and `-`. Speaker names must not match reserved directive names. If a name collides with a directive name, rename the speaker identifier.

Directive names are case-sensitive. Use lowercase.

Whitespace immediately after the final `:` is ignored.

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

This conversation shows durable shared state (`^:context:`) persisting across turns. Header directives (`<<:audience:`, `<<:tone:`, `<<:avoid:`, `<<:example:`) also persist across turns. Inline directives (`<<:length:`, `<<:shape:`) apply only to their turn. The `<<:tone: concerned but not alarming` in a later turn overrides the earlier header `<<:tone: warm, encouraging`. The `<<:tone:` with no value later clears the tone entirely. AI directives (`>>:assumed:`, `>>:suggestion:`, `>>:uncertain:`, `>>:ref:`) surface metadata without breaking the natural response.

## Versioning

A Hail document can declare which spec version it targets using `<<:hail:` as the first line of the file.

```
<<:hail: 0.9

<<:context: Building a CLI tool in Rust

How should I structure the argument parser?
```

The version is optional. If omitted, the parser uses the latest version it supports. The version number follows major.minor only. No patch versions. Spec changes that add new directives bump the minor version. Changes that break existing documents bump the major version.

A parser that encounters a version it doesn't support should warn but still attempt to parse the document. Unknown directives are already ignored by design, so a newer document will mostly work with an older parser. The version line is a hint, not a gate.

## What Hail is not

Hail is not a programming language. There's no logic, no conditionals, no loops.

Hail is not a schema language. `<<:shape:` is a suggestion, not a contract.

Hail is not a replacement for conversation. The natural language between directives is where the real communication happens. Directives are scaffolding.

## Status

This is a draft spec. The directive set will grow based on what people actually need. The design is intentionally minimal so there's room to discover what's missing rather than guess wrong upfront.
