import type {
  Token,
  DirectiveToken,
  HailDocument,
  Turn,
  Directive,
  DirectiveState,
  BodyElement,
  ParseOptions,
  Channel,
  Scope,
} from './types.js'
import { tokenize } from './tokenizer.js'

const STACKABLE: Set<string> = new Set([
  '<<:example',
  '<<:avoid',
  '^:context',
  '^:constraint',
  '^:decision',
  '^:artifact',
  '>>:ref',
  '>>:suggestion',
])

function isStackable(channel: Channel, name: string): boolean {
  return STACKABLE.has(`${channel}${name}`)
}

function emptyState(): DirectiveState {
  return {
    durable: new Map(),
    session: new Map(),
    response: new Map(),
  }
}

function cloneState(state: DirectiveState): DirectiveState {
  return {
    durable: new Map(
      Array.from(state.durable.entries()).map(([k, v]) => [k, [...v]]),
    ),
    session: new Map(
      Array.from(state.session.entries()).map(([k, v]) => [k, [...v]]),
    ),
    response: new Map(),
  }
}

function stateKey(d: Directive): string {
  return d.speaker ? `${d.speaker}:${d.name}` : d.name
}

function applyDirective(state: DirectiveState, d: Directive): void {
  let map: Map<string, Directive[]>
  if (d.channel === '^:') {
    map = state.durable
  } else if (d.scope === 'session') {
    map = state.session
  } else if (d.scope === 'response') {
    map = state.response
  } else {
    // turn-level: we don't persist these in state
    return
  }

  const key = stateKey(d)

  // Empty value = clear
  if (d.value === '') {
    map.delete(key)
    return
  }

  if (d.stackable) {
    const existing = map.get(key) || []
    existing.push(d)
    map.set(key, existing)
  } else {
    map.set(key, [d])
  }
}

function detectMode(
  tokens: Token[],
  options?: ParseOptions,
): 'native' | 'embedded' {
  if (options?.mode && options.mode !== 'auto') {
    return options.mode
  }

  if (options?.filename?.endsWith('.hail')) {
    return 'native'
  }

  if (tokens.length > 0 && tokens[0].type === 'version') {
    return 'native'
  }

  return 'embedded'
}

function directiveFromToken(
  token: DirectiveToken,
  scope: Scope,
  blockValue?: string,
): Directive {
  const value = blockValue !== undefined ? blockValue : token.value
  return {
    channel: token.channel,
    speaker: token.speaker,
    name: token.name,
    value,
    scope,
    line: token.line,
    stackable: isStackable(token.channel, token.name),
  }
}

function scopeForDirective(
  channel: Channel,
  inHeader: boolean,
): Scope {
  if (channel === '^:') return 'session'
  if (channel === '>>:') return 'response'
  return inHeader ? 'session' : 'turn'
}

interface RawTurn {
  tokens: Token[]
}

function splitIntoTurns(
  tokens: Token[],
  mode: 'native' | 'embedded',
): RawTurn[] {
  if (mode === 'embedded') {
    return [{ tokens }]
  }

  const turns: RawTurn[] = []
  let current: Token[] = []

  for (const token of tokens) {
    if (token.type === 'separator' && 'valid' in token && token.valid) {
      turns.push({ tokens: current })
      current = []
    } else {
      current.push(token)
    }
  }

  if (current.length > 0) {
    turns.push({ tokens: current })
  }

  return turns
}

function parseTurn(
  raw: RawTurn,
  index: number,
  previousState: DirectiveState,
): Turn {
  const state = cloneState(previousState)
  const header: Directive[] = []
  const body: BodyElement[] = []
  let seenText = false

  let i = 0
  while (i < raw.tokens.length) {
    const token = raw.tokens[i]

    if (token.type === 'blank') {
      i++
      continue
    }

    if (token.type === 'version') {
      i++
      continue
    }

    if (
      token.type === 'directive' ||
      token.type === 'block_start'
    ) {
      const dt = token as DirectiveToken
      let blockValue: string | undefined

      if (token.type === 'block_start') {
        const lines: string[] = []
        i++
        while (i < raw.tokens.length && raw.tokens[i].type !== 'block_end') {
          lines.push(raw.tokens[i].raw)
          i++
        }
        blockValue = lines.join('\n')
        // skip block_end
        if (i < raw.tokens.length && raw.tokens[i].type === 'block_end') {
          i++
        }
      } else {
        i++
      }

      const scope = scopeForDirective(dt.channel, !seenText)
      const fullValue =
        blockValue !== undefined
          ? dt.value
            ? `${dt.value}\n${blockValue}`
            : blockValue
          : dt.value
      const directive = directiveFromToken(dt, scope, fullValue)

      if (!seenText) {
        header.push(directive)
      } else {
        body.push({ type: 'directive', directive })
      }

      applyDirective(state, directive)
      continue
    }

    if (token.type === 'text') {
      seenText = true
      body.push({ type: 'text', content: token.raw, line: token.line })
      i++
      continue
    }

    i++
  }

  return { index, header, body, state }
}

export function parse(
  source: string,
  options?: ParseOptions,
): HailDocument {
  const tokens = tokenize(source)
  const mode = detectMode(tokens, options)

  let version: string | undefined
  if (tokens.length > 0 && tokens[0].type === 'version') {
    version = (tokens[0] as { version: string }).version
  }

  const rawTurns = splitIntoTurns(tokens, mode)
  const turns: Turn[] = []
  let currentState = emptyState()

  for (let i = 0; i < rawTurns.length; i++) {
    const turn = parseTurn(rawTurns[i], i, currentState)
    turns.push(turn)
    currentState = turn.state
  }

  return {
    version,
    mode,
    turns,
    finalState: currentState,
  }
}

export function stateAt(
  doc: HailDocument,
  turnIndex: number,
): DirectiveState {
  if (turnIndex < 0 || turnIndex >= doc.turns.length) {
    return emptyState()
  }
  return doc.turns[turnIndex].state
}
