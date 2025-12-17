// Instructions command - AI-optimized usage guide

export function instructionsCommand(): void {
  const instructions = `
Obsidian CLI - AI-Optimized Usage Guide
========================================

SEARCH (Omnisearch + fallback)
  obsidian search "query" --limit 5

READ
  obsidian get "note.md"

CREATE
  obsidian create "note.md" "content" --frontmatter '{"tags":["x"]}'
  obsidian create "note.md" --from-file "source.md"   # Large files
  obsidian create "note.md" --stdin                   # From pipe
  obsidian create "note.md" --from-file "src.md" --merge-frontmatter  # Preserve source frontmatter

PATCH (Surgical edits)
  obsidian patch "note.md" "content"                  # Append
  obsidian patch "note.md" --from-file "content.md"   # From file (large content)
  obsidian patch "note.md" "content" --prepend
  obsidian patch "note.md" "content" --heading "Section"
  obsidian patch "note.md" "content" --heading "Section" --replace
  obsidian patch "note.md" --heading "Section" --delete   # Delete section
  obsidian patch "note.md" "content" --line 42

FRONTMATTER (ALWAYS use --merge to preserve auto-generated fields)
  obsidian frontmatter "note.md" --get
  obsidian frontmatter "note.md" --get tags
  obsidian frontmatter "note.md" --set '{"status":"done"}' --merge  # REQUIRED
  obsidian frontmatter "note.md" --delete "field"     # Delete single field

EXCALIDRAW (Diagrams with auto-layout)
  obsidian excalidraw create "diagram.excalidraw.md" --from-file "input.json"
  obsidian excalidraw get "diagram.excalidraw.md"     # Read as JSON
  obsidian excalidraw patch "diagram.excalidraw.md" --from-file "additions.json"

  DSL Input Format (JSON):
  {
    "nodes": [
      { "id": "user", "label": "User", "type": "ellipse" },
      { "id": "api", "label": "API Gateway" },
      { "id": "db", "label": "Database", "type": "cylinder" }
    ],
    "edges": [
      { "from": "user", "to": "api" },
      { "from": "api", "to": "db", "label": "SQL", "style": "dashed" }
    ],
    "layout": "LR"
  }

  Node types: rectangle (default), ellipse, diamond, cylinder, parallelogram
  Edge styles: solid (default), dashed, dotted
  Layout: LR (left-right), TB (top-bottom), RL, BT
  Optional: "theme": "dark"

  Embedding in markdown: ![[diagram.excalidraw]] or ![[diagram.excalidraw|800]]

OTHER
  obsidian list                                       # List files
  obsidian delete "note.md"
  obsidian config --list                              # Show vaults

FILE INPUT (avoids shell limits, escaping issues)
  --from-file "path"   # Read from file (preferred for large content)
  --stdin              # Read from stdin/pipe

OUTPUT
  All commands return JSON with .success, .operation, .vault, .result/.results, .meta

BEST PRACTICES
  - Use --from-file for content >1KB or with special chars (---, quotes, etc.)
  - Filenames: Use descriptive kebab-case (e.g., "deno-llmz-integration.md")
  - NO dates in filename - timestamps/title added automatically to frontmatter
  - Auto-generated: title (from filename), created_at, updated_at
  - Example: "deno-llmz-integration.md" → title: "Deno LLMZ Integration"
  - Always include: tags, status (title/timestamps automatic)
  - Search before creating to avoid duplicates
  - CRITICAL: Always use --merge with frontmatter --set (otherwise loses title/timestamps)

EXAMPLES
  # Research workflow
  obsidian search "adk" --limit 10 | jq -r '.results[].path'
  obsidian create "deno-llmz-integration-analysis.md" --from-file "research.md" --frontmatter '{"tags":["analysis","llmz"]}'

  # Bulk operations
  for note in $(obsidian search "status:draft" | jq -r '.results[].path'); do
    obsidian frontmatter "$note" --set '{"status":"review"}' --merge
  done
`;

  console.log(instructions.trim());
}
