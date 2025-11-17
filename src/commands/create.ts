// Create note command

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { outputSuccess, outputError } from '../utils/output';
import type { CommandOptions } from '../api/types';
import YAML from 'yaml';

function generateTitleFromFilename(filename: string): string {
  // Remove .md extension
  const baseName = filename.replace(/\.md$/, '');

  // Split by hyphens and capitalize each word
  const words = baseName.split('-').map(word => {
    // Preserve common acronyms in uppercase
    const acronyms = ['adk', 'api', 'cli', 'sdk', 'llm', 'llmz', 'ai', 'ml', 'ui', 'ux', 'db', 'sql', 'rest', 'http', 'https', 'json', 'yaml', 'xml', 'html', 'css', 'js', 'ts'];
    if (acronyms.includes(word.toLowerCase())) {
      return word.toUpperCase();
    }
    // Capitalize first letter, rest lowercase
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return words.join(' ');
}

async function readContentFromSource(
  contentArg: string | undefined,
  options: CommandOptions
): Promise<{ content: string; sourceFrontmatter?: Record<string, any> }> {
  let content = '';
  let sourceFrontmatter: Record<string, any> | undefined;

  // Priority: --from-file > --stdin > content argument
  if (options.fromFile) {
    const file = Bun.file(options.fromFile as string);
    if (!(await file.exists())) {
      throw new Error(`Source file not found: ${options.fromFile}`);
    }
    content = await file.text();
  } else if (options.stdin) {
    // Read from stdin
    const stdin = await Bun.stdin.text();
    if (!stdin) {
      throw new Error('No content provided via stdin');
    }
    content = stdin;
  } else if (contentArg) {
    content = contentArg;
  } else {
    throw new Error(
      'No content provided. Use content argument, --from-file, or --stdin'
    );
  }

  // Parse frontmatter from source if merge is requested
  if (options.mergeFrontmatter && content) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (frontmatterMatch && frontmatterMatch[1]) {
      try {
        sourceFrontmatter = YAML.parse(frontmatterMatch[1]);
        // Remove frontmatter from content
        content = content.slice(frontmatterMatch[0].length);
      } catch (error) {
        // If parsing fails, keep original content
      }
    }
  }

  return { content, sourceFrontmatter };
}

export async function createCommand(
  path: string,
  content: string | undefined,
  options: CommandOptions
): Promise<void> {
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);

    // Read content from source
    const { content: finalContent, sourceFrontmatter } =
      await readContentFromSource(content, options);

    // Parse frontmatter from options if provided
    let frontmatter: Record<string, any> | undefined;
    if (options.frontmatter) {
      try {
        frontmatter =
          typeof options.frontmatter === 'string'
            ? JSON.parse(options.frontmatter)
            : options.frontmatter;
      } catch (error) {
        throw new Error(
          `Invalid frontmatter JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Merge frontmatter if requested
    if (options.mergeFrontmatter && sourceFrontmatter) {
      frontmatter = { ...sourceFrontmatter, ...frontmatter };
    }

    // Generate title from filename if not provided
    const generatedTitle = generateTitleFromFilename(path);

    // Automatically add title, created_at, and updated_at
    const now = new Date().toISOString();
    frontmatter = {
      title: generatedTitle,
      ...frontmatter,
      created_at: now,
      updated_at: now,
    };

    await restClient.createNote(path, finalContent, frontmatter);

    outputSuccess(
      'create',
      {
        path,
        created: true,
      },
      undefined,
      vaultName
    );
  } catch (error) {
    outputError('create', error as Error, vaultName);
  }
}
