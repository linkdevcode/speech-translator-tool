import { RateLimitError } from "@/lib/errors/rate-limit-error";
import { vi } from "@/lib/i18n/vi";
import {
  extractInterpreterStreamDisplay,
  parseInterpreterResponse,
} from "@/lib/gemini/parse-interpreter-response";
import type {
  InterpreterResult,
  TranslateErrorResponse,
} from "@/types/translate";

const MAX_RETRIES = 3;
const BASE_RETRY_MS = 2000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export interface InterpreterTextOptions {
  signal?: AbortSignal;
  languageACode: string;
  languageBCode: string;
  onRetry?: (attempt: number, delayMs: number) => void;
  onStreamUpdate?: (display: InterpreterResult) => void;
}

export async function interpreterText(
  text: string,
  options: InterpreterTextOptions,
): Promise<InterpreterResult> {
  const { signal, languageACode, languageBCode, onRetry, onStreamUpdate } =
    options;

  try {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      let response: Response;

      try {
        response = await fetch("/api/interpreter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, languageACode, languageBCode }),
          signal,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw error;
        }

        throw new Error(vi.errors.networkInterpreter);
      }

      if (response.status === 429) {
        if (attempt < MAX_RETRIES) {
          const retryDelayMs = BASE_RETRY_MS * 2 ** attempt;
          onRetry?.(attempt + 1, retryDelayMs);
          await delay(retryDelayMs);
          continue;
        }

        throw new RateLimitError(vi.errors.rateLimit);
      }

      if (!response.ok) {
        let message: string = vi.errors.interpreterGeneric;

        try {
          const body = (await response.json()) as TranslateErrorResponse;
          if (body.error) {
            message = body.error;
          }
        } catch {
          // keep default
        }

        throw new Error(message);
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error(vi.errors.streamUnsupported);
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

          const display = extractInterpreterStreamDisplay(
            accumulated,
            languageACode,
            languageBCode,
          );

          if (display.translation.trim() || display.pinyin) {
            onStreamUpdate?.({
              detectedLanguageCode: display.detectedLanguageCode,
              translation: display.translation.trim(),
              pinyin: display.pinyin,
            });
          }
        }

        accumulated += decoder.decode();

        const finalResult = parseInterpreterResponse(
          accumulated,
          languageACode,
          languageBCode,
        );

        if (!finalResult.translation?.trim()) {
          throw new Error(
            accumulated.trim()
              ? vi.errors.parseInterpreter
              : vi.errors.emptyTranslation,
          );
        }

        return {
          detectedLanguageCode: finalResult.detectedLanguageCode,
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

    throw new Error(vi.errors.interpreterFailed);
  }
}
