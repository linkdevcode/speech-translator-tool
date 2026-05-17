import { RateLimitError } from "@/lib/errors/rate-limit-error";
import { isChineseLanguage } from "@/lib/speech/languages";
import type { TranslateErrorResponse, TranslationResult } from "@/types/translate";

import {
  extractStreamingDisplay,
  parseStreamedTranslation,
} from "./stream-display";

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
  onStreamUpdate?: (display: TranslationResult) => void;
}

export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  options: TranslateTextOptions,
): Promise<TranslationResult> {
  const { signal, targetLanguageCode, onRetry, onStreamUpdate } = options;
  const expectsChineseJson = isChineseLanguage(targetLanguageCode);

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

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error("Streaming translation is not supported by this browser.");
      }

      const decoder = new TextDecoder();
      let accumulated = "";

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          accumulated += decoder.decode(value, { stream: true });

          const display = extractStreamingDisplay(
            accumulated,
            expectsChineseJson,
          );

          if (display.translation.trim() || display.pinyin) {
            onStreamUpdate?.({
              translation: display.translation.trim(),
              pinyin: display.pinyin,
            });
          }
        }

        accumulated += decoder.decode();

        const finalResult = parseStreamedTranslation(
          accumulated,
          expectsChineseJson,
        );

        if (!finalResult.translation?.trim()) {
          throw new Error("Empty translation received");
        }

        return {
          translation: finalResult.translation.trim(),
          pinyin: finalResult.pinyin?.trim() || undefined,
        };
      } finally {
        reader.releaseLock();
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
