// Delete note command

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { outputSuccess, outputError } from '../utils/output';
import type { CommandOptions } from '../api/types';

export async function deleteCommand(
  path: string,
  options: CommandOptions
): Promise<void> {
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);
    await restClient.deleteNote(path);

    outputSuccess(
      'delete',
      {
        path,
        deleted: true,
      },
      undefined,
      vaultName
    );
  } catch (error) {
    outputError('delete', error as Error, vaultName);
  }
}
