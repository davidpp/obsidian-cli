// Active command - get the note currently open in Obsidian

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { outputSuccess, outputError } from '../utils/output';
import type { CommandOptions } from '../api/types';

export async function activeCommand(options: CommandOptions): Promise<void> {
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);
    const note = await restClient.getActiveNote();

    outputSuccess('active', note, undefined, vaultName);
  } catch (error) {
    outputError('active', error as Error, vaultName);
  }
}
