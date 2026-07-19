// Open command - open a note in the Obsidian UI

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { outputSuccess, outputError } from '../utils/output';
import type { CommandOptions } from '../api/types';

export async function openCommand(path: string, options: CommandOptions): Promise<void> {
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);
    await restClient.openFile(path);

    outputSuccess('open', { path, opened: true }, undefined, vaultName);
  } catch (error) {
    outputError('open', error as Error, vaultName);
  }
}
