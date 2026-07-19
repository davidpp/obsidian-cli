// Vaults command - list auto-discovered vaults and pick the default

import {
  getProbedVaults,
  getDefaultVaultName,
  setDefaultVault,
  getConfigPath,
} from '../config';
import { outputResults, outputSuccess, outputError } from '../utils/output';
import type { CommandOptions } from '../api/types';

export async function vaultsCommand(options: CommandOptions): Promise<void> {
  try {
    if (options.use) {
      await setDefaultVault(options.use as string);
      outputSuccess('vaults.use', { defaultVault: options.use });
      return;
    }

    const known = await getProbedVaults();
    const defaultName = await getDefaultVaultName();

    const results = known.map((v) => ({
      name: v.name,
      path: v.path,
      default: v.name === defaultName,
      available: v.available,
      baseUrl: v.config.restApi?.baseUrl,
      omnisearch: v.omnisearch,
      open: v.open,
      source: v.source,
      ...(v.reason ? { reason: v.reason } : {}),
    }));

    outputResults('vaults.list', results, {
      defaultVault: defaultName,
      configPath: getConfigPath(),
    });
  } catch (error) {
    outputError('vaults', error as Error);
  }
}
