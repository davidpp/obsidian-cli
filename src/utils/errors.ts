// Error handling utilities

export class ObsidianCLIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ObsidianCLIError';
  }
}

export class ConfigError extends ObsidianCLIError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
  }
}

export class VaultError extends ObsidianCLIError {
  constructor(message: string) {
    super(message, 'VAULT_ERROR');
  }
}

export class APIError extends ObsidianCLIError {
  constructor(message: string, statusCode?: number) {
    super(message, 'API_ERROR', statusCode);
  }
}

export class NotFoundError extends ObsidianCLIError {
  constructor(resource: string) {
    super(`Resource not found: ${resource}`, 'NOT_FOUND', 404);
  }
}

export function handleError(error: unknown): never {
  if (error instanceof ObsidianCLIError) {
    throw error;
  }

  if (error instanceof Error) {
    throw new ObsidianCLIError(error.message, 'UNKNOWN_ERROR');
  }

  throw new ObsidianCLIError('An unknown error occurred', 'UNKNOWN_ERROR');
}
