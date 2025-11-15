// List files command

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { outputResults, outputError } from '../utils/output';
import type { CommandOptions } from '../api/types';

export async function listCommand(
  path: string = '',
  options: CommandOptions
): Promise<void> {
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);
    const fileList = await restClient.listFiles(path);

    outputResults('list', fileList.files, undefined, vaultName);
  } catch (error) {
    outputError('list', error as Error, vaultName);
  }
}
