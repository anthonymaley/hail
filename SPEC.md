# Hail: Human-AI Language

Version 0.3.0 (draft)

## What it is

Hail is a lightweight markup language for structured communication between humans and AI. Plain text with optional directives that make intent, context, and constraints explicit without making the conversation robotic.

A valid Hail document can be a single sentence. The structure is there when you need it.

File extension: `.hail`
MIME type: `text/hail`
Encoding: UTF-8

## Design principles

Plain text is valid Hail. Any natural language sentence works. You add structure only when freeform language isn't cutting it.

Directives are persistent. You set `^:context` once and it holds across the conversation until you override it. The scaffolding stays while the conversation evolves around it.

Direction is visible. `^:` means human to AI. `v:` means AI to human. You can scan a conversation and instantly know who set what. The colon disambiguates directives from ordinary text (a line starting with "very" won't be misread as a directive).

## Directives

A directive is a line starting with `^:` (human to AI) or `v:` (AI to human). It's metadata. It tells the other side how to interpret the natural language around it.

### Human directives (^:)

`^:context` sets what the AI needs to know.

`^:tone` sets how the response should feel.

`^:format` sets the shape of the output (bullet list, prose, table, code).

`^:length` sets a size constraint.

`^:audience` says who the output is for.

`^:example` shows what you want by demonstration.

`^:avoid` says what not to do.

`^:as` sets a role or persona.

`^:shape` defines the expected output structure.

### AI directives (v:)

`v:assumed` flags what the AI filled in on its own.

`v:uncertain` flags low confidence or ambiguity.

`v:suggestion` offers something unsolicited but useful.

`v:ref` cites a source.

`v:limit` explains what the AI couldn't do and why.

### Rules

Directives can appear anywhere in the document: top, inline, bottom.

Multiple directives of the same type stack. `^:tone warm` plus `^:tone concise` means warm and concise.

Unknown directives are ignored. This keeps the language forward-compatible. A parser from 2026 won't choke on a directive added in 2028.

## Scoping

Directives have two lifetimes depending on where they appear.

**Header directives** appear before the first line of plain text in a document. They are session-level. They persist across all turns until explicitly cleared or replaced.

**Inline directives** appear inside the body, after plain text has started. They are turn-level. They apply to the current turn only and expire at the next `---` separator.

```
^:context Building a mobile app       <-- header, persists
^:tone friendly                        <-- header, persists

What colors should I use?

^:format bullet list                   <-- inline, this turn only

---

Now write the CSS.                     <-- ^:context and ^:tone still active
                                       <-- ^:format bullet list has expired
```

To promote an inline directive to session-level, move it to the header or restate it in a new turn's header block (directives before that turn's first plain text line).

## Overrides and clearing

To replace a header directive, restate it with a new value. The old value is gone.

```
^:tone friendly

What colors should I use?

---

^:tone formal

Now write the client proposal.         <-- tone is formal, not friendly
```

To clear a directive entirely, use the directive name with no value.

```
^:tone

Write whatever feels natural.          <-- no tone constraint
```

This works for any directive. `^:avoid` with no value removes all avoid rules. `^:as` with no value drops the persona.

For stacking directives like `^:example`, clearing removes all stacked values. To replace just one, clear and restate the ones you want to keep.

## Multi-line blocks

For values longer than one line, use `{ }` brackets after the directive name.

```
^:context {
Medication reminder app for elderly users.
React Native with Expo.
Passed accessibility audit Feb 2026.
}
```

Blocks can contain any text including code snippets or markdown. Nesting is not supported. Keep parsing trivial.

AI directives use the same syntax.

```
v:suggestion {
Screen 2 uses "tap" but elderly users sometimes
struggle with tap targets under 44px. Consider
saying "press the big green button" instead.
}
```

## Examples and output shape

The `^:example` directive shows the AI what you want by demonstration.

Single line:

```
^:example "red" → "warm, energetic"
```

