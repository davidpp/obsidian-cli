// Auto-discovery of Obsidian vaults from Obsidian's own on-disk config.
//
// Obsidian tracks every known vault in a registry file (obsidian.json), and each
// vault stores its Local REST API plugin settings (port + apiKey) inside the vault
// at .obsidian/plugins/obsidian-local-rest-api/data.json. Reading both lets the CLI
// connect to any vault without the user hand-copying keys into its own config.

import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { homedir, platform } from 'os';
import { basename, join } from 'path';
import type { VaultConfig } from './api/types';

const REST_PLUGIN = 'obsidian-local-rest-api';
const OMNISEARCH_PLUGIN = 'omnisearch';
const OMNISEARCH_URL = 'http://localhost:51361';
const DEFAULT_SECURE_PORT = 27124;
const DEFAULT_INSECURE_PORT = 27123;

export interface DiscoveredVault {
  name: string;
  path: string;
  open: boolean;
  omnisearch: boolean;
  restApi?: { baseUrl: string; apiKey: string };
  available: boolean;
  reason?: string;
}

interface ObsidianRegistry {
  vaults?: Record<string, { path: string; ts?: number; open?: boolean }>;
}

interface RestPluginData {
  port?: number;
  insecurePort?: number;
  enableInsecureServer?: boolean;
  enableSecureServer?: boolean;
  apiKey?: string;
}

// Path to Obsidian's vault registry, per platform. Returns the first that exists.
export function obsidianRegistryPath(): string | null {
  const home = homedir();
  const candidates: string[] = [];

  switch (platform()) {
    case 'darwin':
      candidates.push(join(home, 'Library', 'Application Support', 'obsidian', 'obsidian.json'));
      break;
    case 'win32':
      if (process.env.APPDATA) {
        candidates.push(join(process.env.APPDATA, 'obsidian', 'obsidian.json'));
      }
      break;
    default:
      candidates.push(join(home, '.config', 'obsidian', 'obsidian.json'));
      candidates.push(
        join(home, '.var', 'app', 'md.obsidian.Obsidian', 'config', 'obsidian', 'obsidian.json')
      );
  }

  return candidates.find((p) => existsSync(p)) ?? null;
}

async function readRestApi(
  vaultPath: string
): Promise<{ restApi?: { baseUrl: string; apiKey: string }; reason?: string }> {
  const dataPath = join(vaultPath, '.obsidian', 'plugins', REST_PLUGIN, 'data.json');
  if (!existsSync(dataPath)) {
    return { reason: 'Local REST API plugin not installed' };
  }

  let data: RestPluginData;
  try {
    data = JSON.parse(await readFile(dataPath, 'utf-8'));
  } catch {
    return { reason: 'Could not parse Local REST API plugin config' };
  }

  if (!data.apiKey) {
    return { reason: 'Local REST API plugin has no API key set' };
  }

  // The plugin defaults the secure (HTTPS) server on; prefer it over insecure.
  if (data.enableSecureServer !== false) {
    return {
      restApi: {
        baseUrl: `https://127.0.0.1:${data.port ?? DEFAULT_SECURE_PORT}`,
        apiKey: data.apiKey,
      },
    };
  }
  if (data.enableInsecureServer) {
    return {
      restApi: {
        baseUrl: `http://127.0.0.1:${data.insecurePort ?? DEFAULT_INSECURE_PORT}`,
        apiKey: data.apiKey,
      },
    };
  }

  return { reason: 'Local REST API server is disabled' };
}

function detectOmnisearch(vaultPath: string): boolean {
  return existsSync(join(vaultPath, '.obsidian', 'plugins', OMNISEARCH_PLUGIN));
}

// Read Obsidian's registry and resolve each vault's REST connection from disk.
// Accepts an explicit registryPath for testing.
export async function discoverVaults(registryPath?: string): Promise<DiscoveredVault[]> {
  const regPath = registryPath ?? obsidianRegistryPath();
  if (!regPath || !existsSync(regPath)) {
    return [];
  }

  let registry: ObsidianRegistry;
  try {
    registry = JSON.parse(await readFile(regPath, 'utf-8'));
  } catch {
    return [];
  }
  if (!registry.vaults) {
    return [];
  }

  const entries = Object.entries(registry.vaults);
  const nameCounts = new Map<string, number>();
  for (const [, v] of entries) {
    const name = basename(v.path);
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
  }

  const results: DiscoveredVault[] = [];
  for (const [id, v] of entries) {
    let name = basename(v.path);
    // Disambiguate vaults that share a folder name with a short id suffix.
    if ((nameCounts.get(name) ?? 0) > 1) {
      name = `${name}-${id.slice(0, 4)}`;
    }

    const { restApi, reason } = await readRestApi(v.path);
    results.push({
      name,
      path: v.path,
      open: v.open === true,
      omnisearch: detectOmnisearch(v.path),
      restApi,
      available: !!restApi,
      reason: restApi ? undefined : reason,
    });
  }

  return results;
}

export function discoveredToVaultConfig(d: DiscoveredVault): VaultConfig {
  return {
    restApi: d.restApi ?? { baseUrl: '', apiKey: '' },
    omnisearch: { enabled: d.omnisearch, baseUrl: OMNISEARCH_URL },
    vaultPath: d.path,
  };
}
