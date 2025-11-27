// Multi-vault configuration management

import { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import type { Config, VaultConfig } from './api/types';
import { ConfigError } from './utils/errors';

const CONFIG_DIR = join(homedir(), '.config', 'obsidian-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: Config = {
  defaultVault: 'my-vault',
  vaults: {
    'my-vault': {
      restApi: {
        baseUrl: 'http://127.0.0.1:27123',
        apiKey: '',
      },
      omnisearch: {
        enabled: true,
        baseUrl: 'http://localhost:51361',
      },
    },
  },
};

let cachedConfig: Config | null = null;

export async function ensureConfigDir(): Promise<void> {
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true });
  }
}

export async function loadConfig(): Promise<Config> {
  if (cachedConfig) {
    return cachedConfig;
  }

  await ensureConfigDir();

  if (!existsSync(CONFIG_FILE)) {
    // Create default config
    await saveConfig(DEFAULT_CONFIG);
    throw new ConfigError(
      `Configuration file created at ${CONFIG_FILE}. Please edit it with your API key and vault settings.`
    );
  }

  try {
    const content = await readFile(CONFIG_FILE, 'utf-8');
    cachedConfig = JSON.parse(content);

    if (!cachedConfig) {
      throw new ConfigError('Invalid configuration file');
    }

    return cachedConfig;
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    throw new ConfigError(
      `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function saveConfig(config: Config): Promise<void> {
  await ensureConfigDir();

  try {
    await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    cachedConfig = config;
  } catch (error) {
    throw new ConfigError(
      `Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getVaultConfig(vaultName?: string): Promise<{ name: string; config: VaultConfig }> {
  const config = await loadConfig();
  const name = vaultName || config.defaultVault;

  if (!config.vaults[name]) {
    throw new ConfigError(
      `Vault "${name}" not found in configuration. Available vaults: ${Object.keys(config.vaults).join(', ')}`
    );
  }

  return {
    name,
    config: config.vaults[name],
  };
}

export async function addVault(name: string, vaultConfig: VaultConfig): Promise<void> {
  const config = await loadConfig();

  if (config.vaults[name]) {
    throw new ConfigError(`Vault "${name}" already exists`);
  }

  config.vaults[name] = vaultConfig;
  await saveConfig(config);
}

export async function removeVault(name: string): Promise<void> {
  const config = await loadConfig();

  if (!config.vaults[name]) {
    throw new ConfigError(`Vault "${name}" not found`);
  }

  if (config.defaultVault === name) {
    throw new ConfigError(
      `Cannot remove default vault "${name}". Set a different default vault first.`
    );
  }

  delete config.vaults[name];
  await saveConfig(config);
}

export async function setDefaultVault(name: string): Promise<void> {
  const config = await loadConfig();

  if (!config.vaults[name]) {
    throw new ConfigError(`Vault "${name}" not found`);
  }

  config.defaultVault = name;
  await saveConfig(config);
}

export async function listVaults(): Promise<string[]> {
  const config = await loadConfig();
  return Object.keys(config.vaults);
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}
