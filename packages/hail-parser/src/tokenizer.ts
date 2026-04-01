import type {
  Token,
  DirectiveToken,
  VersionToken,
  SeparatorToken,
  Channel,
} from './types.js'

const CHANNEL_PREFIXES: Channel[] = ['^:', '<<:', '>>:']

const VERSION_RE = /^<<:hail:\s*(.+)$/

const FENCE_RE = /^(`{3,}|~{3,})/

function parseDirectiveLine(
  raw: string,
  lineNum: number,
): DirectiveToken | VersionToken | null {
  let channel: Channel | null = null
  let rest = ''

  for (const prefix of CHANNEL_PREFIXES) {
    if (raw.startsWith(prefix)) {
      channel = prefix
      rest = raw.slice(prefix.length)
      break
    }
  }

  if (!channel) return null

  const versionMatch = raw.match(VERSION_RE)
  if (versionMatch) {
    return {
      type: 'version',
      line: lineNum,
      raw,
      channel: '<<:',
      version: versionMatch[1].trim(),
    }
  }

  // Find the final structural colon.
  // The final structural colon must be followed by a space, {, or end of line.
  // Named: word:word: (space|{|EOL)  Unnamed: word: (space|{|EOL)
  const headerMatch = rest.match(
    /^([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+):(?=\s|{|$)\s*(.*)$|^([a-zA-Z0-9_-]+):(?=\s|{|$)\s*(.*)$/,
  )

  if (!headerMatch) return null

  let speaker: string | undefined
  let name: string
  let value: string

  if (headerMatch[1] !== undefined) {
    // Two segments: named directive
    speaker = headerMatch[1]
    name = headerMatch[2]
    value = headerMatch[3]
  } else {
    // One segment: unnamed directive
    name = headerMatch[4]
    value = headerMatch[5]
  }

  const isBlock = value.trimEnd() === '{' || value.endsWith(' {')
  if (isBlock) {
    value = value.replace(/\s*\{$/, '').trim()
  }

  return {
    type: isBlock ? 'block_start' : 'directive',
    line: lineNum,
    raw,
    channel,
    speaker,
    name,
    value,
  }
}

function startsWithChannelPrefix(line: string): boolean {
  return CHANNEL_PREFIXES.some((p) => line.startsWith(p))
}

export function tokenize(source: string): Token[] {
  const lines = source.split('\n')
  const tokens: Token[] = []
  let inBlock = false
  let inFence = false
  let fenceMarker = ''
  let prevBlank = true // treat start of document as preceded by blank

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const lineNum = i + 1

    // Handle braced blocks (highest priority)
    if (inBlock) {
      if (raw.trimEnd() === '}') {
        tokens.push({ type: 'block_end', line: lineNum, raw })
        inBlock = false
      } else {
        tokens.push({ type: 'block_content', line: lineNum, raw })
      }
      continue
    }

    // Handle fenced code blocks
    const fenceMatch = raw.match(FENCE_RE)
    if (inFence) {
      // Check for closing fence: same character, at least as many
      if (fenceMatch && fenceMatch[1][0] === fenceMarker[0] && fenceMatch[1].length >= fenceMarker.length) {
        inFence = false
        fenceMarker = ''
      }
      tokens.push({ type: 'text', line: lineNum, raw })
      prevBlank = false
      continue
    }

    if (fenceMatch) {
      inFence = true
      fenceMarker = fenceMatch[1]
      tokens.push({ type: 'text', line: lineNum, raw })
      prevBlank = false
      continue
    }

    // Check for separator
    if (raw.trim() === '---') {
      const nextBlank =
        i + 1 >= lines.length || lines[i + 1].trim() === ''
      tokens.push({
        type: 'separator',
        line: lineNum,
        raw,
        valid: prevBlank && nextBlank,
      } as SeparatorToken)
      prevBlank = false
      continue
    }

    // Check for directive
    const directive = parseDirectiveLine(raw, lineNum)
    if (directive) {
      tokens.push(directive)
      if (directive.type === 'block_start') {
        inBlock = true
      }
      prevBlank = false
      continue
    }

    // Blank or text
    if (raw.trim() === '') {
      tokens.push({ type: 'blank', line: lineNum, raw })
      prevBlank = true
    } else {
      tokens.push({ type: 'text', line: lineNum, raw })
      prevBlank = false
    }
  }

  return tokens
}

export interface ValidationIssue {
  line: number
  message: string
  severity: 'error' | 'warning'
}

export function validate(source: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const lines = source.split('\n')
  let inBlock = false
  let inFence = false
  let fenceMarker = ''

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const lineNum = i + 1

    if (inBlock) {
      if (raw.trimEnd() === '}') inBlock = false
      continue
    }

    const fenceMatch = raw.match(FENCE_RE)
    if (inFence) {
      if (fenceMatch && fenceMatch[1][0] === fenceMarker[0] && fenceMatch[1].length >= fenceMarker.length) {
        inFence = false
        fenceMarker = ''
      }
      continue
    }
    if (fenceMatch) {
      inFence = true
      fenceMarker = fenceMatch[1]
      continue
    }

    // Check for malformed directives: starts with channel prefix but doesn't parse
    if (startsWithChannelPrefix(raw)) {
      const parsed = parseDirectiveLine(raw, lineNum)
      if (!parsed) {
        const afterPrefix = raw.replace(/^(\^:|<<:|>>:)/, '')
        const segmentMatch = afterPrefix.match(
          /^([a-zA-Z0-9_-]+:){2,}(?=\s|{|$)/,
        )
        if (segmentMatch) {
          issues.push({
            line: lineNum,
            message: `Too many segments in directive header: ${raw}. Named directives use channel:speaker:name: format (max two segments after prefix).`,
            severity: 'error',
          })
        } else {
          issues.push({
            line: lineNum,
            message: `Malformed directive: ${raw}`,
            severity: 'error',
          })
        }
      } else if (parsed.type === 'block_start') {
        inBlock = true
      }
    }

    // Check separator spacing
    if (raw.trim() === '---') {
      const prevBlank = i === 0 || lines[i - 1].trim() === ''
      const nextBlank = i + 1 >= lines.length || lines[i + 1].trim() === ''
      if (!prevBlank || !nextBlank) {
        issues.push({
          line: lineNum,
          message: 'Turn separator missing blank lines before/after',
          severity: 'warning',
        })
      }
    }
  }

  if (inBlock) {
    issues.push({
      line: lines.length,
      message: 'Unclosed block: missing closing }',
      severity: 'error',
    })
  }

  if (inFence) {
    issues.push({
      line: lines.length,
      message: 'Unclosed fenced code block',
      severity: 'warning',
    })
  }

  return issues
}
