// Multi-vault configuration management

import { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import type { Config, VaultConfig } from './api/types';
import { ConfigError } from './utils/errors';
import { discoverVaults, discoveredToVaultConfig } from './discovery';

const CONFIG_DIR = join(homedir(), '.config', 'obsidian-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const EMPTY_CONFIG: Config = { defaultVault: '', vaults: {} };

let cachedConfig: Config | null = null;

export interface KnownVault {
  name: string;
  config: VaultConfig;
  source: 'configured' | 'discovered';
  path?: string;
  open: boolean;
  available: boolean;
  omnisearch: boolean;
  reason?: string;
}

export async function ensureConfigDir(): Promise<void> {
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true });
  }
}

export async function loadConfig(): Promise<Config> {
  if (cachedConfig) {
    return cachedConfig;
  }

  // No config file is fine: vaults are auto-discovered from Obsidian. The file
  // only holds overrides and the default-vault preference.
  if (!existsSync(CONFIG_FILE)) {
    cachedConfig = { ...EMPTY_CONFIG };
    return cachedConfig;
  }

  try {
    const content = await readFile(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(content) as Partial<Config>;
    cachedConfig = {
      defaultVault: parsed.defaultVault ?? '',
      vaults: parsed.vaults ?? {},
    };
    return cachedConfig;
  } catch (error) {
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

// Every vault the CLI can see: auto-discovered from Obsidian, merged with any
// manual entries in config.json. Manual config wins on name collision so users
// can override a port, key, or omnisearch setting.
export async function getKnownVaults(): Promise<KnownVault[]> {
  const config = await loadConfig();
  const discovered = await discoverVaults();
  const map = new Map<string, KnownVault>();

  for (const d of discovered) {
    map.set(d.name, {
      name: d.name,
      config: discoveredToVaultConfig(d),
      source: 'discovered',
      path: d.path,
      open: d.open,
      available: d.available,
      omnisearch: d.omnisearch,
      reason: d.reason,
    });
  }

  for (const [name, vc] of Object.entries(config.vaults)) {
    const prior = map.get(name);
    const hasKey = !!vc.restApi?.apiKey;
    map.set(name, {
      name,
      config: vc,
      source: 'configured',
      path: vc.vaultPath ?? prior?.path,
      open: prior?.open ?? false,
      available: hasKey,
      omnisearch: vc.omnisearch?.enabled ?? prior?.omnisearch ?? false,
      reason: hasKey ? undefined : 'No API key configured',
    });
  }

  return [...map.values()];
}

function pickDefault(known: KnownVault[], configuredDefault: string): string {
  if (configuredDefault && known.some((v) => v.name === configuredDefault)) {
    return configuredDefault;
  }
  const open = known.find((v) => v.open && v.available);
  if (open) return open.name;
  const firstAvailable = known.find((v) => v.available);
  if (firstAvailable) return firstAvailable.name;
  return known[0]?.name ?? '';
}

export async function getDefaultVaultName(): Promise<string | null> {
  const known = await getKnownVaults();
  if (known.length === 0) return null;
  const config = await loadConfig();
  return pickDefault(known, config.defaultVault);
}

export async function getVaultConfig(
  vaultName?: string
): Promise<{ name: string; config: VaultConfig }> {
  const known = await getKnownVaults();
  if (known.length === 0) {
    throw new ConfigError(
      'No Obsidian vaults found. Open a vault in Obsidian with the Local REST API plugin enabled, or add one manually with `obsidian config --add`.'
    );
  }

  const config = await loadConfig();
  const name = vaultName || pickDefault(known, config.defaultVault);
  const vault = known.find((v) => v.name === name);

  if (!vault) {
    throw new ConfigError(
      `Vault "${name}" not found. Known vaults: ${known.map((v) => v.name).join(', ')}`
    );
  }
  if (!vault.available) {
    throw new ConfigError(
      `Vault "${name}" is not usable: ${vault.reason ?? 'Local REST API not available'}.`
    );
  }

  return { name: vault.name, config: vault.config };
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
  const known = await getKnownVaults();
  const vault = known.find((v) => v.name === name);
  if (!vault) {
    throw new ConfigError(
      `Vault "${name}" not found. Known vaults: ${known.map((v) => v.name).join(', ')}`
    );
  }
  if (!vault.available) {
    throw new ConfigError(
      `Cannot set "${name}" as default: ${vault.reason ?? 'Local REST API not available'}.`
    );
  }

  const config = await loadConfig();
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
