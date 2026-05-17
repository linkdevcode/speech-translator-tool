import type {
  TranslateErrorResponse,
  TranslateSuccessResponse,
} from "@/types/translate";

const MAX_RETRIES = 3;
const BASE_RETRY_MS = 2000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export interface TranslateTextOptions {
  signal?: AbortSignal;
  onRetry?: (attempt: number, delayMs: number) => void;
}

export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  options: TranslateTextOptions = {},
): Promise<string> {
  const { signal, onRetry } = options;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, sourceLanguage, targetLanguage }),
      signal,
    });

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const retryDelayMs = BASE_RETRY_MS * 2 ** attempt;
      onRetry?.(attempt + 1, retryDelayMs);
      await delay(retryDelayMs);
      continue;
    }

    if (!response.ok) {
      let message = "Translation failed";

      try {
        const body = (await response.json()) as TranslateErrorResponse;
        if (body.error) {
          message = body.error;
        }
      } catch {
        // use default message
      }

      throw new Error(message);
    }

    const data = (await response.json()) as TranslateSuccessResponse;

    if (!data.translation?.trim()) {
      throw new Error("Empty translation received");
    }

    return data.translation.trim();
  }

  throw new Error("Translation service is busy. Please try again.");
}
