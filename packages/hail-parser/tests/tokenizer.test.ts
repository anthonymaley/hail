import { describe, it, expect } from 'vitest'
import { tokenize } from '../src/tokenizer.js'

describe('tokenizer', () => {
  it('parses plain text as a single text token', () => {
    const tokens = tokenize("What's the capital of France?")
    expect(tokens).toHaveLength(1)
    expect(tokens[0].type).toBe('text')
  })

  it('parses a simple directive', () => {
    const tokens = tokenize('<<:tone: warm')
    expect(tokens).toHaveLength(1)
    expect(tokens[0].type).toBe('directive')
    const d = tokens[0] as any
    expect(d.channel).toBe('<<:')
    expect(d.name).toBe('tone')
    expect(d.value).toBe('warm')
  })

  it('parses all three channels', () => {
    const source = `^:context: shared
<<:tone: warm
>>:assumed: something`
    const tokens = tokenize(source)
    expect(tokens).toHaveLength(3)
    expect((tokens[0] as any).channel).toBe('^:')
    expect((tokens[1] as any).channel).toBe('<<:')
    expect((tokens[2] as any).channel).toBe('>>:')
  })

  it('parses named directives', () => {
    const tokens = tokenize('<<:anthony:tone: formal')
    expect(tokens).toHaveLength(1)
    const d = tokens[0] as any
    expect(d.channel).toBe('<<:')
    expect(d.speaker).toBe('anthony')
    expect(d.name).toBe('tone')
    expect(d.value).toBe('formal')
  })

  it('parses version line', () => {
    const tokens = tokenize('<<:hail: 0.9')
    expect(tokens).toHaveLength(1)
    expect(tokens[0].type).toBe('version')
    expect((tokens[0] as any).version).toBe('0.9')
  })

  it('parses multi-line blocks', () => {
    const source = `^:context: {
line one
line two
}`
    const tokens = tokenize(source)
    expect(tokens[0].type).toBe('block_start')
    expect(tokens[1].type).toBe('block_content')
    expect(tokens[2].type).toBe('block_content')
    expect(tokens[3].type).toBe('block_end')
  })

  it('parses turn separators', () => {
    const source = `some text

---

more text`
    const tokens = tokenize(source)
    const sep = tokens.find((t) => t.type === 'separator') as any
    expect(sep).toBeDefined()
    expect(sep.valid).toBe(true)
  })

  it('marks separator as invalid without blank lines', () => {
    const source = `some text
---
more text`
    const tokens = tokenize(source)
    const sep = tokens.find((t) => t.type === 'separator') as any
    expect(sep).toBeDefined()
    expect(sep.valid).toBe(false)
  })

  it('handles empty directive value (clear)', () => {
    const tokens = tokenize('<<:tone:')
    expect(tokens).toHaveLength(1)
    const d = tokens[0] as any
    expect(d.name).toBe('tone')
    expect(d.value).toBe('')
  })

  it('preserves colons in values', () => {
    const tokens = tokenize('<<:context: time is 3:30pm')
    const d = tokens[0] as any
    expect(d.value).toBe('time is 3:30pm')
  })

  it('parses block start with inline value', () => {
    const source = `^:ownership: {
anthony: direction
claude: review
}`
    const tokens = tokenize(source)
    expect(tokens[0].type).toBe('block_start')
    expect((tokens[0] as any).value).toBe('')
  })
})
