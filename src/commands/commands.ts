// Commands command - list Obsidian commands or run one by id

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { outputResults, outputSuccess, outputError } from '../utils/output';
import type { CommandOptions } from '../api/types';

export async function commandsCommand(options: CommandOptions): Promise<void> {
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);

    if (options.run) {
      await restClient.executeCommand(options.run as string);
      outputSuccess('commands.run', { id: options.run, executed: true }, undefined, vaultName);
      return;
    }

    const commands = await restClient.getCommands();
    outputResults('commands', commands, undefined, vaultName);
  } catch (error) {
    outputError('commands', error as Error, vaultName);
  }
}
