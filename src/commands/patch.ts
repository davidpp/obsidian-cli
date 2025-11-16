// Patch command for surgical edits

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { outputSuccess, outputError } from '../utils/output';
import type { CommandOptions, PatchOperation } from '../api/types';
import YAML from 'yaml';

async function readContentFromSource(
  contentArg: string | undefined,
  options: CommandOptions
): Promise<string> {
  // Priority: --from-file > --stdin > content argument
  if (options.fromFile) {
    const file = Bun.file(options.fromFile as string);
    if (!(await file.exists())) {
      throw new Error(`Source file not found: ${options.fromFile}`);
    }
    return await file.text();
  } else if (options.stdin) {
    const stdin = await Bun.stdin.text();
    if (!stdin) {
      throw new Error('No content provided via stdin');
    }
    return stdin;
  } else if (contentArg) {
    return contentArg;
  } else {
    throw new Error(
      'No content provided. Use content argument, --from-file, or --stdin'
    );
  }
}

export async function patchCommand(
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
    const finalContent = await readContentFromSource(content, options);

    // Handle different patch operations
    if (options.append) {
      await restClient.appendToNote(path, finalContent);
    } else if (options.prepend) {
      await restClient.prependToNote(path, finalContent);
    } else if (options.heading) {
      // Surgical edit under a specific heading
      await patchUnderHeading(restClient, path, options.heading as string, finalContent, options);
    } else if (typeof options.line === 'number') {
      // Surgical edit at a specific line
      await patchAtLine(restClient, path, options.line, finalContent, options);
    } else {
      // Default to append
      await restClient.appendToNote(path, finalContent);
    }

    // Update the updated_at timestamp
    const note = await restClient.getNote(path);
    if (note.frontmatter) {
      const updatedFrontmatter = {
        ...note.frontmatter,
        updated_at: new Date().toISOString(),
      };
      await restClient.updateFrontmatter(path, updatedFrontmatter);
    }

    const operation: PatchOperation = {
      targetType: options.heading
        ? 'heading'
        : typeof options.line === 'number'
          ? 'line'
          : options.append
            ? 'append'
            : options.prepend
              ? 'prepend'
              : 'append',
      target: options.heading || options.line,
      operation: options.replace ? 'replace' : options.delete ? 'delete' : 'append',
      content: options.delete ? undefined : finalContent,
    };

    outputSuccess(
      'patch',
      {
        path,
        details: operation,
      },
      undefined,
      vaultName
    );
  } catch (error) {
    outputError('patch', error as Error, vaultName);
  }
}

async function patchUnderHeading(
  client: RestAPIClient,
  path: string,
  heading: string,
  content: string,
  options: CommandOptions
): Promise<void> {
  const note = await client.getNote(path);
  const lines = note.content.split('\n');

  // Find the heading
  const headingPattern = new RegExp(`^#{1,6}\\s+${heading}\\s*$`, 'i');
  let headingIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line && headingPattern.test(line)) {
      headingIndex = i;
      break;
    }
  }

  if (headingIndex === -1) {
    throw new Error(`Heading "${heading}" not found in ${path}`);
  }

  // Find the end of this section (next heading or end of file)
  let sectionEndIndex = lines.length;
  for (let i = headingIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line && /^#{1,6}\s+/.test(line)) {
      sectionEndIndex = i;
      break;
    }
  }

  if (options.replace) {
    // Replace content under heading
    lines.splice(headingIndex + 1, sectionEndIndex - headingIndex - 1, '', content);
  } else if (options.delete) {
    // Delete the section
    lines.splice(headingIndex, sectionEndIndex - headingIndex);
  } else {
    // Append to section (default)
    lines.splice(sectionEndIndex, 0, '', content);
  }

  const newContent = lines.join('\n');
  const fullContent = note.frontmatter
    ? `---\n${YAML.stringify(note.frontmatter)}---\n\n${newContent}`
    : newContent;

  await client.updateNote(path, fullContent);
}

async function patchAtLine(
  client: RestAPIClient,
  path: string,
  lineNumber: number,
  content: string,
  options: CommandOptions
): Promise<void> {
  const note = await client.getNote(path);
  const lines = note.content.split('\n');

  if (lineNumber < 0 || lineNumber >= lines.length) {
    throw new Error(`Line ${lineNumber} out of range (0-${lines.length - 1})`);
  }

  if (options.replace) {
    lines[lineNumber] = content;
  } else if (options.delete) {
    lines.splice(lineNumber, 1);
  } else {
    // Insert after the line
    lines.splice(lineNumber + 1, 0, content);
  }

  const newContent = lines.join('\n');
  const fullContent = note.frontmatter
    ? `---\n${YAML.stringify(note.frontmatter)}---\n\n${newContent}`
    : newContent;

  await client.updateNote(path, fullContent);
}
