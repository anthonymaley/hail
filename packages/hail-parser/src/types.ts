export type Channel = '^:' | '<<:' | '>>:'

export type TokenType =
  | 'version'
  | 'directive'
  | 'block_start'
  | 'block_content'
  | 'block_end'
  | 'separator'
  | 'text'
  | 'blank'

export interface BaseToken {
  type: TokenType
  line: number
  raw: string
}

export interface DirectiveToken extends BaseToken {
  type: 'directive' | 'block_start'
  channel: Channel
  speaker?: string
  name: string
  value: string
}

export interface VersionToken extends BaseToken {
  type: 'version'
  channel: '<<:'
  version: string
}

export interface SeparatorToken extends BaseToken {
  type: 'separator'
  valid: boolean
}

export interface TextToken extends BaseToken {
  type: 'text'
}

export interface BlankToken extends BaseToken {
  type: 'blank'
}

export interface BlockContentToken extends BaseToken {
  type: 'block_content'
}

export interface BlockEndToken extends BaseToken {
  type: 'block_end'
}

export type Token =
  | DirectiveToken
  | VersionToken
  | SeparatorToken
  | TextToken
  | BlankToken
  | BlockContentToken
  | BlockEndToken

export type Scope = 'session' | 'turn' | 'response'

export interface Directive {
  channel: Channel
  speaker?: string
  name: string
  value: string
  scope: Scope
  line: number
  stackable: boolean
}

export interface Turn {
  index: number
  header: Directive[]
  body: BodyElement[]
  state: DirectiveState
}

export type BodyElement =
  | { type: 'text'; content: string; line: number }
  | { type: 'directive'; directive: Directive }

export interface DirectiveState {
  durable: Map<string, Directive[]>
  session: Map<string, Directive[]>
  response: Map<string, Directive[]>
}

export interface HailDocument {
  version?: string
  mode: 'native' | 'embedded'
  turns: Turn[]
  finalState: DirectiveState
}

export interface ParseOptions {
  mode?: 'native' | 'embedded' | 'auto'
  filename?: string
}
