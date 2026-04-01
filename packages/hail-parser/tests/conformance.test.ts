/**
 * Spec conformance fixtures derived from SPEC.md canonical examples.
 * Line references point to the SPEC.md source.
 */

import { describe, it, expect } from 'vitest'
import { parse } from '../src/parser.js'
import { tokenize, validate } from '../src/tokenizer.js'

// ---------------------------------------------------------------------------
// 1. Simplest valid documents (SPEC lines 293-301)
// ---------------------------------------------------------------------------

describe('simplest valid documents', () => {
  it('plain text is valid Hail — single turn, no directives', () => {
    const doc = parse("What's the capital of France?")
    expect(doc.mode).toBe('embedded')
    expect(doc.version).toBeUndefined()
    expect(doc.turns).toHaveLength(1)
    expect(doc.turns[0].header).toHaveLength(0)
    expect(doc.turns[0].body).toHaveLength(1)
    expect(doc.turns[0].body[0].type).toBe('text')
  })

  it('single directive followed by plain text', () => {
    const source = `<<:context: studying for a geography exam
What's the capital of France?`
    const doc = parse(source)
    expect(doc.mode).toBe('embedded')
    expect(doc.turns).toHaveLength(1)

    // <<:context: should be in the header (appears before first text line)
    const header = doc.turns[0].header
    expect(header).toHaveLength(1)
    expect(header[0].channel).toBe('<<:')
    expect(header[0].name).toBe('context')
    expect(header[0].value).toBe('studying for a geography exam')
    expect(header[0].scope).toBe('session')

    // Body has the question text
    const textItems = doc.turns[0].body.filter((b) => b.type === 'text')
    expect(textItems.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 2. Multi-party collaboration — Celtic TV example (SPEC lines 306-348)
// ---------------------------------------------------------------------------

describe('multi-party collaboration (Celtic TV example)', () => {
  const source = `<<:hail: 0.9

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
^:status: review`

  it('parses in native mode with correct version', () => {
    const doc = parse(source)
    expect(doc.mode).toBe('native')
    expect(doc.version).toBe('0.9')
  })

  it('produces 6 turns', () => {
    const doc = parse(source)
    expect(doc.turns).toHaveLength(6)
  })

  it('turn 0: durable state set — context, goal, ownership, status', () => {
    const doc = parse(source)
    const state = doc.turns[0].state
    expect(state.durable.has('context')).toBe(true)
    expect(state.durable.has('goal')).toBe(true)
    expect(state.durable.has('ownership')).toBe(true)
    expect(state.durable.has('status')).toBe(true)

    const status = state.durable.get('status')!
    expect(status[0].value).toBe('in_progress')
  })

  it('turn 0: ^:context: is stackable and has the right value', () => {
    const doc = parse(source)
    const ctx = doc.turns[0].state.durable.get('context')!
    expect(ctx).toHaveLength(1)
    expect(ctx[0].value).toBe('Celtic TV tvOS repo')
    expect(ctx[0].stackable).toBe(true)
  })

  it('turn 0: named directives parsed — speaker attached to inline directives', () => {
    const doc = parse(source)
    const turn0 = doc.turns[0]
    // <<:anthony:priority: and <<:anthony:avoid: are inline (after text), so they land in body
    const bodyDirectives = turn0.body.filter((b) => b.type === 'directive')
    expect(bodyDirectives.length).toBeGreaterThanOrEqual(2)

    const priority = bodyDirectives.find(
      (b) => b.type === 'directive' && b.directive.name === 'priority',
    )
    expect(priority).toBeDefined()
    if (priority?.type === 'directive') {
      expect(priority.directive.speaker).toBe('anthony')
      expect(priority.directive.value).toBe('high')
      expect(priority.directive.channel).toBe('<<:')
    }

    const avoid = bodyDirectives.find(
      (b) => b.type === 'directive' && b.directive.name === 'avoid',
    )
    expect(avoid).toBeDefined()
    if (avoid?.type === 'directive') {
      expect(avoid.directive.speaker).toBe('anthony')
      expect(avoid.directive.value).toBe('unnecessary churn')
    }
  })

  it('turn 2: ^:decision: set in durable state', () => {
    const doc = parse(source)
    const state = doc.turns[2].state
    expect(state.durable.has('decision')).toBe(true)
    const decision = state.durable.get('decision')!
    expect(decision[0].value).toBe('Match Hub remains the primary organizing concept')
  })

  it('turn 3: ^:blocked: set in durable state', () => {
    const doc = parse(source)
    const state = doc.turns[3].state
    expect(state.durable.has('blocked')).toBe(true)
    const blocked = state.durable.get('blocked')!
    expect(blocked[0].value).toBe('waiting on API credentials for replay validation')
  })

  it('turn 5: ^:blocked: cleared, ^:status: updated to review', () => {
    const doc = parse(source)
    const state = doc.turns[5].state
    expect(state.durable.has('blocked')).toBe(false)

    const status = state.durable.get('status')!
    expect(status[0].value).toBe('review')
  })

  it('turn 4: named >>:codex:suggestion: is in header (response scope) and is stackable', () => {
    const doc = parse(source)
    const turn4 = doc.turns[4]
    // >>: directives appear before any text in this turn, so they land in header
    const suggestions = turn4.header.filter(
      (d) => d.name === 'suggestion',
    )
    expect(suggestions.length).toBeGreaterThanOrEqual(1)
    expect(suggestions[0].speaker).toBe('codex')
    expect(suggestions[0].stackable).toBe(true)
    expect(suggestions[0].channel).toBe('>>:')
    expect(suggestions[0].scope).toBe('response')
  })
})

// ---------------------------------------------------------------------------
// 3. Full conversation with scoping (medication app example, SPEC lines 350-433)
// ---------------------------------------------------------------------------

describe('full conversation with scoping (medication app example)', () => {
  const source = `<<:hail: 0.9

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

>>:assumed: "Metformin" is a placeholder, the app fills in the real name`

  it('parses in native mode with 6 turns', () => {
    const doc = parse(source)
    expect(doc.mode).toBe('native')
    expect(doc.turns).toHaveLength(6)
  })

  it('turn 0: ^:context: multi-line block captured as durable stackable', () => {
    const doc = parse(source)
    const state = doc.turns[0].state
    const ctx = state.durable.get('context')!
    expect(ctx).toHaveLength(1)
    expect(ctx[0].stackable).toBe(true)
    expect(ctx[0].value).toContain('Medication reminder app for elderly users')
    expect(ctx[0].value).toContain('React Native with Expo')
    expect(ctx[0].value).toContain('iOS and Android')
  })

  it('turn 0: <<:tone: and <<:audience: set as session directives', () => {
    const doc = parse(source)
    const session = doc.turns[0].state.session
    expect(session.has('tone')).toBe(true)
    expect(session.get('tone')![0].value).toBe('warm, encouraging')
    expect(session.has('audience')).toBe(true)
    expect(session.get('audience')![0].value).toBe('end users, age 65+')
  })

  it('turn 0: <<:avoid: is stackable, persists in session', () => {
    const doc = parse(source)
    const session = doc.turns[0].state.session
    const avoid = session.get('avoid')!
    expect(avoid[0].stackable).toBe(true)
    expect(avoid[0].value).toBe('medical jargon, technical error messages')
  })

  it('turn 0: <<:example: is a stackable header directive', () => {
    const doc = parse(source)
    const header = doc.turns[0].header
    const example = header.find((d) => d.name === 'example')
    expect(example).toBeDefined()
    expect(example!.stackable).toBe(true)
    expect(example!.value).toContain('Error 403')
  })

  it('turn 0: <<:length: is inline (after text) — turn scope, not session', () => {
    const doc = parse(source)
    const turn0 = doc.turns[0]
    const bodyLength = turn0.body.find(
      (b) => b.type === 'directive' && b.directive.name === 'length',
    )
    expect(bodyLength).toBeDefined()
    if (bodyLength?.type === 'directive') {
      expect(bodyLength.directive.scope).toBe('turn')
    }
    // Inline <<: directive should NOT appear in session state
    const session = turn0.state.session
    expect(session.has('length')).toBe(false)
  })

  it('turn 1: >>:suggestion: multi-line block parsed as response-scope stackable', () => {
    const doc = parse(source)
    const turn1 = doc.turns[1]
    const suggestion = turn1.body.find(
      (b) => b.type === 'directive' && b.directive.name === 'suggestion',
    )
    expect(suggestion).toBeDefined()
    if (suggestion?.type === 'directive') {
      expect(suggestion.directive.channel).toBe('>>:')
      expect(suggestion.directive.scope).toBe('response')
      expect(suggestion.directive.stackable).toBe(true)
      expect(suggestion.directive.value).toContain('Screen 2')
    }
  })

  it('turn 2: <<:tone: override appears inline (body) since it follows text — turn scope', () => {
    const doc = parse(source)
    // turn 2 is the human "Good. Now write..." turn
    // <<:tone: concerned but not alarming follows text, so it's inline / turn-scoped
    const turn2 = doc.turns[2]
    const toneBody = turn2.body.find(
      (b) => b.type === 'directive' && b.directive.name === 'tone',
    )
    expect(toneBody).toBeDefined()
    if (toneBody?.type === 'directive') {
      expect(toneBody.directive.value).toBe('concerned but not alarming')
      expect(toneBody.directive.scope).toBe('turn')
    }
  })

  it('turn 4: <<:tone: cleared with empty value', () => {
    const doc = parse(source)
    // turn 4: <<:tone:\n\nYes, include the med name.
    const turn4 = doc.turns[4]
    // After turn 4, tone should be cleared from session state
    const session = turn4.state.session
    expect(session.has('tone')).toBe(false)
  })

  it('^:context: persists through all turns', () => {
    const doc = parse(source)
    for (const turn of doc.turns) {
      expect(turn.state.durable.has('context')).toBe(true)
    }
  })

  it('>>:ref: in turn 1 has response scope and is stackable', () => {
    const doc = parse(source)
    const turn1 = doc.turns[1]
    const ref = turn1.body.find(
      (b) => b.type === 'directive' && b.directive.name === 'ref',
    )
    expect(ref).toBeDefined()
    if (ref?.type === 'directive') {
      expect(ref.directive.channel).toBe('>>:')
      expect(ref.directive.scope).toBe('response')
      expect(ref.directive.stackable).toBe(true)
      expect(ref.directive.value).toContain('Apple HIG')
    }
  })
})

// ---------------------------------------------------------------------------
// 4. Named directive structural disambiguation (SPEC lines 95-124)
// ---------------------------------------------------------------------------

describe('named directive structural disambiguation', () => {
  it('one segment = unnamed directive', () => {
    const tokens = tokenize('<<:context: some value')
    const dt = tokens.find((t) => t.type === 'directive') as any
    expect(dt).toBeDefined()
    expect(dt.speaker).toBeUndefined()
    expect(dt.name).toBe('context')
    expect(dt.value).toBe('some value')
  })

  it('two segments = named directive', () => {
    const tokens = tokenize('<<:anthony:context: I am the product lead')
    const dt = tokens.find((t) => t.type === 'directive') as any
    expect(dt).toBeDefined()
    expect(dt.speaker).toBe('anthony')
    expect(dt.name).toBe('context')
    expect(dt.value).toBe('I am the product lead')
  })

  it('colons in the value are not structural', () => {
    const tokens = tokenize('<<:context: error 403: something went wrong')
    const dt = tokens.find((t) => t.type === 'directive') as any
    expect(dt).toBeDefined()
    expect(dt.speaker).toBeUndefined()
    expect(dt.name).toBe('context')
    expect(dt.value).toBe('error 403: something went wrong')
  })

  it('more than two segments is invalid — validate() produces a Too many segments error', () => {
    const issues = validate('<<:a:b:c: value')
    const errors = issues.filter((i) => i.severity === 'error')
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toContain('Too many segments')
  })

  it('speaker names may contain letters, numbers, underscores, and hyphens', () => {
    const validNames = [
      '<<:anthony_maley:context: hi',
      '<<:user-1:context: hi',
      '<<:claude2:context: hi',
    ]
    for (const line of validNames) {
      const tokens = tokenize(line)
      const dt = tokens.find((t) => t.type === 'directive') as any
      expect(dt).toBeDefined()
      expect(dt.speaker).toBeDefined()
    }
  })

  it('named and unnamed directives of the same type can coexist', () => {
    const source = `<<:hail: 0.9

<<:tone: friendly
<<:sarah:tone: casual

Some text`
    const doc = parse(source)
    const session = doc.turns[0].state.session
    // unnamed tone
    expect(session.has('tone')).toBe(true)
    expect(session.get('tone')![0].value).toBe('friendly')
    // named tone for sarah
    expect(session.has('sarah:tone')).toBe(true)
    expect(session.get('sarah:tone')![0].value).toBe('casual')
  })

  it('named directive uses speaker:name key in state', () => {
    const source = `<<:hail: 0.9

<<:anthony:priority: high

Some text`
    const doc = parse(source)
    const session = doc.turns[0].state.session
    expect(session.has('anthony:priority')).toBe(true)
    expect(session.get('anthony:priority')![0].speaker).toBe('anthony')
    expect(session.get('anthony:priority')![0].name).toBe('priority')
    expect(session.get('anthony:priority')![0].value).toBe('high')
  })
})

// ---------------------------------------------------------------------------
// 5. Document structure and parsing modes (SPEC lines 266-284)
// ---------------------------------------------------------------------------

describe('document structure and parsing modes', () => {
  it('embedded mode: .md filename — no turn separators active', () => {
    const source = `<<:context: something

Some text

---

More text`
    const doc = parse(source, { filename: 'notes.md' })
    expect(doc.mode).toBe('embedded')
    // In embedded mode there is only 1 turn; --- is not a separator
    expect(doc.turns).toHaveLength(1)
  })

  it('native mode: .hail filename forces native mode', () => {
    const source = `^:context: Celtic TV tvOS repo

Some text

---

Next turn`
    const doc = parse(source, { filename: 'thread.hail' })
    expect(doc.mode).toBe('native')
    expect(doc.turns).toHaveLength(2)
  })

  it('native mode: <<:hail: on the first line enables native mode', () => {
    const source = `<<:hail: 0.9

Some text

---

Next turn`
    const doc = parse(source)
    expect(doc.mode).toBe('native')
    expect(doc.turns).toHaveLength(2)
  })

  it('version not on first line is not treated as a version token', () => {
    const source = `Some text

<<:hail: 0.9

More text`
    const doc = parse(source)
    // <<:hail: is not the first line, so native mode should NOT be activated
    expect(doc.mode).toBe('embedded')
    expect(doc.version).toBeUndefined()
  })

  it('unknown directives are ignored (no parse failure)', () => {
    const source = `<<:hail: 0.9

<<:newdirective: some future value

Some text`
    // Should parse without throwing
    expect(() => parse(source)).not.toThrow()
    const doc = parse(source)
    // The unknown directive is still tokenized and appears in the header
    const header = doc.turns[0].header
    const unknown = header.find((d) => d.name === 'newdirective')
    expect(unknown).toBeDefined()
    expect(unknown!.value).toBe('some future value')
  })

  it('directive names are case-sensitive — TONE and tone are distinct keys (SPEC line 281)', () => {
    const source = `<<:hail: 0.9

<<:tone: warm
<<:TONE: formal

Hello`
    const doc = parse(source)
    // Both should exist as separate keys in state (case-sensitive)
    expect(doc.turns[0].state.session.has('tone')).toBe(true)
    expect(doc.turns[0].state.session.has('TONE')).toBe(true)
    expect(doc.turns[0].state.session.get('tone')![0].value).toBe('warm')
    expect(doc.turns[0].state.session.get('TONE')![0].value).toBe('formal')
  })

  it('validate() warns on separator missing surrounding blank lines', () => {
    const issues = validate('some text\n---\nmore text')
    const warnings = issues.filter((i) => i.severity === 'warning')
    expect(warnings.length).toBeGreaterThan(0)
    expect(warnings[0].message).toContain('separator')
  })

  it('validate() returns no issues for a well-formed native document', () => {
    const source = `<<:hail: 0.9

^:context: Celtic TV

Some text

---

Response here`
    const issues = validate(source)
    expect(issues).toHaveLength(0)
  })

  it('mode can be forced via options.mode', () => {
    const source = `^:context: something

Turn 1

---

Turn 2`
    const native = parse(source, { mode: 'native' })
    expect(native.mode).toBe('native')
    expect(native.turns).toHaveLength(2)

    const embedded = parse(source, { mode: 'embedded' })
    expect(embedded.mode).toBe('embedded')
    expect(embedded.turns).toHaveLength(1)
  })
})
