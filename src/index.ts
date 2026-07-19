#!/usr/bin/env bun

import { Command } from 'commander';
import { searchCommand } from './commands/search';
import { getCommand } from './commands/get';
import { createCommand } from './commands/create';
import { patchCommand } from './commands/patch';
import { frontmatterCommand } from './commands/frontmatter';
import { deleteCommand } from './commands/delete';
import { listCommand } from './commands/list';
import { configCommand } from './commands/config';
import { vaultsCommand } from './commands/vaults';
import { instructionsCommand } from './commands/instructions';
import { excalidrawCreate, excalidrawGet, excalidrawPatch } from './commands/excalidraw';
import { inboxCommand } from './commands/inbox';
import { moveCommand } from './commands/move';
import { staleCommand } from './commands/stale';
import { statsCommand } from './commands/stats';
import { linkCommand } from './commands/link';

const program = new Command();

program
  .name('obsidian')
  .description('AI-optimized CLI tool for Obsidian vault operations')
  .version('0.3.0');

// Global options
const addVaultOption = (cmd: Command) => {
  return cmd.option('-v, --vault <name>', 'Vault name (uses default if not specified)');
};

// Search command
addVaultOption(
  program
    .command('search')
    .description('Search notes in the vault (uses Omnisearch + REST API fallback)')
    .argument('<query>', 'Search query')
    .option('-l, --limit <number>', 'Maximum number of results', '50')
    .option('-c, --chars <number>', 'Context length for excerpts', '300')
)
  .action(async (query: string, options) => {
    await searchCommand(query, {
      ...options,
      limit: parseInt(options.limit),
      chars: parseInt(options.chars),
    });
  });

// Get command
addVaultOption(
  program
    .command('get')
    .description('Get note content')
    .argument('<path>', 'Note path (e.g., "2025-11-13-example.md")')
)
  .action(async (path: string, options) => {
    await getCommand(path, options);
  });

// Create command
addVaultOption(
  program
    .command('create')
    .description('Create a new note')
    .argument('<path>', 'Note path')
    .argument('[content]', 'Note content (or use --from-file/--stdin)')
    .option('-f, --from-file <path>', 'Read content from file')
    .option('--stdin', 'Read content from stdin')
    .option('--frontmatter <json>', 'Frontmatter as JSON string')
    .option('--merge-frontmatter', 'Merge frontmatter from source file with --frontmatter option')
)
  .action(async (path: string, content: string | undefined, options) => {
    await createCommand(path, content, options);
  });

// Patch command
addVaultOption(
  program
    .command('patch')
    .description('Surgically edit a note')
    .argument('<path>', 'Note path')
    .argument('[content]', 'Content to add/replace (or use --from-file/--stdin)')
    .option('-f, --from-file <path>', 'Read content from file')
    .option('--stdin', 'Read content from stdin')
    .option('--append', 'Append to end of note (default)')
    .option('--prepend', 'Prepend to beginning of note')
    .option('--heading <name>', 'Target a specific heading')
    .option('--line <number>', 'Target a specific line number')
    .option('--replace', 'Replace instead of append')
    .option('--delete', 'Delete the target section/line')
)
  .action(async (path: string, content: string | undefined, options) => {
    await patchCommand(path, content, {
      ...options,
      line: options.line ? parseInt(options.line) : undefined,
    });
  });

// Frontmatter command
addVaultOption(
  program
    .command('frontmatter')
    .description('Get or set note frontmatter')
    .argument('<path>', 'Note path')
    .option('--get [field]', 'Get frontmatter (optionally specify field)')
    .option('--set <json>', 'Set frontmatter from JSON')
    .option('--delete <field>', 'Delete a frontmatter field')
    .option('--merge', 'Merge with existing frontmatter when using --set')
    .option('--fix', 'Fix missing title/timestamps in frontmatter')
)
  .action(async (path: string, options) => {
    await frontmatterCommand(path, options);
  });

// Delete command
addVaultOption(
  program
    .command('delete')
    .description('Delete a note')
    .argument('<path>', 'Note path')
)
  .action(async (path: string, options) => {
    await deleteCommand(path, options);
  });

// List command
addVaultOption(
  program
    .command('list')
    .description('List files in the vault or directory')
    .argument('[path]', 'Directory path (optional, defaults to vault root)', '')
)
  .action(async (path: string, options) => {
    await listCommand(path, options);
  });

