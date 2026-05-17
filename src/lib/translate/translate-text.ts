import { RateLimitError } from "@/lib/errors/rate-limit-error";
import type {
  TranslateErrorResponse,
  TranslateSuccessResponse,
  TranslationResult,
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
  targetLanguageCode: string;
  onRetry?: (attempt: number, delayMs: number) => void;
}

export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  options: TranslateTextOptions,
): Promise<TranslationResult> {
  const { signal, targetLanguageCode, onRetry } = options;

  try {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      let response: Response;

      try {
        response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            sourceLanguage,
            targetLanguage,
            targetLanguageCode,
          }),
          signal,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw error;
        }

        throw new Error(
          "Network error while translating. Check your connection and try again.",
        );
      }

      if (response.status === 429) {
        if (attempt < MAX_RETRIES) {
          const retryDelayMs = BASE_RETRY_MS * 2 ** attempt;
          onRetry?.(attempt + 1, retryDelayMs);
          await delay(retryDelayMs);
          continue;
        }

        throw new RateLimitError(
          "Gemini API rate limit reached (15 RPM). Please wait and try again.",
        );
      }

      if (!response.ok) {
        let message = "Translation failed";

        try {
          const body = (await response.json()) as TranslateErrorResponse;
          if (body.error) {
            message = body.error;
          }
        } catch {
          // keep default message
        }

        throw new Error(message);
      }

      try {
        const data = (await response.json()) as TranslateSuccessResponse;

        if (!data.translation?.trim()) {
          throw new Error("Empty translation received");
        }

        return {
          translation: data.translation.trim(),
          pinyin: data.pinyin?.trim() || undefined,
        };
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }

        throw new Error("Invalid translation response from server.");
      }
    }

    throw new RateLimitError();
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof Error) {
      throw error;
    }

    throw new Error("Translation could not be completed.");
  }
}
