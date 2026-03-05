// Link command - Add wikilink to note

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { outputSuccess, outputError } from '../utils/output';
import type { CommandOptions } from '../api/types';
import YAML from 'yaml';

export interface LinkOptions extends CommandOptions {
  heading?: string;
  alias?: string;
}

export async function linkCommand(
  source: string,
  target: string,
  options: LinkOptions
): Promise<void> {
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);

    // Get the source note
    const note = await restClient.getNote(source);

    // Build the wikilink
    // Target can be full path or just note name
    const targetName = target.replace(/\.md$/, '').split('/').pop() || target;
    let wikilink: string;

    if (options.alias) {
      wikilink = `[[${targetName}|${options.alias}]]`;
    } else {
      wikilink = `[[${targetName}]]`;
    }

    // Append the link to the note or under a specific heading
    let newContent: string;

    if (options.heading) {
      // Find the heading and append link after it
      const headingRegex = new RegExp(`^(#{1,6}\\s*${options.heading}.*?)$`, 'mi');
      const match = note.content.match(headingRegex);

      if (match) {
        const headingIndex = note.content.indexOf(match[0]);
        const afterHeading = headingIndex + match[0].length;

        // Find the end of the section (next heading or end of file)
        const restOfContent = note.content.slice(afterHeading);
        const nextHeadingMatch = restOfContent.match(/\n#{1,6}\s/);
        const insertPoint = nextHeadingMatch
          ? afterHeading + (nextHeadingMatch.index || restOfContent.length)
          : note.content.length;

        newContent =
          note.content.slice(0, insertPoint).trimEnd() +
          '\n' +
          wikilink +
          '\n' +
          note.content.slice(insertPoint);
      } else {
        // Heading not found, append to end
        newContent = note.content.trimEnd() + '\n\n' + wikilink + '\n';
      }
    } else {
      // Append to end of note
      newContent = note.content.trimEnd() + '\n\n' + wikilink + '\n';
    }

    // Rebuild full content with frontmatter
    let fullContent = newContent;
    if (note.frontmatter && Object.keys(note.frontmatter).length > 0) {
      const yamlStr = YAML.stringify(note.frontmatter);
      fullContent = `---\n${yamlStr}---\n\n${newContent}`;
    }

    await restClient.updateNote(source, fullContent);

    // Also update the 'related' frontmatter field if it exists
    if (note.frontmatter?.related) {
      const related = Array.isArray(note.frontmatter.related)
        ? note.frontmatter.related
        : [note.frontmatter.related];

      if (!related.includes(wikilink) && !related.includes(`[[${targetName}]]`)) {
        related.push(wikilink);
        await restClient.updateFrontmatter(source, {
          ...note.frontmatter,
          related,
        });
      }
    }

    outputSuccess(
      'link',
      {
        source,
        target: targetName,
        wikilink,
        heading: options.heading,
      },
      undefined,
      vaultName
    );
  } catch (error) {
    outputError('link', error as Error, vaultName);
  }
}
