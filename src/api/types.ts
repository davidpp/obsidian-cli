// Type definitions for Obsidian Local REST API and CLI

export interface VaultConfig {
  restApi: {
    baseUrl: string;
    apiKey: string;
  };
  omnisearch?: {
    enabled: boolean;
    baseUrl: string;
  };
}

export interface Config {
  defaultVault: string;
  vaults: Record<string, VaultConfig>;
}

export interface Note {
  path: string;
  content: string;
  frontmatter?: Record<string, any>;
  tags?: string[];
  stat?: {
    ctime: number;
    mtime: number;
    size: number;
  };
}

export interface SearchResult {
  score: number;
  path: string;
  excerpt?: string;
  matches?: string[];
  vault?: string;
}

export interface OmnisearchResult {
  score: number;
  path: string;
  basename: string;
  foundWords: string[];
  matches: Array<{
    match: string;
    offset: number;
  }>;
  content?: string;
  excerpt?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  operation: string;
  vault?: string;
  result?: T;
  results?: T[];
  error?: string;
  meta?: {
    count?: number;
    source?: string;
    executionTime?: number;
    [key: string]: any;
  };
}

export interface PatchOperation {
  targetType: 'heading' | 'line' | 'frontmatter' | 'append' | 'prepend';
  target?: string | number;
  operation: 'append' | 'prepend' | 'replace' | 'delete';
  content?: string;
}

export interface FileList {
  files: string[];
  folders?: string[];
}

export interface CommandOptions {
  vault?: string;
  limit?: number;
  chars?: number;
  format?: 'json' | 'text';
  [key: string]: any;
}
