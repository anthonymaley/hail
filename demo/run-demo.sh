#!/bin/bash
# Demo script for Hail terminal recording
# Run from the hail repo root

PARSER="node packages/hail-parser/dist/cli.js"
DEMO="demo"

clear

echo "═══════════════════════════════════════════════════"
echo "  Hail: Human-AI Interaction Layer"
echo "  Terminal Demo"
echo "═══════════════════════════════════════════════════"
echo ""
sleep 2

# Stage 1: Human writes initial directives
echo "━━━ Stage 1: Human sets up the collaboration ━━━"
echo ""
sleep 1
cat "$DEMO/stage-1.hail"
echo ""
sleep 3

echo ""
echo "━━━ Parser: active state after turn 1 ━━━"
echo ""
sleep 1
$PARSER "$DEMO/stage-1.hail" --state
sleep 4

# Stage 2: Claude responds
echo ""
echo ""
echo "━━━ Stage 2: Claude responds with content + feedback ━━━"
echo ""
sleep 1
# Show just the new turn (tail of stage 2)
echo "--- (turn separator)"
echo ""
tail -n 12 "$DEMO/stage-2.hail"
echo ""
sleep 3

echo ""
echo "━━━ Parser: state after turn 2 ━━━"
echo ""
sleep 1
$PARSER "$DEMO/stage-2.hail" --state
echo ""
echo "  ↑ Durable state (^:) persists. Response state (>>:) is turn-scoped."
sleep 4

# Stage 3: Codex adds review + decision is made
echo ""
echo ""
echo "━━━ Stage 3: Codex reviews + team records a decision ━━━"
echo ""
sleep 1
echo "--- (turn separator)"
echo ""
tail -n 7 "$DEMO/stage-3.hail"
echo ""
sleep 3

echo ""
echo "━━━ Parser: state after turn 3 ━━━"
echo ""
sleep 1
$PARSER "$DEMO/stage-3.hail" --state
echo ""
echo "  ↑ ^:decision: is now durable shared state."
sleep 4

# Stage 4: Blocker appears, status changes
echo ""
echo ""
echo "━━━ Stage 4: Blocker + status change ━━━"
echo ""
sleep 1
echo "--- (turn separator)"
echo ""
tail -n 4 "$DEMO/stage-4.hail"
echo ""
sleep 3

echo ""
echo "━━━ Parser: final state ━━━"
echo ""
sleep 1
$PARSER "$DEMO/stage-4.hail" --state
echo ""
echo "  ↑ ^:blocked: is active. ^:status: changed to review."
sleep 4

# Validation demo
echo ""
echo ""
echo "━━━ Validation: catching malformed directives ━━━"
echo ""
sleep 1
echo "File contents:"
cat "$DEMO/bad-example.hail"
echo ""
sleep 2
echo "Running: hail-parser bad-example.hail --validate"
echo ""
$PARSER "$DEMO/bad-example.hail" --validate 2>&1
echo ""
sleep 3

# Token view
echo ""
echo "━━━ Tokenizer: raw token stream (first 5) ━━━"
echo ""
sleep 1
$PARSER "$DEMO/stage-1.hail" --tokens | head -40
echo "  ..."
sleep 3

echo ""
echo ""
echo "═══════════════════════════════════════════════════"
echo "  Three prefixes. No tooling required."
echo "  github.com/anthonymaley/hail"
echo "═══════════════════════════════════════════════════"
echo ""
