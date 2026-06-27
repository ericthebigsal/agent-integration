#!/usr/bin/env bash
# generate_mcp.sh — Build MCP server from enriched Klaviyo OpenAPI specs
#
# Prerequisites:
#   • Python 3 with backend/.venv set up (run: pip install -r backend/requirements.txt)
#   • Node.js + npx available
#   • Klaviyo specs already downloaded to klaviyo-openapi/json/
#     (see task-7-brief.md Step 1 for download commands)
#
# What this script does:
#   1. Runs backend/enrich.py to inject behavioral notes into the specs
#   2. Merges the four enriched specs into one combined OpenAPI spec
#   3. Generates a TypeScript MCP server using openapi-mcp-generator
#   4. Installs npm deps and builds the TypeScript

set -e

ENRICHED="klaviyo-openapi/enriched"
MERGED="klaviyo-openapi/merged"
OUTPUT="mcp-server"

echo "=== Step 1: Enrich Klaviyo specs ==="
source backend/.venv/bin/activate
KLAVIYO_PRIVATE_API_KEY=${KLAVIYO_PRIVATE_API_KEY:-test} python3 -m backend.enrich

echo ""
echo "=== Step 2: Merge enriched specs ==="
python3 backend/merge_specs.py

echo ""
echo "=== Step 3: Generate MCP server from merged spec ==="
# Note: ckanthony/openapi-mcp requires linux/amd64 and cannot be pulled on Apple Silicon.
# Fallback: openapi-mcp-generator (npm) generates a full TypeScript MCP project.
npx openapi-mcp-generator \
  --input "$MERGED/klaviyo-combined.json" \
  --output "$OUTPUT" \
  --server-name klaviyo-mcp \
  --transport stdio

echo ""
echo "=== Step 4: Install and build ==="
cd "$OUTPUT"
npm install
npm run build

echo ""
echo "=== Done ==="
echo "MCP server written to $OUTPUT/"
echo "Start with: node $OUTPUT/build/index.js"
echo "Claude Desktop config (add to mcpServers):"
echo '  "klaviyo": { "command": "node", "args": ["'"$(pwd)/build/index.js"'"], "env": { "KLAVIYO_PRIVATE_API_KEY": "<your-key>" } }'
