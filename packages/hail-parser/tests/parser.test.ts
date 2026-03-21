import { describe, it, expect } from 'vitest'
import { parse, stateAt } from '../src/parser.js'

describe('parser', () => {
  it('parses plain text as a single-turn embedded document', () => {
    const doc = parse("What's the capital of France?")
    expect(doc.mode).toBe('embedded')
    expect(doc.turns).toHaveLength(1)
    expect(doc.turns[0].body).toHaveLength(1)
    expect(doc.turns[0].body[0].type).toBe('text')
  })

  it('detects native mode from version line', () => {
    const doc = parse('<<:hail: 0.9\n\nHello')
    expect(doc.mode).toBe('native')
    expect(doc.version).toBe('0.9')
  })

  it('detects native mode from filename', () => {
    const doc = parse('Hello', { filename: 'test.hail' })
    expect(doc.mode).toBe('native')
  })

  it('splits turns on valid separators in native mode', () => {
    const source = `<<:hail: 0.9

Turn one text

---

Turn two text`
    const doc = parse(source)
    expect(doc.turns).toHaveLength(2)
  })

  it('does not split turns in embedded mode', () => {
    const source = `Turn one text

---

Turn two text`
    const doc = parse(source)
    expect(doc.mode).toBe('embedded')
    expect(doc.turns).toHaveLength(1)
  })

  it('classifies header directives as session-level', () => {
    const source = `<<:hail: 0.9

<<:tone: warm

Hello world`
    const doc = parse(source)
    expect(doc.turns[0].header).toHaveLength(1)
    expect(doc.turns[0].header[0].scope).toBe('session')
  })

  it('classifies inline directives as turn-level', () => {
    const source = `<<:hail: 0.9

Hello world

<<:format: bullet list`
    const doc = parse(source)
    expect(doc.turns[0].body).toHaveLength(2)
    const inlineDir = doc.turns[0].body[1]
    expect(inlineDir.type).toBe('directive')
    if (inlineDir.type === 'directive') {
      expect(inlineDir.directive.scope).toBe('turn')
    }
  })

  it('classifies ^: directives as session-level regardless of position', () => {
    const source = `<<:hail: 0.9

Some text

^:decision: use React Native`
    const doc = parse(source)
    const bodyDir = doc.turns[0].body.find((b) => b.type === 'directive')
    expect(bodyDir).toBeDefined()
    if (bodyDir?.type === 'directive') {
      expect(bodyDir.directive.scope).toBe('session')
    }
  })

  it('classifies >>: directives as response-level', () => {
    const source = `<<:hail: 0.9

Here is the answer

>>:assumed: something`
    const doc = parse(source)
    const bodyDir = doc.turns[0].body.find((b) => b.type === 'directive')
    expect(bodyDir).toBeDefined()
    if (bodyDir?.type === 'directive') {
      expect(bodyDir.directive.scope).toBe('response')
    }
  })

  it('persists durable state across turns', () => {
    const source = `<<:hail: 0.9

^:context: building an app

Turn one

---

Turn two`
    const doc = parse(source)
    expect(doc.turns[1].state.durable.has('context')).toBe(true)
  })

  it('persists session <<: directives across turns', () => {
    const source = `<<:hail: 0.9

<<:tone: warm

Turn one

---

Turn two`
    const doc = parse(source)
    expect(doc.turns[1].state.session.has('tone')).toBe(true)
  })

  it('does not persist >>: directives across turns', () => {
    const source = `<<:hail: 0.9

Answer text

>>:assumed: something

---

Next turn`
    const doc = parse(source)
    expect(doc.turns[1].state.response.has('assumed')).toBe(false)
  })

  it('clears a directive with empty value', () => {
    const source = `<<:hail: 0.9

<<:tone: warm

Turn one

---

<<:tone:

Turn two`
    const doc = parse(source)
    expect(doc.turns[1].state.session.has('tone')).toBe(false)
  })

  it('stacks stackable directives', () => {
    const source = `<<:hail: 0.9

<<:avoid: jargon
<<:avoid: code samples

Write something`
    const doc = parse(source)
    const avoids = doc.turns[0].state.session.get('avoid')
    expect(avoids).toHaveLength(2)
  })

  it('replaces non-stackable directives', () => {
    const source = `<<:hail: 0.9

<<:tone: warm
<<:tone: formal

Write something`
    const doc = parse(source)
    const tones = doc.turns[0].state.session.get('tone')
    expect(tones).toHaveLength(1)
    expect(tones![0].value).toBe('formal')
  })

  it('handles multi-line block directives', () => {
    const source = `^:context: {
App for elderly users.
React Native.
}`
    const doc = parse(source)
    expect(doc.turns[0].header).toHaveLength(1)
    expect(doc.turns[0].header[0].value).toContain('App for elderly users.')
    expect(doc.turns[0].header[0].value).toContain('React Native.')
  })

  it('handles named directives in state', () => {
    const source = `<<:hail: 0.9

<<:anthony:tone: formal
<<:sarah:tone: casual

Hello`
    const doc = parse(source)
    expect(doc.turns[0].state.session.has('anthony:tone')).toBe(true)
    expect(doc.turns[0].state.session.has('sarah:tone')).toBe(true)
  })

  it('stateAt returns state for a specific turn', () => {
    const source = `<<:hail: 0.9

^:goal: ship v1

Turn one

---

^:status: review

Turn two`
    const doc = parse(source)
    const s0 = stateAt(doc, 0)
    const s1 = stateAt(doc, 1)
    expect(s0.durable.has('goal')).toBe(true)
    expect(s0.durable.has('status')).toBe(false)
    expect(s1.durable.has('goal')).toBe(true)
    expect(s1.durable.has('status')).toBe(true)
  })

  it('stateAt returns empty for out-of-range index', () => {
    const doc = parse('Hello')
    const state = stateAt(doc, 99)
    expect(state.durable.size).toBe(0)
  })

  it('per-turn header in later turns is session-level', () => {
    const source = `<<:hail: 0.9

Turn one

---

<<:audience: developers

Turn two

---

Turn three`
    const doc = parse(source)
    expect(doc.turns[1].header[0].scope).toBe('session')
    expect(doc.turns[2].state.session.has('audience')).toBe(true)
  })
})
