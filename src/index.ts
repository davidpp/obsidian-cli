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
import { instructionsCommand } from './commands/instructions';

const program = new Command();

program
  .name('obsidian')
  .description('AI-optimized CLI tool for Obsidian vault operations')
  .version('0.1.0');

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

// Instructions command
program
  .command('instructions')
  .description('Show concise AI-optimized usage instructions')
  .action(() => {
    instructionsCommand();
  });

program.parse();
