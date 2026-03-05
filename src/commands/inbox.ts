// Inbox command - List inbox items with frontmatter for triage

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { outputResults, outputError } from '../utils/output';
import type { CommandOptions, Note } from '../api/types';

export interface InboxItem {
  path: string;
  title?: string;
  source?: string;
  created_at?: string;
  type?: string;
  tags?: string[];
}

export interface InboxOptions extends CommandOptions {
  folder?: string;
}

export async function inboxCommand(options: InboxOptions): Promise<void> {
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);
    const inboxFolder = options.folder || 'inbox';

    // List all files in inbox folder
    const fileList = await restClient.listFiles(inboxFolder);
    const mdFiles = fileList.files.filter((f) => f.endsWith('.md'));

    // Get frontmatter for each file
    const items: InboxItem[] = [];

    for (const file of mdFiles) {
      const path = `${inboxFolder}/${file}`;
      try {
        const note = await restClient.getNote(path);
        items.push({
          path,
          title: note.frontmatter?.title || file.replace('.md', ''),
          source: note.frontmatter?.source,
          created_at: note.frontmatter?.created_at,
          type: note.frontmatter?.type,
          tags: note.frontmatter?.tags,
        });
      } catch (error) {
        // Skip files that can't be read
        items.push({ path, title: file.replace('.md', '') });
      }
    }

    // Sort by created_at descending (newest first)
    items.sort((a, b) => {
      if (!a.created_at && !b.created_at) return 0;
      if (!a.created_at) return 1;
      if (!b.created_at) return -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    outputResults('inbox', items, { folder: inboxFolder }, vaultName);
  } catch (error) {
    outputError('inbox', error as Error, vaultName);
  }
}
