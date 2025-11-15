// Config management command

import {
  loadConfig,
  addVault,
  removeVault,
  setDefaultVault,
  listVaults,
  getConfigPath,
} from '../config';
import { outputSuccess, outputError } from '../utils/output';
import type { CommandOptions, VaultConfig } from '../api/types';

export async function configCommand(options: CommandOptions): Promise<void> {
  try {
    // List vaults
    if (options.list) {
      const vaults = await listVaults();
      const config = await loadConfig();

      outputSuccess('config.list', {
        vaults,
        defaultVault: config.defaultVault,
        configPath: getConfigPath(),
      });
    }
    // Add vault
    else if (options.add && options.name) {
      const vaultConfig: VaultConfig = {
        restApi: {
          baseUrl: (options.baseUrl as string) || 'http://127.0.0.1:27123',
          apiKey: (options.apiKey as string) || '',
        },
        omnisearch: {
          enabled: options.omnisearch !== false,
          baseUrl: (options.omnisearchUrl as string) || 'http://localhost:51361',
        },
      };

      await addVault(options.name as string, vaultConfig);

      outputSuccess('config.add', {
        vault: options.name,
        added: true,
      });
    }
    // Remove vault
    else if (options.remove && options.name) {
      await removeVault(options.name as string);

      outputSuccess('config.remove', {
        vault: options.name,
        removed: true,
      });
    }
    // Set default vault
    else if (options.default && options.name) {
      await setDefaultVault(options.name as string);

      outputSuccess('config.default', {
        defaultVault: options.name,
      });
    }
    // Show config path
    else if (options.path) {
      outputSuccess('config.path', {
        configPath: getConfigPath(),
      });
    } else {
      throw new Error(
        'Must specify --list, --add, --remove, --default, or --path operation'
      );
    }
  } catch (error) {
    outputError('config', error as Error);
  }
}
