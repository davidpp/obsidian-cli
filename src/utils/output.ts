// JSON output formatter for AI-optimized responses

import type { APIResponse } from '../api/types';
import { ObsidianCLIError } from './errors';

export function outputJSON<T = any>(response: APIResponse<T>): void {
  console.log(JSON.stringify(response, null, 2));
}

export function outputSuccess<T = any>(
  operation: string,
  result: T,
  meta?: APIResponse['meta'],
  vault?: string
): void {
  const response: APIResponse<T> = {
    success: true,
    operation,
    vault,
    result,
    meta,
  };
  outputJSON(response);
}

export function outputResults<T = any>(
  operation: string,
  results: T[],
  meta?: APIResponse['meta'],
  vault?: string
): void {
  const response: APIResponse<T> = {
    success: true,
    operation,
    vault,
    results,
    meta: {
      ...meta,
      count: results.length,
    },
  };
  outputJSON(response);
}

export function outputError(
  operation: string,
  error: Error | ObsidianCLIError,
  vault?: string
): void {
  const response: APIResponse = {
    success: false,
    operation,
    vault,
    error: error.message,
    meta:
      error instanceof ObsidianCLIError
        ? {
            code: error.code,
            statusCode: error.statusCode,
          }
        : undefined,
  };
  outputJSON(response);
  process.exit(1);
}
