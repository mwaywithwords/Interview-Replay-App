import { FunctionsHttpError } from '@supabase/supabase-js';

export async function parseEdgeFunctionError(
  error: unknown,
  data: unknown,
  fallbackMessage: string
): Promise<string> {
  if (data && typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>;
    if (typeof record.error === 'string' && record.error.trim()) {
      return record.error;
    }
  }

  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    try {
      const body = (await error.context.clone().json()) as { error?: unknown };
      if (typeof body?.error === 'string' && body.error.trim()) {
        return body.error;
      }
    } catch {
      // Response body was not JSON or could not be read.
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}
