// Omnisearch plugin client for faster search

import type { VaultConfig, OmnisearchResult, SearchResult } from './types';
import { APIError } from '../utils/errors';

export class OmnisearchClient {
  private baseUrl: string;
  private enabled: boolean;

  constructor(config: VaultConfig) {
    this.baseUrl = config.omnisearch?.baseUrl || 'http://localhost:51361';
    this.enabled = config.omnisearch?.enabled ?? true;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async search(query: string, limit = 50): Promise<SearchResult[]> {
    if (!this.enabled) {
      throw new APIError('Omnisearch is not enabled for this vault');
    }

    try {
      const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new APIError(
          `Omnisearch request failed: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json() as OmnisearchResult[];

      // Transform Omnisearch results to our standard format
      return data.slice(0, limit).map((result) => ({
        score: result.score,
        path: result.path,
        excerpt: this.extractExcerpt(result),
        matches: result.foundWords,
      }));
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      // If Omnisearch is unavailable, throw error for fallback
      throw new APIError(
        `Failed to connect to Omnisearch: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private extractExcerpt(result: OmnisearchResult): string {
    if (result.excerpt) {
      return result.excerpt;
    }

    if (result.content && result.matches && result.matches.length > 0) {
      // Extract context around first match
      const firstMatch = result.matches[0];
      if (firstMatch) {
        const start = Math.max(0, firstMatch.offset - 100);
        const end = Math.min(result.content.length, firstMatch.offset + 100);
        let excerpt = result.content.slice(start, end);

        if (start > 0) excerpt = '...' + excerpt;
        if (end < result.content.length) excerpt = excerpt + '...';

        return excerpt;
      }
    }

    // Fallback to first 200 chars of content
    if (result.content) {
      return result.content.slice(0, 200) + (result.content.length > 200 ? '...' : '');
    }

    return '';
  }

  async testConnection(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
