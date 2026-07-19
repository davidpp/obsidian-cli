// Find command - structured search via JsonLogic against note metadata

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { outputResults, outputError } from '../utils/output';
import { ConfigError } from '../utils/errors';
import type { CommandOptions } from '../api/types';

export async function findCommand(query: string, options: CommandOptions): Promise<void> {
  let vaultName: string | undefined;

  try {
    try {
      JSON.parse(query);
    } catch {
      throw new ConfigError(
        'JsonLogic query must be valid JSON (e.g. \'{"in":["cli",{"var":"tags"}]}\').'
      );
    }

    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);
    const results = await restClient.searchJsonLogic(query);

    outputResults('find', results, undefined, vaultName);
  } catch (error) {
    outputError('find', error as Error, vaultName);
  }
}
