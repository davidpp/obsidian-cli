// Get note command

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { outputSuccess, outputError } from '../utils/output';
import type { CommandOptions } from '../api/types';

export async function getCommand(
  path: string,
  options: CommandOptions
): Promise<void> {
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);
    const note = await restClient.getNote(path);

    outputSuccess('get', note, undefined, vaultName);
  } catch (error) {
    outputError('get', error as Error, vaultName);
  }
}
