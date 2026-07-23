import { Milliseconds } from "../aliases.js";

export async function retryWithExponentialBackoff<T>(
  options: {
    maxAttempts: number;
    baseDelayMs: Milliseconds;
    onAttempt?: (attempt: number, maxAttempts: number) => void;
  },
  operation: () => Promise<T>
): Promise<T> {
  const { maxAttempts, baseDelayMs, onAttempt } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    onAttempt?.(attempt, maxAttempts);

    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, baseDelayMs * 2 ** (attempt - 1))
        );
      }
    }
  }

  throw lastError;
}
