import type { HailDocument, Directive, Turn } from './types.js'

export interface SummaryItem {
  speaker?: string
  name: string
  value: string
  line: number
  file?: string
}

export interface Summary {
  state: SummaryItem[]
  insights: SummaryItem[]
  needsInput: SummaryItem[]
  decisions: SummaryItem[]
}

function collectFromTurns(
  turns: Turn[],
  file?: string,
): { allDirectives: Directive[]; durableState: Map<string, Directive[]> } {
  const allDirectives: Directive[] = []
  const durableState = new Map<string, Directive[]>()

  for (const turn of turns) {
    for (const d of turn.header) {
      allDirectives.push(d)
    }
    for (const el of turn.body) {
      if (el.type === 'directive') {
        allDirectives.push(el.directive)
      }
    }
  }

  // Use final turn's durable state
  if (turns.length > 0) {
    const final = turns[turns.length - 1].state
    for (const [key, directives] of final.durable) {
      durableState.set(key, directives)
    }
    for (const [key, directives] of final.session) {
      durableState.set(key, directives)
    }
  }

  return { allDirectives, durableState }
}

function toItem(d: Directive, file?: string): SummaryItem {
  return {
    speaker: d.speaker,
    name: d.name,
    value: d.value,
    line: d.line,
    file,
  }
}

export function summarize(doc: HailDocument, file?: string): Summary {
  const { allDirectives, durableState } = collectFromTurns(doc.turns, file)

  const state: SummaryItem[] = []
  const insights: SummaryItem[] = []
  const needsInput: SummaryItem[] = []
  const decisions: SummaryItem[] = []

  // Current state: active durable and session directives
  for (const [_key, directives] of durableState) {
    for (const d of directives) {
      state.push(toItem(d, file))
    }
  }

  // Insights: all >>:suggestion: and >>:ref: across all turns
  for (const d of allDirectives) {
    if (d.channel === '>>:' && (d.name === 'suggestion' || d.name === 'ref')) {
      insights.push(toItem(d, file))
    }
  }

  // Needs input: all >>:uncertain: and ^:blocked:
  for (const d of allDirectives) {
    if (d.channel === '>>:' && d.name === 'uncertain') {
      needsInput.push(toItem(d, file))
    }
    if (d.channel === '^:' && d.name === 'blocked' && d.value !== '') {
      needsInput.push(toItem(d, file))
    }
  }

  // Decisions: all ^:decision:
  for (const d of allDirectives) {
    if (d.channel === '^:' && d.name === 'decision' && d.value !== '') {
      decisions.push(toItem(d, file))
    }
  }

  return { state, insights, needsInput, decisions }
}

function formatItem(item: SummaryItem, showFile: boolean): string {
  const loc = showFile && item.file
    ? `${item.file}:${item.line}`
    : `line ${item.line}`
  const speaker = item.speaker ? `${item.speaker}: ` : ''
  return `  [${loc}] ${speaker}${item.value}`
}

export function formatSummary(summary: Summary, showFile: boolean = false): string {
  const sections: string[] = []

  // Current state (skip noisy ones, show the important stuff)
  const stateItems = summary.state.filter(
    (s) => ['context', 'goal', 'status', 'ownership', 'blocked', 'constraint'].includes(s.name),
  )
  if (stateItems.length > 0) {
    sections.push('Current State')
    sections.push('')
    for (const item of stateItems) {
      const label = item.name.toUpperCase()
      const value = item.value.includes('\n')
        ? `\n${item.value.split('\n').map((l: string) => `    ${l}`).join('\n')}`
        : ` ${item.value}`
      sections.push(`  ${label}:${value}`)
    }
  }

  // Decisions
  if (summary.decisions.length > 0) {
    sections.push('')
    sections.push('Decisions')
    sections.push('')
    for (const item of summary.decisions) {
      sections.push(formatItem(item, showFile))
    }
  }

  // Insights
  if (summary.insights.length > 0) {
    sections.push('')
    sections.push('Insights')
    sections.push('')
    for (const item of summary.insights) {
      sections.push(formatItem(item, showFile))
    }
  }

  // Needs input
  if (summary.needsInput.length > 0) {
    sections.push('')
    sections.push('Needs Input')
    sections.push('')
    for (let i = 0; i < summary.needsInput.length; i++) {
      const item = summary.needsInput[i]
      const loc = showFile && item.file
        ? `${item.file}:${item.line}`
        : `line ${item.line}`
      const speaker = item.speaker ? `${item.speaker}: ` : ''
      sections.push(`  ${i + 1}. [${loc}] ${speaker}${item.value}`)
    }
  }

  return sections.join('\n')
}
