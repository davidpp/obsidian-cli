// Stale command - Find research notes older than N days

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { outputResults, outputError } from '../utils/output';
import type { CommandOptions } from '../api/types';

export interface StaleItem {
  path: string;
  title?: string;
  updated_at?: string;
  created_at?: string;
  days_stale: number;
  scope?: string;
}

export interface StaleOptions extends CommandOptions {
  days?: number;
  folder?: string;
}

async function listFilesRecursively(
  restClient: RestAPIClient,
  folder: string
): Promise<string[]> {
  const files: string[] = [];

  try {
    const result = await restClient.listFiles(folder);

    for (const item of result.files) {
      const fullPath = folder ? `${folder}/${item}` : item;

      if (item.endsWith('.md')) {
        files.push(fullPath);
      } else if (!item.includes('.')) {
        // Likely a folder, recurse
        const subFiles = await listFilesRecursively(restClient, fullPath);
        files.push(...subFiles);
      }
    }
  } catch (error) {
    // Folder might not exist, skip
  }

  return files;
}

export async function staleCommand(options: StaleOptions): Promise<void> {
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);
    const searchFolder = options.folder || 'research';
    const staleDays = options.days || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - staleDays);

    // List all files in research folder recursively
    const allFiles = await listFilesRecursively(restClient, searchFolder);

    // Check each file for staleness
    const staleItems: StaleItem[] = [];

    for (const path of allFiles) {
      try {
        const note = await restClient.getNote(path);
        const updatedAt = note.frontmatter?.updated_at || note.frontmatter?.created_at;

        if (updatedAt) {
          const noteDate = new Date(updatedAt);
          if (noteDate < cutoffDate) {
            const daysStale = Math.floor(
              (Date.now() - noteDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            staleItems.push({
              path,
              title: note.frontmatter?.title || path.split('/').pop()?.replace('.md', ''),
              updated_at: note.frontmatter?.updated_at,
              created_at: note.frontmatter?.created_at,
              days_stale: daysStale,
              scope: note.frontmatter?.scope,
            });
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    // Sort by days_stale descending (most stale first)
    staleItems.sort((a, b) => b.days_stale - a.days_stale);

    outputResults(
      'stale',
      staleItems,
      { folder: searchFolder, threshold_days: staleDays },
      vaultName
    );
  } catch (error) {
    outputError('stale', error as Error, vaultName);
  }
}