Block:

```
^:example {
input: "Your session has expired (error 401)"
output: "You've been signed out. Tap here to sign back in."
}
```

Multiple examples stack. The AI reads the pattern.

The `^:shape` directive defines expected output structure without being a schema language. It's loose and human-readable.

```
^:shape {
title: short phrase
body: 2-3 sentences
cta: button label, max 4 words
}
```

This is communication, not enforcement. The AI interprets `body: 2-3 sentences` with common sense.

## Document structure

A Hail document has two regions. The header is every `^:` directive before the first line of plain text. The body is everything after. See the Scoping section for how these regions affect directive lifetime.

For multi-turn conversations, `---` separates turns. Header directives carry forward across all turns. Inline directives expire at the next `---`.

An optional `^:hail` version line, if present, must be the very first line of the document, before the header directives.

## Examples

The simplest valid Hail document:

```
What's the capital of France?
```

With one directive:

```
^:context studying for a geography exam
What's the capital of France?
```

A full conversation showing scoping, overrides, AI directives, multi-line blocks, examples, and shape:

```
^:hail 0.1

^:context {
Medication reminder app for elderly users.
React Native with Expo. Passed accessibility audit Feb 2026.
Target: iOS and Android.
}
^:audience end users, age 65+
^:tone warm, encouraging
^:avoid medical jargon, technical error messages
^:example {
input: "Error 403: Authentication failure"
output: "We couldn't sign you in. Check your password and try again."
}

Write onboarding copy for the first 3 screens.

^:length 50 words per screen max
^:shape {
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

v:assumed screens will have a "Next" button at the bottom
v:suggestion {
Screen 2 says "tell us" but the input form only has
medication name and time fields. Consider saying
"add your medication and pick a time" to match the UI.
}
v:ref Apple HIG, Accessibility Guidelines 2026

---

Good. Now write the push notification for a missed dose.

^:tone concerned but not alarming
^:length 2 sentences max

---

You missed your 2pm medication. Open SimpleHealth to
mark it as taken or skip it for today.

v:assumed the notification shows the specific time
v:uncertain do you want the medication name in the notification?
  some users take multiple meds and the name helps

---

^:tone

Yes, include the med name. And drop the tone directive,
just write it plain.

---

You missed your 2pm Metformin. Open SimpleHealth to
mark it as taken or skip it for today.

v:assumed "Metformin" is a placeholder, the app fills in the real name
```

This conversation shows header directives (`^:context`, `^:audience`, `^:tone`, `^:avoid`, `^:example`) persisting across turns. Inline directives (`^:length`, `^:shape`) apply only to their turn. The `^:tone concerned but not alarming` in turn 3 overrides the header `^:tone warm, encouraging`. The `^:tone` with no value in turn 5 clears the tone entirely. AI directives (`v:assumed`, `v:suggestion`, `v:uncertain`, `v:ref`) surface metadata without breaking the natural response.

## Versioning

A Hail document can declare which spec version it targets using `^:hail` as the first line of the file.

```
^:hail 0.1

^:context Building a CLI tool in Rust

How should I structure the argument parser?
```

The version is optional. If omitted, the parser uses the latest version it supports. The version number follows major.minor only. No patch versions. Spec changes that add new directives bump the minor version. Changes that break existing documents bump the major version.

A parser that encounters a version it doesn't support should warn but still attempt to parse the document. Unknown directives are already ignored by design, so a newer document will mostly work with an older parser. The version line is a hint, not a gate.

## What Hail is not

Hail is not a programming language. There's no logic, no conditionals, no loops.

Hail is not a schema language. `^:shape` is a suggestion, not a contract.

Hail is not a replacement for conversation. The natural language between directives is where the real communication happens. Directives are scaffolding.

## Status

This is a draft spec. The directive set will grow based on what people actually need. The design is intentionally minimal so there's room to discover what's missing rather than guess wrong upfront.
