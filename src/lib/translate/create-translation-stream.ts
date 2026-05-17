import { streamGeminiTranslation } from "@/lib/translate/providers/gemini-stream";
import { streamGroqTranslation } from "@/lib/translate/providers/groq-stream";
import { isQuotaOrRateLimitError } from "@/lib/translate/providers/is-quota-error";
import type {
  TranslationProvider,
  TranslationStreamParams,
} from "@/lib/translate/providers/types";

export interface CreateTranslationStreamResult {
  stream: ReadableStream<Uint8Array>;
  provider: TranslationProvider;
}

export async function createTranslationStream(
  params: TranslationStreamParams,
): Promise<CreateTranslationStreamResult> {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY?.trim());
  const hasGroq = Boolean(process.env.GROQ_API_KEY?.trim());

  if (!hasGemini && !hasGroq) {
    throw new Error(
      "No translation API configured. Set GEMINI_API_KEY and/or GROQ_API_KEY.",
    );
  }

  if (hasGemini) {
    try {
      const stream = await streamGeminiTranslation(params);
      return { stream, provider: "gemini" };
    } catch (error) {
      if (hasGroq && isQuotaOrRateLimitError(error)) {
        console.warn(
          "[translate] Gemini quota/rate limit reached, falling back to Groq",
        );
        const stream = await streamGroqTranslation(params);
        return { stream, provider: "groq" };
      }

      throw error;
    }
  }

  const stream = await streamGroqTranslation(params);
  return { stream, provider: "groq" };
}
