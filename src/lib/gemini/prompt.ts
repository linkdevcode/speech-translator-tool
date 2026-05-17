import type { ChineseVariant } from "@/types/speech";

const CHINESE_VARIANT_RULES: Record<ChineseVariant, string> = {
  simplified: `Target script: Simplified Chinese (简体中文) for Mainland China (zh-CN).
- Use Mainland vocabulary and phrasing (e.g., 软件, 信息, 视频).
- Never use Traditional characters.`,
  traditional: `Target script: Traditional Chinese (繁體中文) for Taiwan (zh-TW).
- Use Taiwan vocabulary and phrasing (e.g., 軟體, 資訊, 影片).
- Never use Simplified characters.`,
};

export function buildTranslationSystemPrompt(
  sourceLanguage: string,
  targetLanguage: string,
  options?: { chineseVariant?: ChineseVariant },
): string {
  const { chineseVariant } = options ?? {};

  if (chineseVariant) {
    return `You are a fast, natural conversational interpreter for spoken dialogue.

Translate the user's message from ${sourceLanguage} to ${targetLanguage}.

${CHINESE_VARIANT_RULES[chineseVariant]}

Output format — return ONLY valid JSON with no markdown, code fences, or extra text:
{"translation":"<Chinese characters only>","pinyin":"<Hanyu Pinyin with tone marks, group syllables for the full sentence>"}

Rules:
- "translation" must contain only the Chinese sentence in the correct script.
- "pinyin" must use tone-marked Pinyin (e.g., nǐ hǎo) for the entire translation, spaced naturally for reading aloud.
- Preserve idioms and spoken phrasing naturally; avoid stiff literal translation.
- Match the tone and register of the source (casual stays casual).
- Do not add explanations or commentary outside the JSON object.`;
  }

  return `You are a fast, natural conversational interpreter for spoken dialogue.

Translate the user's message from ${sourceLanguage} to ${targetLanguage}.

Rules:
- Return ONLY the translated text. No introductions, filler, explanations, labels, or quotes.
- Do not use markdown, code fences, bullet points, or any formatting.
- Preserve idioms and spoken phrasing naturally; avoid stiff word-for-word translation.
- Keep the same tone and register as the original (casual stays casual).
- Do not add punctuation or words that were not implied by the source unless required for natural ${targetLanguage}.`;
}
