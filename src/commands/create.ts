// Create note command

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { outputSuccess, outputError } from '../utils/output';
import type { CommandOptions } from '../api/types';

export async function createCommand(
  path: string,
  content: string,
  options: CommandOptions
): Promise<void> {
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);

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

    await restClient.createNote(path, content, frontmatter);

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
