// Frontmatter command for metadata manipulation

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { outputSuccess, outputError } from '../utils/output';
import type { CommandOptions } from '../api/types';

export async function frontmatterCommand(
  path: string,
  options: CommandOptions
): Promise<void> {
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);

    // Get operation
    if (options.get) {
      const frontmatter = await restClient.getFrontmatter(path);

      if (typeof options.get === 'string') {
        // Get specific field
        const value = frontmatter?.[options.get];
        outputSuccess(
          'frontmatter.get',
          { [options.get]: value },
          undefined,
          vaultName
        );
      } else {
        // Get all frontmatter
        outputSuccess('frontmatter.get', frontmatter || {}, undefined, vaultName);
      }
    }
    // Set operation
    else if (options.set) {
      let newFrontmatter: Record<string, any>;

      try {
        newFrontmatter =
          typeof options.set === 'string' ? JSON.parse(options.set) : options.set;
      } catch (error) {
        throw new Error(
          `Invalid frontmatter JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Merge with existing frontmatter if options.merge is true
      if (options.merge) {
        const existing = await restClient.getFrontmatter(path);
        newFrontmatter = { ...existing, ...newFrontmatter };
      }

      await restClient.updateFrontmatter(path, newFrontmatter);

      outputSuccess(
        'frontmatter.set',
        {
          path,
          frontmatter: newFrontmatter,
        },
        undefined,
        vaultName
      );
    }
    // Delete field operation
    else if (options.delete) {
      const existing = await restClient.getFrontmatter(path);
      if (existing && typeof options.delete === 'string') {
        delete existing[options.delete];
        await restClient.updateFrontmatter(path, existing);

        outputSuccess(
          'frontmatter.delete',
          {
            path,
            deleted: options.delete,
          },
          undefined,
          vaultName
        );
      } else {
        throw new Error('No frontmatter to delete or invalid field');
      }
    } else {
      throw new Error('Must specify --get, --set, or --delete operation');
    }
  } catch (error) {
    outputError('frontmatter', error as Error, vaultName);
  }
}
