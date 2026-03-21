#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { tokenize, validate } from './tokenizer.js'
import { parse, stateAt } from './parser.js'
import { summarize, formatSummary } from './summary.js'
import type { DirectiveState } from './types.js'

function stateToJSON(state: DirectiveState): Record<string, unknown> {
  return {
    durable: Object.fromEntries(
      Array.from(state.durable.entries()).map(([k, v]) => [
        k,
        v.map((d) => d.value),
      ]),
    ),
    session: Object.fromEntries(
      Array.from(state.session.entries()).map(([k, v]) => [
        k,
        v.map((d) => d.value),
      ]),
    ),
    response: Object.fromEntries(
      Array.from(state.response.entries()).map(([k, v]) => [
        k,
        v.map((d) => d.value),
      ]),
    ),
  }
}

function usage(): void {
  console.error(`Usage: hail-parser <file> [options]

Options:
  --tokens     Output raw token stream
  --state      Output active directive state
  --turn N     Select a specific turn (used with --state)
  --summary    Show current state, insights, and items needing input
  --validate   Check for parse issues, exit 0 if clean
  --help       Show this message`)
}

function main(): void {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.length === 0) {
    usage()
    process.exit(args.includes('--help') ? 0 : 1)
  }

  const file = args.find((a: string) => !a.startsWith('--'))
  if (!file) {
    console.error('Error: no file specified')
    process.exit(1)
  }

  let source: string = ''
  try {
    source = readFileSync(file, 'utf-8')
  } catch {
    console.error(`Error: could not read ${file}`)
    process.exit(1)
  }

  const filename = basename(file)
  const flags = new Set(args.filter((a: string) => a.startsWith('--')))

  if (flags.has('--tokens')) {
    const tokens = tokenize(source)
    console.log(JSON.stringify(tokens, null, 2))
    return
  }

  const doc = parse(source, { filename, mode: 'auto' })

  if (flags.has('--validate')) {
    const issues = validate(source)

    if (issues.length === 0) {
      console.error('Valid.')
      process.exit(0)
    } else {
      for (const issue of issues) {
        const prefix = issue.severity === 'error' ? 'ERROR' : 'WARN'
        console.error(`${prefix} line ${issue.line}: ${issue.message}`)
      }
      const hasErrors = issues.some((i) => i.severity === 'error')
      process.exit(hasErrors ? 1 : 0)
    }
  }

  if (flags.has('--summary')) {
    const summary = summarize(doc, filename)
    const output = formatSummary(summary, false)
    if (output.trim()) {
      console.log(output)
    } else {
      console.log('No directives found.')
    }
    return
  }

  if (flags.has('--state')) {
    const turnArg = args.find((_: string, i: number) => args[i - 1] === '--turn')
    const turnIndex = turnArg
      ? parseInt(turnArg, 10)
      : doc.turns.length - 1

    const state = stateAt(doc, turnIndex)
    console.log(JSON.stringify(stateToJSON(state), null, 2))
    return
  }

  // Default: output the full document tree
  const output = {
    version: doc.version,
    mode: doc.mode,
    turns: doc.turns.map((t) => ({
      index: t.index,
      header: t.header,
      body: t.body,
      state: stateToJSON(t.state),
    })),
  }
  console.log(JSON.stringify(output, null, 2))
}

main()
