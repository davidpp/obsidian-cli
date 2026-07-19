// Tags command - list all tags in the vault with usage counts

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { outputResults, outputError } from '../utils/output';
import type { CommandOptions } from '../api/types';

export async function tagsCommand(options: CommandOptions): Promise<void> {
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);
    const tags = await restClient.getTags();

    outputResults('tags', tags, undefined, vaultName);
  } catch (error) {
    outputError('tags', error as Error, vaultName);
  }
}
