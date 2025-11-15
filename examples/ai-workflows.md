# AI Workflow Examples

This document demonstrates practical AI agent workflows using obsidian-cli.

## 1. Research Aggregation

**Scenario**: Aggregate all research notes on a specific topic into a summary document.

```bash
# Step 1: Search for relevant notes
RESULTS=$(obsidian search "adk testing" --limit 20)

# Step 2: Parse results and read each note
echo "$RESULTS" | jq -r '.results[].path' | while read -r path; do
  obsidian get "$path" | jq -r '.result.content'
done

# Step 3: Create summary note with findings
obsidian create "2025-11-13-adk-testing-summary.md" \
  "# ADK Testing Summary\n\n## Findings\n\n[Aggregated content here]" \
  --frontmatter '{"tags":["summary","adk","testing"],"type":"research"}'
```

## 2. Daily Note Automation

**Scenario**: Create structured daily notes with AI-populated content.

```bash
DATE=$(date +%Y-%m-%d)
TITLE="Daily Note - $DATE"

# Create daily note structure
obsidian create "$DATE-daily.md" \
  "# $TITLE\n\n## Tasks\n\n- [ ] Review emails\n\n## Notes\n\n" \
  --frontmatter '{"date":"'$DATE'","type":"daily","status":"active"}'

# Later: Append AI-generated insights
obsidian patch "$DATE-daily.md" \
  "## AI Insights\n\n- Found 3 related research papers\n- Team discussion about Tables API" \
  --heading "Notes"
```

## 3. Task Tracking Workflow

**Scenario**: Track project tasks across multiple notes.

```bash
# Find all notes with open tasks
obsidian search "- [ ]" --limit 50 | \
  jq -r '.results[].path' | \
  while read -r path; do
    # Extract task status
    CONTENT=$(obsidian get "$path" | jq -r '.result.content')
    TASKS=$(echo "$CONTENT" | grep "^- \[ \]")

    if [ -n "$TASKS" ]; then
      echo "Tasks in $path:"
      echo "$TASKS"
    fi
  done

# Update task status
obsidian patch "project-doc.md" "- [x] Complete API integration" \
  --line 42 --replace
```

## 4. Documentation Generation

**Scenario**: Generate documentation from code and comments.

```bash
# Create documentation template
obsidian create "2025-11-13-api-documentation.md" \
  "# API Documentation\n\n## Overview\n\n" \
  --frontmatter '{"tags":["documentation","api"],"status":"draft","version":"1.0"}'

# Add sections programmatically
obsidian patch "2025-11-13-api-documentation.md" \
  "## Authentication\n\nUses Bearer token authentication..." \
  --heading "Overview"

obsidian patch "2025-11-13-api-documentation.md" \
  "## Endpoints\n\n### GET /api/search\n\n..." \
  --heading "Overview"

# Update frontmatter when complete
obsidian frontmatter "2025-11-13-api-documentation.md" \
  --set '{"status":"complete"}' --merge
```

## 5. Knowledge Graph Building

**Scenario**: Build connections between related notes using tags and backlinks.

```bash
# Find notes about a topic
NOTES=$(obsidian search "tables api" --limit 10 | jq -r '.results[].path')

# For each note, update frontmatter with related tags
for note in $NOTES; do
  # Get existing tags
  TAGS=$(obsidian frontmatter "$note" --get tags | jq -r '.result.tags[]?')

  # Add new tag
  NEW_TAGS=$(echo "$TAGS" | jq -s '. + ["tables","api"] | unique')

  obsidian frontmatter "$note" --set "{\"tags\":$NEW_TAGS}" --merge
done

# Create index note with links
INDEX_CONTENT="# Tables API Knowledge Index\n\n"
for note in $NOTES; do
  INDEX_CONTENT+="\n- [[$note]]"
done

obsidian create "tables-api-index.md" "$INDEX_CONTENT" \
  --frontmatter '{"type":"index","topic":"tables-api"}'
```

## 6. Meeting Notes Processing

**Scenario**: Process meeting transcripts and extract action items.

```bash
MEETING_NOTE="2025-11-13-team-meeting.md"

# Create meeting note from transcript
obsidian create "$MEETING_NOTE" \
  "# Team Meeting - Nov 13, 2025\n\n## Transcript\n\n[Transcript here]" \
  --frontmatter '{"type":"meeting","date":"2025-11-13","attendees":["Alice","Bob"]}'

# AI extracts action items and adds them
obsidian patch "$MEETING_NOTE" \
  "## Action Items\n\n- [ ] @Alice: Review PR #123\n- [ ] @Bob: Update documentation" \
  --heading "Transcript"

# Update status
obsidian frontmatter "$MEETING_NOTE" --set '{"status":"processed"}' --merge
```

