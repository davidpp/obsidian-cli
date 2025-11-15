// Obsidian Local REST API client

import type { VaultConfig, Note, FileList } from './types';
import { APIError, NotFoundError } from '../utils/errors';
import YAML from 'yaml';

export class RestAPIClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: VaultConfig) {
    this.baseUrl = config.restApi.baseUrl.replace(/\/$/, '');
    this.apiKey = config.restApi.apiKey;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      // Disable SSL verification for self-signed certificates
      const fetchOptions: RequestInit & { tls?: { rejectUnauthorized: boolean } } = {
        ...options,
        headers,
      };

      // Bun supports this for HTTPS with self-signed certs
      if (this.baseUrl.startsWith('https')) {
        fetchOptions.tls = { rejectUnauthorized: false };
      }

      const response = await fetch(url, fetchOptions as RequestInit);

      if (!response.ok) {
        if (response.status === 404) {
          throw new NotFoundError(endpoint);
        }
        const errorText = await response.text();
        throw new APIError(
          `API request failed: ${response.statusText} - ${errorText}`,
          response.status
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return (await response.json()) as T;
      }

      return (await response.text()) as T;
    } catch (error) {
      if (error instanceof APIError || error instanceof NotFoundError) {
        throw error;
      }

      throw new APIError(
        `Failed to connect to REST API: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async search(query: string, contextLength = 100): Promise<string[]> {
    const response = await this.request<{ files: string[] }>(
      `/search/simple/?query=${encodeURIComponent(query)}&contextLength=${contextLength}`
    );
    return response.files || [];
  }

  async getNote(path: string): Promise<Note> {
    const encodedPath = encodeURIComponent(path);
    const content = await this.request<string>(`/vault/${encodedPath}`);

    // Parse frontmatter if present
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    let frontmatter: Record<string, any> | undefined;
    let bodyContent = content;

    if (frontmatterMatch && frontmatterMatch[1]) {
      try {
        frontmatter = YAML.parse(frontmatterMatch[1]);
        bodyContent = content.slice(frontmatterMatch[0].length);
      } catch (error) {
        // If parsing fails, treat as regular content
      }
    }

    return {
      path,
      content: bodyContent,
      frontmatter,
    };
  }

  async createNote(path: string, content: string, frontmatter?: Record<string, any>): Promise<void> {
    let fullContent = content;

    if (frontmatter && Object.keys(frontmatter).length > 0) {
      const yamlStr = YAML.stringify(frontmatter);
      fullContent = `---\n${yamlStr}---\n\n${content}`;
    }

    const encodedPath = encodeURIComponent(path);
    await this.request(`/vault/${encodedPath}`, {
      method: 'PUT',
      body: fullContent,
      headers: {
        'Content-Type': 'text/markdown',
      },
    });
  }

  async updateNote(path: string, content: string): Promise<void> {
    const encodedPath = encodeURIComponent(path);
    await this.request(`/vault/${encodedPath}`, {
      method: 'PUT',
      body: content,
      headers: {
        'Content-Type': 'text/markdown',
      },
    });
  }

  async patchNote(path: string, content: string): Promise<void> {
    const encodedPath = encodeURIComponent(path);
    await this.request(`/vault/${encodedPath}`, {
      method: 'PATCH',
      body: content,
      headers: {
        'Content-Type': 'text/markdown',
      },
    });
  }

  async deleteNote(path: string): Promise<void> {
    const encodedPath = encodeURIComponent(path);
    await this.request(`/vault/${encodedPath}`, {
      method: 'DELETE',
    });
  }

  async listFiles(path = ''): Promise<FileList> {
    const encodedPath = path ? encodeURIComponent(path) : '';
    const endpoint = encodedPath ? `/vault/${encodedPath}/` : '/vault/';
    const response = await this.request<{ files: string[] }>(endpoint);
    return {
      files: response.files || [],
    };
  }

  async updateFrontmatter(path: string, frontmatter: Record<string, any>): Promise<void> {
    const note = await this.getNote(path);
    const yamlStr = YAML.stringify(frontmatter);
    const newContent = `---\n${yamlStr}---\n\n${note.content}`;
    await this.updateNote(path, newContent);
  }

  async getFrontmatter(path: string): Promise<Record<string, any> | null> {
    const note = await this.getNote(path);
    return note.frontmatter || null;
  }

  async appendToNote(path: string, content: string): Promise<void> {
    const note = await this.getNote(path);
    const fullContent = note.frontmatter
      ? `---\n${YAML.stringify(note.frontmatter)}---\n\n${note.content}\n\n${content}`
      : `${note.content}\n\n${content}`;
    await this.updateNote(path, fullContent);
  }

  async prependToNote(path: string, content: string): Promise<void> {
    const note = await this.getNote(path);
    const fullContent = note.frontmatter
      ? `---\n${YAML.stringify(note.frontmatter)}---\n\n${content}\n\n${note.content}`
      : `${content}\n\n${note.content}`;
    await this.updateNote(path, fullContent);
  }
}
