// Move command - Move note between folders, update timestamps

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { outputSuccess, outputError } from '../utils/output';
import type { CommandOptions } from '../api/types';

export interface MoveOptions extends CommandOptions {
  updateTimestamp?: boolean;
}

export async function moveCommand(
  source: string,
  destination: string,
  options: MoveOptions
): Promise<void> {
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);

    // Get the source note
    const note = await restClient.getNote(source);

    // Determine destination path
    let destPath = destination;
    if (destination.endsWith('/')) {
      // Destination is a folder, preserve filename
      const filename = source.split('/').pop() || source;
      destPath = destination + filename;
    } else if (!destination.endsWith('.md')) {
      // Destination is a folder without trailing slash
      const filename = source.split('/').pop() || source;
      destPath = destination + '/' + filename;
    }

    // Update frontmatter timestamps if requested
    let frontmatter = note.frontmatter || {};
    if (options.updateTimestamp !== false) {
      frontmatter = {
        ...frontmatter,
        updated_at: new Date().toISOString(),
      };
    }

    // Create note at new location
    await restClient.createNote(destPath, note.content, frontmatter);

    // Delete original note
    await restClient.deleteNote(source);

    outputSuccess(
      'move',
      {
        source,
        destination: destPath,
        updated_at: frontmatter.updated_at,
      },
      undefined,
      vaultName
    );
  } catch (error) {
    outputError('move', error as Error, vaultName);
  }
}