## 7. Research Paper Annotation

**Scenario**: Annotate research papers with AI-generated insights.

```bash
PAPER="2025-11-13-neural-networks-paper.md"

# Create paper note
obsidian create "$PAPER" \
  "# Neural Networks in Production\n\n## Summary\n\n## Key Findings\n\n## My Notes\n\n" \
  --frontmatter '{"type":"paper","authors":["Smith et al."],"year":2025}'

# AI adds summary
obsidian patch "$PAPER" \
  "This paper discusses practical applications of neural networks..." \
  --heading "Summary"

# AI adds key findings
obsidian patch "$PAPER" \
  "- Finding 1: Performance improvements\n- Finding 2: Cost reduction" \
  --heading "Key Findings"

# Human adds notes
obsidian patch "$PAPER" \
  "Interesting approach to deployment automation" \
  --heading "My Notes"
```

## 8. Version Control Integration

**Scenario**: Track document changes with version metadata.

```bash
DOC="important-doc.md"

# Before making changes, capture version info
OLD_VERSION=$(obsidian frontmatter "$DOC" --get version | jq -r '.result.version // 1')
NEW_VERSION=$((OLD_VERSION + 1))

# Make changes
obsidian patch "$DOC" "Updated content" --heading "Introduction" --replace

# Update version metadata
obsidian frontmatter "$DOC" --set \
  "{\"version\":$NEW_VERSION,\"lastModified\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"changelog\":\"Updated introduction\"}" \
  --merge
```

## 9. Bulk Metadata Update

**Scenario**: Update metadata across multiple notes matching criteria.

```bash
# Find all notes with status "draft"
DRAFTS=$(obsidian search "status: draft" | jq -r '.results[].path')

# Update all drafts to "review"
for note in $DRAFTS; do
  obsidian frontmatter "$note" --set '{"status":"review"}' --merge
  echo "Updated: $note"
done

# Add review date
for note in $DRAFTS; do
  obsidian frontmatter "$note" \
    --set "{\"reviewDate\":\"$(date +%Y-%m-%d)\"}" --merge
done
```

## 10. Smart Search and Link

**Scenario**: Find related notes and automatically create bidirectional links.

```bash
CURRENT_NOTE="2025-11-13-adk-integration.md"

# Extract keywords from current note
KEYWORDS=$(obsidian frontmatter "$CURRENT_NOTE" --get tags | \
  jq -r '.result.tags[]?')

# Search for related notes
for keyword in $KEYWORDS; do
  RELATED=$(obsidian search "$keyword" --limit 5 | \
    jq -r '.results[].path' | \
    grep -v "$CURRENT_NOTE")

  # Add links to current note
  for note in $RELATED; do
    obsidian patch "$CURRENT_NOTE" \
      "- Related: [[$note]]" \
      --heading "References"
  done
done
```

## Tips for AI Integration

1. **Parse JSON output**: Use `jq` to parse JSON responses
   ```bash
   obsidian search "query" | jq -r '.results[].path'
   ```

2. **Handle errors**: Check `success` field
   ```bash
   RESULT=$(obsidian get "note.md")
   if [ "$(echo "$RESULT" | jq -r '.success')" = "true" ]; then
     # Process result
   fi
   ```

3. **Batch operations**: Loop through results efficiently
   ```bash
   obsidian search "tag:#review" | jq -r '.results[].path' | \
     xargs -I {} obsidian frontmatter "{}" --set '{"reviewed":true}' --merge
   ```

4. **Structured logging**: All output is JSON for easy logging
   ```bash
   obsidian create "note.md" "content" 2>&1 | tee -a operations.log
   ```

5. **Idempotent operations**: Use `--merge` to avoid overwriting data
   ```bash
   obsidian frontmatter "note.md" --set '{"updated":true}' --merge
   ```

## MCP Integration (Future)

This CLI tool can be wrapped as an MCP (Model Context Protocol) server for direct integration with AI assistants like Claude Desktop:

```typescript
// Example MCP server wrapper
import { Server } from '@modelcontextprotocol/sdk/server';
import { exec } from 'child_process';

const server = new Server({
  name: 'obsidian-cli',
  version: '0.1.0',
});

server.tool('search', async ({ query, limit }) => {
  const result = await execSync(`obsidian search "${query}" --limit ${limit}`);
  return JSON.parse(result);
});
```

See the main README for installation instructions and configuration details.
