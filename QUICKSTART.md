# Quick Start Guide

Get up and running with obsidian-cli in 5 minutes.

## 1. Install

```bash
cd obsidian-cli
bun install
bun link
```

## 2. Configure

Nothing to configure. Enable the **Local REST API** plugin in Obsidian (Settings →
Community plugins), and the CLI auto-discovers your vaults — including each one's API
key and port — straight from Obsidian's config:

```bash
# See every vault the CLI found (and which are usable)
obsidian vaults

# Pick the default used by all commands
obsidian vaults --use "my-vault"
```

If a vault shows `available: false`, its `reason` tells you what to fix (usually:
enable the plugin, or give it a unique port when two vaults are open).

> Prefer to pin things by hand? You still can — add an entry to
> `~/.config/obsidian-cli/config.json` and it overrides discovery.

## 3. Test

```bash
# Search your vault (add --meta for title/tags/frontmatter per hit)
obsidian search "test" --limit 5 --meta

# Get a note
obsidian get "filename.md"
```

## Common Commands

### Search
```bash
obsidian search "query" --limit 10
```

### Read
```bash
obsidian get "2025-11-13-note.md"
```

### Create
```bash
obsidian create "new-note.md" "# Title\n\nContent"
```

### Edit
```bash
# Append to end
obsidian patch "note.md" "New content"

# Add under heading
obsidian patch "note.md" "Content" --heading "Section Name"
```

### Metadata
```bash
# Get all frontmatter
obsidian frontmatter "note.md" --get

# Set frontmatter
obsidian frontmatter "note.md" --set '{"status":"done"}'
```

## Troubleshooting

### "Configuration file created at..."
Your API key is missing. Edit the config file with your Obsidian Local REST API key.

### "Failed to connect to REST API"
- Check if Obsidian is running
- Verify the Local REST API plugin is enabled
- Check the base URL matches your plugin settings (usually http://127.0.0.1:27123)

### "Failed to connect to Omnisearch"
Omnisearch plugin is not running. Either:
1. Install and enable Omnisearch plugin, or
2. Disable it in config: `"enabled": false`

The CLI will fallback to REST API search automatically.

## Next Steps

- Read [README.md](README.md) for full command reference
- See [examples/ai-workflows.md](examples/ai-workflows.md) for AI integration patterns
- Build executable: `bun run build`

## Support

For issues, check the REST API plugin logs:
- Obsidian Settings → Local REST API → View Logs
