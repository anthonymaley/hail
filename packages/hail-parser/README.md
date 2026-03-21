# hail-parser

TypeScript parser and CLI for Hail.

## What it does

- tokenizes Hail source into a raw token stream
- parses tokens into turns, directives, and resolved state
- supports native mode (`.hail` or first-line `<<:hail:`) and embedded mode (`.md` and other host formats)
- validates common document issues

## Install

```bash
npm install hail-parser
```

## API

```typescript
import { parse, tokenize, validate, stateAt } from 'hail-parser'

const doc = parse(source, { filename: 'example.hail' })
const tokens = tokenize(source)
const issues = validate(source)
const turnState = stateAt(doc, 0)
```

### `parse(source, options?)`

Parses a Hail document into:

- `mode`: `native` or `embedded`
- `version`: optional `<<:hail:` version
- `turns`: parsed turns with headers, body elements, and accumulated state
- `finalState`: durable/session/response directive state after the last turn

### `tokenize(source)`

Returns the raw token stream. Useful for debugging parser behavior.

### `validate(source)`

Returns a list of validation issues:

- malformed directive lines
- separator spacing warnings
- unclosed braced blocks
- unclosed fenced code blocks

### `stateAt(doc, turnIndex)`

Returns the directive state active after a specific turn.

## CLI

```bash
npx hail-parser document.md
npx hail-parser document.hail --tokens
npx hail-parser document.hail --state
npx hail-parser document.hail --turn 1 --state
npx hail-parser document.hail --validate
```

## Parsing Modes

Native mode:

- applies to `.hail` files
- also applies when the first line is `<<:hail: ...`
- treats `---` as a turn separator

Embedded mode:

- applies to `.md` and other host formats without first-line `<<:hail:`
- parses the document as a single turn
- leaves host-format `---` semantics alone

## Development

```bash
npm test
npm run build
```

## Status

Parser is implemented and tested locally. The package is not yet published to npm.