// Config command
program
  .command('config')
  .description('Manage vault configurations')
  .option('--list', 'List all configured vaults')
  .option('--add', 'Add a new vault')
  .option('--remove', 'Remove a vault')
  .option('--default', 'Set default vault')
  .option('--path', 'Show config file path')
  .option('-n, --name <name>', 'Vault name')
  .option('--base-url <url>', 'REST API base URL')
  .option('--api-key <key>', 'REST API key')
  .option('--omnisearch', 'Enable Omnisearch (default: true)')
  .option('--omnisearch-url <url>', 'Omnisearch base URL')
  .action(async (options) => {
    await configCommand(options);
  });

// Vaults command - auto-discovered vault list + default selection
program
  .command('vaults')
  .description('List Obsidian vaults (auto-discovered) and set the default')
  .option('--use <name>', 'Set the default vault used by all commands')
  .action(async (options) => {
    await vaultsCommand(options);
  });

// Instructions command
program
  .command('instructions')
  .description('Show concise AI-optimized usage instructions')
  .action(() => {
    instructionsCommand();
  });

// Inbox command - List inbox items for triage
addVaultOption(
  program
    .command('inbox')
    .description('List inbox items with frontmatter for triage')
    .option('--folder <path>', 'Inbox folder path (default: inbox)')
)
  .action(async (options) => {
    await inboxCommand(options);
  });

// Move command - Move note between folders
addVaultOption(
  program
    .command('move')
    .description('Move note between folders, update timestamps')
    .argument('<source>', 'Source note path')
    .argument('<destination>', 'Destination path or folder')
    .option('--no-update-timestamp', 'Skip updating updated_at timestamp')
)
  .action(async (source: string, destination: string, options) => {
    await moveCommand(source, destination, options);
  });

// Stale command - Find old research notes
addVaultOption(
  program
    .command('stale')
    .description('Find research notes older than N days')
    .option('-d, --days <number>', 'Stale threshold in days', '30')
    .option('--folder <path>', 'Folder to search (default: research)')
)
  .action(async (options) => {
    await staleCommand({
      ...options,
      days: parseInt(options.days),
    });
  });

// Stats command - Vault health overview
addVaultOption(
  program
    .command('stats')
    .description('Vault health: inbox count, stale research, scope breakdown')
    .option('--stale-days <number>', 'Stale threshold for research', '30')
)
  .action(async (options) => {
    await statsCommand({
      ...options,
      staleDays: options.staleDays ? parseInt(options.staleDays) : undefined,
    });
  });

// Link command - Add wikilink to note
addVaultOption(
  program
    .command('link')
    .description('Add wikilink from source note to target')
    .argument('<source>', 'Source note path')
    .argument('<target>', 'Target note path or name')
    .option('--heading <name>', 'Add link under specific heading')
    .option('--alias <text>', 'Display alias for the wikilink')
)
  .action(async (source: string, target: string, options) => {
    await linkCommand(source, target, options);
  });

// Excalidraw command with subcommands
const excalidrawCmd = program
  .command('excalidraw')
  .description('Generate and manage Excalidraw diagrams');

// Excalidraw create subcommand
addVaultOption(
  excalidrawCmd
    .command('create')
    .description('Create a new Excalidraw diagram from DSL')
    .argument('<path>', 'Diagram path (e.g., "diagrams/arch.excalidraw.md")')
    .option('-f, --from-file <path>', 'Read diagram DSL from JSON file')
    .option('--stdin', 'Read diagram DSL from stdin')
)
  .action(async (path: string, options) => {
    await excalidrawCreate(path, options);
  });

// Excalidraw get subcommand
addVaultOption(
  excalidrawCmd
    .command('get')
    .description('Get an Excalidraw diagram as JSON')
    .argument('<path>', 'Diagram path')
)
  .action(async (path: string, options) => {
    await excalidrawGet(path, options);
  });

// Excalidraw patch subcommand
addVaultOption(
  excalidrawCmd
    .command('patch')
    .description('Add elements to an existing Excalidraw diagram')
    .argument('<path>', 'Diagram path')
    .option('-f, --from-file <path>', 'Read additions from JSON file')
    .option('--stdin', 'Read additions from stdin')
)
  .action(async (path: string, options) => {
    await excalidrawPatch(path, options);
  });

program.parse();
