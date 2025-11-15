// Search command with Omnisearch + REST API fallback

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { OmnisearchClient } from '../api/omnisearch';
import { outputResults, outputError } from '../utils/output';
import type { CommandOptions, SearchResult } from '../api/types';

export async function searchCommand(
  query: string,
  options: CommandOptions
): Promise<void> {
  const startTime = Date.now();
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const limit = options.limit || 50;
    let results: SearchResult[] = [];
    let source = 'rest-api';

    // Try Omnisearch first if enabled
    if (config.omnisearch?.enabled) {
      try {
        const omnisearch = new OmnisearchClient(config);
        results = await omnisearch.search(query, limit);
        source = 'omnisearch';
      } catch (error) {
        // Fallback to REST API if Omnisearch fails
        const restClient = new RestAPIClient(config);
        const files = await restClient.search(query, options.chars || 300);

        results = files.slice(0, limit).map((path) => ({
          score: 0,
          path,
        }));
        source = 'rest-api';
      }
    } else {
      // Use REST API directly
      const restClient = new RestAPIClient(config);
      const files = await restClient.search(query, options.chars || 300);

      results = files.slice(0, limit).map((path) => ({
        score: 0,
        path,
      }));
    }

    const executionTime = Date.now() - startTime;

    outputResults(
      'search',
      results,
      {
        source,
        executionTime,
      },
      vaultName
    );
  } catch (error) {
    outputError('search', error as Error, vaultName);
  }
}
