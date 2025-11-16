# Obsidian CLI

AI-optimized CLI tool for Obsidian vault operations using the Local REST API plugin. Designed for AI agents and automation workflows with JSON-only output and efficient surgical editing capabilities.

## Features

- **Multi-vault support** with configurable default vault
- **Hybrid search**: Fast Omnisearch plugin integration with REST API fallback
- **Surgical editing**: PATCH operations with heading and line targeting
- **Frontmatter manipulation**: Get/set YAML metadata efficiently
- **Automatic timestamps**: `created_at` and `updated_at` added/updated automatically
- **File input support**: `--from-file` and `--stdin` for large content without shell limits
- **JSON-only output**: All commands return structured JSON for AI parsing
- **Standalone executable**: Compiled with Bun, no runtime dependencies

## Prerequisites

1. **Obsidian** with the **Local REST API** plugin installed and configured
2. **(Optional) Omnisearch plugin** for faster search
3. **Bun** runtime installed

**→ See [SETUP.md](SETUP.md) for detailed setup instructions including plugin installation and vault configuration.**

## Installation

### Quick Install (Recommended)

```bash
# Clone and install
git clone <repository-url>
cd obsidian-cli
bun install

# Link globally (creates 'obsidian' command)
bun link
```

### Build Standalone Executable (Optional)

```bash
# Build the executable
bun run build

# Install using script
./install.sh

# Or manually copy to your PATH
cp dist/obsidian-cli ~/bin/obsidian
chmod +x ~/bin/obsidian
```

### Configuration

Edit `~/.config/obsidian-cli/config.json` with your API key:

```json
{
  "defaultVault": "botpress",
  "vaults": {
    "botpress": {
      "restApi": {
        "baseUrl": "http://127.0.0.1:27123",
        "apiKey": "your-api-key-here"
      },
      "omnisearch": {
        "enabled": true,
        "baseUrl": "http://localhost:51361"
      }
    }
  }
}
```

## Usage

All commands return JSON output suitable for AI consumption.

### Search

```bash
# Search with Omnisearch (fast) + REST API fallback
obsidian search "adk testing" --limit 5

# Search in specific vault
obsidian search "query" --vault personal

# Adjust excerpt length
obsidian search "tables" --chars 500
```

**Output:**
```json
{
  "success": true,
  "operation": "search",
  "vault": "botpress",
  "results": [
    {
      "score": 305.87,
      "path": "2025-11-03-tables-api.md",
      "excerpt": "...testing results...",
      "matches": ["testing", "api"]
    }
  ],
  "meta": {
    "count": 1,
    "source": "omnisearch",
    "executionTime": 23
  }
}
```

### Get Note

```bash
# Read note content
obsidian get "2025-11-13-example.md"

# Get from specific vault
obsidian get "note.md" --vault personal
```

**Output:**
```json
{
  "success": true,
  "operation": "get",
  "vault": "botpress",
  "result": {
    "path": "2025-11-13-example.md",
    "content": "Note body content...",
    "frontmatter": {
      "tags": ["example"],
      "status": "active"
    }
  }
}
```

### Create Note

**Note:** `created_at` and `updated_at` timestamps are added automatically to all notes.

```bash
# Create note with inline content (use kebab-case names)
obsidian create "deno-llmz-integration.md" "# Deno LLMz Integration\n\nContent here"

# Create with frontmatter (timestamps added automatically)
obsidian create "analysis.md" "Content" --frontmatter '{"tags":["research"],"status":"draft"}'
# Results in: tags, status, created_at, updated_at

# Create from file (recommended for large content)
obsidian create "integration-guide.md" --from-file "source.md" --frontmatter '{"tags":["guide"]}'

# Create from stdin
cat source.md | obsidian create "target.md" --stdin

# Merge frontmatter from source file
obsidian create "target.md" --from-file "source.md" \
  --frontmatter '{"status":"draft"}' --merge-frontmatter
```

### Patch (Surgical Edits)

**Note:** `updated_at` timestamp is automatically updated when patching notes.

```bash
# Append to end of note (inline content)
obsidian patch "doc.md" "New content"

# Append from file (recommended for large content)
obsidian patch "doc.md" --from-file "content.md"

# Append from stdin
cat content.md | obsidian patch "doc.md" --stdin

# Prepend to beginning
obsidian patch "doc.md" "Header content" --prepend

# Append under specific heading
obsidian patch "doc.md" "New findings" --heading "Results"

# Replace content under heading (from file)
obsidian patch "doc.md" --from-file "new-section.md" --heading "Summary" --replace

# Insert after specific line
obsidian patch "doc.md" "New line" --line 42

# Delete a section
obsidian patch "doc.md" "" --heading "Old Section" --delete
```

### Frontmatter

```bash
# Get all frontmatter
obsidian frontmatter "doc.md" --get

# Get specific field
obsidian frontmatter "doc.md" --get status

# Set frontmatter (replaces all)
obsidian frontmatter "doc.md" --set '{"status":"complete","tags":["done"]}'

# Merge with existing frontmatter
obsidian frontmatter "doc.md" --set '{"status":"complete"}' --merge

# Delete a field
obsidian frontmatter "doc.md" --delete "status"
```

### Delete

```bash
# Delete a note
obsidian delete "old-note.md"
```

### List Files

```bash
# List all files in vault
obsidian list

# List files in specific directory
obsidian list "projects/2025"
```

### Config Management

```bash
# List configured vaults
obsidian config --list

# Show config file path
obsidian config --path

# Add new vault
obsidian config --add --name personal \
  --base-url http://127.0.0.1:27123 \
  --api-key your-key-here

# Set default vault
obsidian config --default --name personal

# Remove vault
obsidian config --remove --name old-vault
```

## AI Workflow Examples

See [examples/ai-workflows.md](examples/ai-workflows.md) for detailed AI agent usage patterns:

- Research aggregation
- Daily note automation
- Task tracking
- Documentation generation
- Knowledge graph building

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev -- search "test"

# Build standalone executable
bun run build

# The executable will be at dist/obsidian-cli
```

## Architecture

```
obsidian-cli/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── config.ts             # Multi-vault configuration
│   ├── api/
│   │   ├── rest.ts           # REST API client
│   │   ├── omnisearch.ts     # Omnisearch client
│   │   └── types.ts          # TypeScript types
│   ├── commands/
│   │   ├── search.ts         # Search with fallback
│   │   ├── get.ts            # Read operations
│   │   ├── create.ts         # Create with frontmatter
│   │   ├── patch.ts          # Surgical edits
│   │   ├── frontmatter.ts    # Metadata operations
│   │   ├── delete.ts         # Delete operations
│   │   ├── list.ts           # List files
│   │   └── config.ts         # Config management
│   └── utils/
│       ├── output.ts         # JSON formatter
│       └── errors.ts         # Error handling
```

## API Reference

### REST API Endpoints Used

- `GET /search/simple/` - Search notes
- `GET /vault/{path}` - Read note
- `PUT /vault/{path}` - Create/update note
- `PATCH /vault/{path}` - Patch note (efficient updates)
- `DELETE /vault/{path}` - Delete note
- `GET /vault/{path}/` - List directory

### Omnisearch API

- `GET /search?q=query` - Fast full-text search

## Error Handling

All errors return JSON with `success: false`:

```json
{
  "success": false,
  "operation": "get",
  "vault": "botpress",
  "error": "Resource not found: /vault/missing.md",
  "meta": {
    "code": "NOT_FOUND",
    "statusCode": 404
  }
}
```

## License

MIT

## Author

Built with Bun and TypeScript for AI-native workflows.
