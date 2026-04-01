import { describe, it, expect } from 'vitest'
import { tokenize, validate } from '../src/tokenizer.js'

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

  it('does not parse directives inside fenced code blocks', () => {
    const source = `some text

\`\`\`
<<:tone: warm
---
\`\`\`

more text`
    const tokens = tokenize(source)
    const directives = tokens.filter((t) => t.type === 'directive')
    const separators = tokens.filter((t) => t.type === 'separator')
    expect(directives).toHaveLength(0)
    expect(separators).toHaveLength(0)
  })

  it('does not parse directives inside tilde fences', () => {
    const source = `~~~
<<:context: inside fence
~~~`
    const tokens = tokenize(source)
    const directives = tokens.filter((t) => t.type === 'directive')
    expect(directives).toHaveLength(0)
  })

  it('handles nested fence markers correctly', () => {
    const source = `\`\`\`\`
\`\`\`
<<:tone: still inside
\`\`\`
\`\`\`\``
    const tokens = tokenize(source)
    const directives = tokens.filter((t) => t.type === 'directive')
    expect(directives).toHaveLength(0)
  })

  it('resumes parsing after fence closes', () => {
    const source = `\`\`\`
inside fence
\`\`\`
<<:tone: outside fence`
    const tokens = tokenize(source)
    const directives = tokens.filter((t) => t.type === 'directive')
    expect(directives).toHaveLength(1)
    expect((directives[0] as any).name).toBe('tone')
  })
})

describe('validate', () => {
  it('returns no issues for valid document', () => {
    const issues = validate(`<<:tone: warm\n\nHello world`)
    expect(issues).toHaveLength(0)
  })

  it('detects malformed directives', () => {
    const issues = validate('<<:')
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0].severity).toBe('error')
    expect(issues[0].message).toContain('Malformed directive')
  })

  it('detects malformed directive with no name', () => {
    const issues = validate('<<: just some text')
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0].severity).toBe('error')
  })

  it('detects named directive missing space after final colon', () => {
    const issues = validate('<<:anthony:context:oops')
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0].severity).toBe('error')
    expect(issues[0].message).toContain('Malformed directive')
  })

  it('detects unnamed directive missing space after final colon', () => {
    const issues = validate('<<:tone:warm')
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0].severity).toBe('error')
  })

  it('detects separator spacing issues', () => {
    const issues = validate('text\n---\nmore text')
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0].severity).toBe('warning')
  })

  it('detects unclosed blocks', () => {
    const issues = validate('^:context: {\nsome content')
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0].message).toContain('Unclosed block')
  })

  it('does not flag directives inside fenced code', () => {
    const issues = validate('```\n<<:broken:stuff:here\n```')
    expect(issues).toHaveLength(0)
  })

  it('warns on speaker names with invalid characters', () => {
    const issues = validate('<<:anthony!:tone: warm')
    // The `!` makes the regex not match, so it's already a malformed directive
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0].severity).toBe('error')
  })

  it('accepts valid speaker name characters', () => {
    const issues = validate('<<:agent_1:tone: warm')
    expect(issues).toHaveLength(0)
  })

  it('accepts hyphenated speaker names', () => {
    const issues = validate('<<:my-bot:tone: warm')
    expect(issues).toHaveLength(0)
  })

  it('rejects three-segment directive with specific message', () => {
    const issues = validate('<<:a:b:c: value')
    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toBe('error')
    expect(issues[0].message).toContain('Too many segments')
  })

  it('rejects four-segment directive with specific message', () => {
    const issues = validate('>>:a:b:c:d: value')
    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toBe('error')
    expect(issues[0].message).toContain('Too many segments')
  })

  it('warns on uppercase directive names', () => {
    const issues = validate('<<:Tone: warm')
    const warnings = issues.filter((i) => i.severity === 'warning')
    expect(warnings).toHaveLength(1)
    expect(warnings[0].message).toContain('lowercase')
  })

  it('warns on <<:hail: not on first line', () => {
    const issues = validate('some text\n<<:hail: 0.9')
    const warnings = issues.filter((i) => i.severity === 'warning')
    expect(warnings.length).toBeGreaterThan(0)
    expect(warnings.some((w) => w.message.includes('first line'))).toBe(true)
  })

  it('does not warn on <<:hail: on first line', () => {
    const issues = validate('<<:hail: 0.9\n\nHello')
    const warnings = issues.filter((i) => i.message.includes('first line'))
    expect(warnings).toHaveLength(0)
  })
})
