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
  obsidian patch "note.md" "content" --line 42

FRONTMATTER
  obsidian frontmatter "note.md" --get
  obsidian frontmatter "note.md" --get tags
  obsidian frontmatter "note.md" --set '{"status":"done"}' --merge

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
  - NO dates in filename - created_at/updated_at added automatically to frontmatter
  - Always include frontmatter: tags, status (created_at/updated_at automatic)
  - Search before creating to avoid duplicates
  - Use --merge-frontmatter to preserve existing metadata

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
