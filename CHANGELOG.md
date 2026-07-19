# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2026-07-19

### Added
- REST port auto-detection — each vault's endpoint is confirmed by probing `GET /`
  with its API key (the key is the vault's identity), so the CLI uses whichever port
  actually answers, even non-default ones
- `obsidian tags` — list all tags with usage counts
- `obsidian find <jsonlogic>` — structured search against note metadata (JsonLogic)
- `obsidian active` — get the note currently open in Obsidian
- `obsidian commands` / `commands --run <id>` — list or run Obsidian commands
- `obsidian open <path>` — open a note in the Obsidian UI

### Changed
- `obsidian vaults` now probes each vault, so `available` reflects a real connection
  and reports its resolved `baseUrl`
- Two vaults that declare the same REST port are flagged as colliding, with a reason
  telling you which one to give a unique port

## [0.3.0] - 2026-07-19

### Added
- Automatic vault discovery from Obsidian's own config — no manual API key setup
  - New command: `obsidian vaults` lists every vault Obsidian knows, showing which
    are usable (Local REST API installed), which has omnisearch, and the default
  - New command: `obsidian vaults --use <name>` sets the default vault for all commands
  - Reads Obsidian's registry (`obsidian.json`) for vault paths and the open vault,
    and each vault's `obsidian-local-rest-api` plugin data for port + API key
  - Works with zero config: default resolves to the configured default, else the
    currently-open vault, else the only usable vault
  - Vaults without the Local REST API plugin are listed with a clear reason instead
    of failing silently
  - Manual entries in `config.json` still override discovery (custom port/key/omnisearch)

## [0.2.0] - 2025-12-17

### Added
- Excalidraw diagram generation with auto-layout
  - New command: `obsidian excalidraw create/get/patch`
  - DSL input format with nodes/edges for AI agents
  - Auto-layout using dagre graph library
  - LZ-String compression for Obsidian plugin compatibility
  - Node types: rectangle, ellipse, diamond, cylinder, parallelogram
  - Edge styles: solid, dashed, dotted
  - Layout directions: LR, TB, RL, BT
  - Updated instructions with Excalidraw usage guide

## [0.1.0] - 2024-12-11

### Added
- Initial release of Obsidian CLI
- Core commands: `search`, `get`, `create`, `patch`, `delete`, `list`, `frontmatter`, `config`, `instructions`
- Omnisearch integration with REST API fallback
- Multi-vault support with configuration management
- File input support (`--from-file`, `--stdin`) for large content
- Automatic frontmatter generation:
  - `title` from filename (kebab-case to Title Case)
  - `created_at` and `updated_at` timestamps
- Surgical editing with `patch` command:
  - Append/prepend content
  - Target specific headings
  - Target specific line numbers
  - Replace or delete sections
- Frontmatter manipulation (`--get`, `--set`, `--merge`, `--delete`)
- AI-optimized JSON output format
- Comprehensive E2E test instructions

### Fixed
- `--delete` no longer requires content input
- Title generation strips leading underscores and special characters
- Expanded acronym list for title generation (E2E, POC, MVP, JWT, OAuth, etc.)
