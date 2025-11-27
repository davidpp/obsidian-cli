# Obsidian CLI Setup Guide

Complete setup guide for using obsidian-cli with your Obsidian vault.

## Prerequisites

1. **Obsidian** installed and running
2. **Bun** runtime installed ([bun.sh](https://bun.sh))

## Step 1: Install Required Obsidian Plugins

### Plugin 1: Local REST API (Required)

This plugin provides the HTTP API for vault operations.

1. Open Obsidian Settings → Community Plugins
2. Browse and search for "Local REST API"
3. Install and Enable the plugin
4. Go to Settings → Local REST API

**Configuration:**
- **Enable HTTPS**: Yes (recommended)
- **Port**: Default is 27124 (note this for later)
- **Generate API Key**: Click to generate your key
- **Copy the API key** - you'll need it for obsidian-cli config

The plugin will typically run at: `https://127.0.0.1:27124`

### Plugin 2: Omnisearch (Optional, Recommended)

This plugin provides fast full-text search. obsidian-cli will fallback to REST API search if not available.

1. Open Obsidian Settings → Community Plugins
2. Browse and search for "Omnisearch"
3. Install and Enable the plugin

No additional configuration needed. Omnisearch typically runs at: `http://localhost:51361`

## Step 2: Install obsidian-cli

```bash
# Clone the repository
git clone <repository-url>
cd obsidian-cli

# Install dependencies
bun install

# Link globally (creates 'obsidian' command)
bun link
```

Verify installation:
```bash
obsidian --version
```

## Step 3: Configure Your Vault

On first run, obsidian-cli will create a config file:

```bash
obsidian config --list
```

This creates: `~/.config/obsidian-cli/config.json`

Edit the config file:
```bash
# macOS/Linux
nano ~/.config/obsidian-cli/config.json

# Or use your preferred editor
code ~/.config/obsidian-cli/config.json
```

### Default Configuration Template

```json
{
  "defaultVault": "my-vault",
  "vaults": {
    "my-vault": {
      "restApi": {
        "baseUrl": "https://127.0.0.1:27124",
        "apiKey": "YOUR-API-KEY-HERE"
      },
      "omnisearch": {
        "enabled": true,
        "baseUrl": "http://localhost:51361"
      }
    }
  }
}
```

**Replace:**
- `"my-vault"` → Your vault name (e.g., "personal", "work", "research")
- `"YOUR-API-KEY-HERE"` → The API key from Local REST API plugin
- `27124` → Your REST API port (if different)

### Multiple Vaults Setup

If you have multiple Obsidian vaults:

```json
{
  "defaultVault": "personal",
  "vaults": {
    "personal": {
      "restApi": {
        "baseUrl": "https://127.0.0.1:27124",
        "apiKey": "api-key-for-personal-vault"
      },
      "omnisearch": {
        "enabled": true,
        "baseUrl": "http://localhost:51361"
      }
    },
    "work": {
      "restApi": {
        "baseUrl": "https://127.0.0.1:27125",
        "apiKey": "api-key-for-work-vault"
      },
      "omnisearch": {
        "enabled": false
      }
    }
  }
}
```

**Note**: Each vault needs its own Local REST API instance with different port numbers.

Use specific vault: `obsidian search "query" --vault work`

## Step 4: Test Your Setup

```bash
# Test configuration
obsidian config --list

# Test search (uses default vault)
obsidian search "test" --limit 5

# Test reading a note
obsidian list  # List all files
obsidian get "existing-note.md"
```

## Troubleshooting

### "Configuration file created at..."
Your API key is missing. Edit `~/.config/obsidian-cli/config.json` with your Local REST API key.

### "Failed to connect to REST API"
1. Verify Obsidian is running
2. Check Local REST API plugin is enabled (Settings → Community Plugins)
3. Verify the port matches your plugin settings
4. Check the API key is correct

### "Failed to connect to Omnisearch"
Two options:
1. Install and enable Omnisearch plugin, OR
2. Disable in config: Set `"enabled": false` in omnisearch section

obsidian-cli will automatically fallback to REST API search.

### Self-Signed Certificate Errors
obsidian-cli handles self-signed certificates automatically. If you still see errors:
- Ensure you're using `https://` in baseUrl
- Check Local REST API plugin has HTTPS enabled

### Finding Your API Key
1. Open Obsidian
2. Settings → Local REST API
3. Look for "API Key" section
4. Copy the key (it's a long hexadecimal string)

### Which Vault is Active?
```bash
obsidian config --list
```
Shows your default vault and all configured vaults.

## Usage Examples

### Basic Operations
```bash
# Search
obsidian search "query" --limit 10

# Read
obsidian get "note.md"

# Create
obsidian create "new-note.md" "# Title\n\nContent"

# Edit
obsidian patch "note.md" "Additional content"

# Metadata
obsidian frontmatter "note.md" --get
obsidian frontmatter "note.md" --set '{"status":"done"}' --merge
```

See [README.md](README.md) for complete command reference and [examples/ai-workflows.md](examples/ai-workflows.md) for AI integration patterns.

## Advanced Configuration

### Disable Omnisearch for Specific Vault
```json
{
  "vaults": {
    "my-vault": {
      "restApi": { ... },
      "omnisearch": {
        "enabled": false
      }
    }
  }
}
```

### Custom Omnisearch Port
If Omnisearch runs on a different port:
```json
{
  "omnisearch": {
    "enabled": true,
    "baseUrl": "http://localhost:CUSTOM-PORT"
  }
}
```

### Using HTTP Instead of HTTPS
If Local REST API plugin uses HTTP (not recommended):
```json
{
  "restApi": {
    "baseUrl": "http://127.0.0.1:27123",
    "apiKey": "..."
  }
}
```

## Default Vault Recommendation

For AI/automation workflows:
- **Name**: Use a descriptive name (e.g., "research", "work", "personal")
- **Format**: Store dates in frontmatter, not filename
  - ✅ `adk-testing-guide.md` with `date: 2025-11-13` in frontmatter
  - ❌ `2025-11-13-adk-testing-guide.md`
- **Frontmatter**: Always include tags, date, status for better search

Example note structure:
```markdown
---
tags: [research, adk, testing]
date: 2025-11-13
status: active
---

# ADK Testing Guide

Content here...
```

## Support

- Full documentation: [README.md](README.md)
- AI workflows: [examples/ai-workflows.md](examples/ai-workflows.md)
- Quick start: [QUICKSTART.md](QUICKSTART.md)

## Security Note

The API key in your config file provides full access to your vault. Keep `~/.config/obsidian-cli/config.json` secure and don't commit it to version control.
