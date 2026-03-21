import type {
  Token,
  DirectiveToken,
  VersionToken,
  SeparatorToken,
  Channel,
} from './types.js'

const CHANNEL_PREFIXES: Channel[] = ['^:', '<<:', '>>:']

const VERSION_RE = /^<<:hail:\s*(.+)$/

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
  // The final structural colon is followed by a space, {, or end of line.
  // We scan for "word:" or "word:word:" patterns before the value.
  const headerMatch = rest.match(
    /^([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+):\s*(.*)$|^([a-zA-Z0-9_-]+):\s*(.*)$/,
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

export function tokenize(source: string): Token[] {
  const lines = source.split('\n')
  const tokens: Token[] = []
  let inBlock = false
  let prevBlank = true // treat start of document as preceded by blank

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const lineNum = i + 1

    if (inBlock) {
      if (raw.trimEnd() === '}') {
        tokens.push({ type: 'block_end', line: lineNum, raw })
        inBlock = false
      } else {
        tokens.push({ type: 'block_content', line: lineNum, raw })
      }
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
