# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
