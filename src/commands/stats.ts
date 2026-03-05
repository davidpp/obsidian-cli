// Stats command - Vault health: inbox count, stale research, scope breakdown

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { outputSuccess, outputError } from '../utils/output';
import type { CommandOptions } from '../api/types';

export interface VaultStats {
  inbox: {
    count: number;
    oldest?: string;
  };
  research: {
    count: number;
    stale_count: number;
    stale_threshold_days: number;
  };
  resources: {
    count: number;
  };
  archive: {
    count: number;
  };
  scopes: Record<string, number>;
  total_notes: number;
}

export interface StatsOptions extends CommandOptions {
  staleDays?: number;
}

async function countFilesRecursively(
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
        const subFiles = await countFilesRecursively(restClient, fullPath);
        files.push(...subFiles);
      }
    }
  } catch (error) {
    // Folder might not exist, skip
  }

  return files;
}

export async function statsCommand(options: StatsOptions): Promise<void> {
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);
    const staleDays = options.staleDays || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - staleDays);

    // Gather stats for each folder
    const inboxFiles = await countFilesRecursively(restClient, 'inbox');
    const researchFiles = await countFilesRecursively(restClient, 'research');
    const resourceFiles = await countFilesRecursively(restClient, 'resources');
    const archiveFiles = await countFilesRecursively(restClient, 'archive');

    // Get scope breakdown and stale count
    const scopes: Record<string, number> = {};
    let staleCount = 0;
    let oldestInbox: string | undefined;
    let oldestInboxDate: Date | undefined;

    // Process inbox for oldest
    for (const path of inboxFiles) {
      try {
        const note = await restClient.getNote(path);
        const createdAt = note.frontmatter?.created_at;
        if (createdAt) {
          const noteDate = new Date(createdAt);
          if (!oldestInboxDate || noteDate < oldestInboxDate) {
            oldestInboxDate = noteDate;
            oldestInbox = createdAt;
          }
        }

        // Count scope
        const scope = note.frontmatter?.scope || 'unscoped';
        scopes[scope] = (scopes[scope] || 0) + 1;
      } catch (error) {
        // Skip
      }
    }

    // Process research for stale count and scopes
    for (const path of researchFiles) {
      try {
        const note = await restClient.getNote(path);
        const updatedAt = note.frontmatter?.updated_at || note.frontmatter?.created_at;

        if (updatedAt) {
          const noteDate = new Date(updatedAt);
          if (noteDate < cutoffDate) {
            staleCount++;
          }
        }

        // Count scope
        const scope = note.frontmatter?.scope || 'unscoped';
        scopes[scope] = (scopes[scope] || 0) + 1;
      } catch (error) {
        // Skip
      }
    }

    // Process resources for scopes
    for (const path of resourceFiles) {
      try {
        const note = await restClient.getNote(path);
        const scope = note.frontmatter?.scope || 'unscoped';
        scopes[scope] = (scopes[scope] || 0) + 1;
      } catch (error) {
        // Skip
      }
    }

    // Process archive for scopes
    for (const path of archiveFiles) {
      try {
        const note = await restClient.getNote(path);
        const scope = note.frontmatter?.scope || 'unscoped';
        scopes[scope] = (scopes[scope] || 0) + 1;
      } catch (error) {
        // Skip
      }
    }

    const stats: VaultStats = {
      inbox: {
        count: inboxFiles.length,
        oldest: oldestInbox,
      },
      research: {
        count: researchFiles.length,
        stale_count: staleCount,
        stale_threshold_days: staleDays,
      },
      resources: {
        count: resourceFiles.length,
      },
      archive: {
        count: archiveFiles.length,
      },
      scopes,
      total_notes:
        inboxFiles.length + researchFiles.length + resourceFiles.length + archiveFiles.length,
    };

    outputSuccess('stats', stats, undefined, vaultName);
  } catch (error) {
    outputError('stats', error as Error, vaultName);
  }
}
