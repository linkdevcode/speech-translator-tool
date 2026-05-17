import type { ChineseVariant } from "@/types/speech";

const CHINESE_SCRIPT: Record<ChineseVariant, string> = {
  simplified: "Simplified zh-CN. Mainland vocab.",
  traditional: "Traditional zh-TW. Taiwan vocab.",
};

/** Minimal prompts for low-latency streaming translation. */
export function buildStreamingTranslationPrompt(
  sourceLanguage: string,
  targetLanguage: string,
  options?: { chineseVariant?: ChineseVariant },
): string {
  const { chineseVariant } = options ?? {};

  if (chineseVariant) {
    return `Translate ${sourceLanguage}→${targetLanguage}. ${CHINESE_SCRIPT[chineseVariant]} JSON only: {"translation":"","pinyin":""}. Tone-marked pinyin. No extra text.`;
  }

  return `Translate ${sourceLanguage}→${targetLanguage}. Output ONLY the translation. No quotes, labels, or explanation.`;
}

/** @deprecated Use buildStreamingTranslationPrompt for API routes. */
export function buildTranslationSystemPrompt(
  sourceLanguage: string,
  targetLanguage: string,
  options?: { chineseVariant?: ChineseVariant },
): string {
  return buildStreamingTranslationPrompt(
    sourceLanguage,
    targetLanguage,
    options,
  );
}
