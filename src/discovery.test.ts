import { test, expect, beforeAll, afterAll } from 'bun:test';
import { mkdtemp, mkdir, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { discoverVaults, discoveredToVaultConfig, probeAuthenticated, resolveEndpoint } from './discovery';

let root: string;
let registryPath: string;

async function makeVault(dir: string, plugin?: object, omnisearch = false): Promise<string> {
  const vaultPath = join(root, dir);
  await mkdir(vaultPath, { recursive: true });
  if (plugin) {
    const p = join(vaultPath, '.obsidian', 'plugins', 'obsidian-local-rest-api');
    await mkdir(p, { recursive: true });
    await writeFile(join(p, 'data.json'), JSON.stringify(plugin));
  }
  if (omnisearch) {
    await mkdir(join(vaultPath, '.obsidian', 'plugins', 'omnisearch'), { recursive: true });
  }
  return vaultPath;
}

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'obsidian-cli-test-'));

  const secure = await makeVault('work', { port: 27124, apiKey: 'secure-key', enableSecureServer: true }, true);
  const insecure = await makeVault('scratch', {
    apiKey: 'insecure-key',
    enableSecureServer: false,
    enableInsecureServer: true,
    insecurePort: 27123,
  });
  const noPlugin = await makeVault('perso', undefined, true);
  const noKey = await makeVault('empty', { enableSecureServer: true });

  registryPath = join(root, 'obsidian.json');
  await writeFile(
    registryPath,
    JSON.stringify({
      vaults: {
        aaaa1111: { path: secure, open: true },
        bbbb2222: { path: insecure },
        cccc3333: { path: noPlugin },
        dddd4444: { path: noKey },
      },
    })
  );
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

test('discovers secure vault with https baseUrl and marks it available + open', async () => {
  const vaults = await discoverVaults(registryPath);
  const work = vaults.find((v) => v.name === 'work')!;
  expect(work.available).toBe(true);
  expect(work.open).toBe(true);
  expect(work.omnisearch).toBe(true);
  expect(work.restApi).toEqual({ baseUrl: 'https://127.0.0.1:27124', apiKey: 'secure-key' });
});

test('derives http baseUrl for insecure-only vault', async () => {
  const vaults = await discoverVaults(registryPath);
  const scratch = vaults.find((v) => v.name === 'scratch')!;
  expect(scratch.restApi).toEqual({ baseUrl: 'http://127.0.0.1:27123', apiKey: 'insecure-key' });
});

test('marks vault without REST plugin as unavailable with a reason', async () => {
  const vaults = await discoverVaults(registryPath);
  const perso = vaults.find((v) => v.name === 'perso')!;
  expect(perso.available).toBe(false);
  expect(perso.restApi).toBeUndefined();
  expect(perso.reason).toBe('Local REST API plugin not installed');
  expect(perso.omnisearch).toBe(true);
});

test('marks vault with plugin but no api key as unavailable', async () => {
  const vaults = await discoverVaults(registryPath);
  const empty = vaults.find((v) => v.name === 'empty')!;
  expect(empty.available).toBe(false);
  expect(empty.reason).toBe('Local REST API plugin has no API key set');
});

test('returns empty array when registry is missing', async () => {
  const vaults = await discoverVaults(join(root, 'nope.json'));
  expect(vaults).toEqual([]);
});

test('discoveredToVaultConfig produces a usable VaultConfig', async () => {
  const vaults = await discoverVaults(registryPath);
  const cfg = discoveredToVaultConfig(vaults.find((v) => v.name === 'work')!);
  expect(cfg.restApi.apiKey).toBe('secure-key');
  expect(cfg.vaultPath).toContain('work');
  expect(cfg.omnisearch).toEqual({ enabled: true, baseUrl: 'http://localhost:51361' });
});

test('probeAuthenticated returns true only when the server accepts the key', async () => {
  // Mimics the plugin's GET / -> { authenticated } behaviour.
  const server = Bun.serve({
    port: 0,
    fetch(req) {
      const ok = req.headers.get('authorization') === 'Bearer good-key';
      return Response.json({ status: 'OK', authenticated: ok });
    },
  });
  const baseUrl = `http://127.0.0.1:${server.port}`;
  try {
    expect(await probeAuthenticated(baseUrl, 'good-key')).toBe(true);
    expect(await probeAuthenticated(baseUrl, 'wrong-key')).toBe(false);
    expect(await probeAuthenticated('http://127.0.0.1:1', 'good-key')).toBe(false);
    // Declared endpoint accepts the key, so resolveEndpoint returns it without scanning.
    expect(await resolveEndpoint('good-key', baseUrl)).toEqual({ baseUrl, ok: true });
  } finally {
    server.stop(true);
  }
});

test('disambiguates duplicate folder names with an id suffix', async () => {
  const dupRoot = await mkdtemp(join(tmpdir(), 'obsidian-cli-dup-'));
  const reg = join(dupRoot, 'obsidian.json');
  await writeFile(
    reg,
    JSON.stringify({
      vaults: {
        aaaa1111: { path: join(dupRoot, 'a', 'notes') },
        bbbb2222: { path: join(dupRoot, 'b', 'notes') },
      },
    })
  );
  const vaults = await discoverVaults(reg);
  const names = vaults.map((v) => v.name).sort();
  expect(names).toEqual(['notes-aaaa', 'notes-bbbb']);
  await rm(dupRoot, { recursive: true, force: true });
});
