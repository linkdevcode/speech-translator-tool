import {
  extractJsonStringFieldLoose,
  parseTranslationResponse,
} from "@/lib/gemini/parse-translation";

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function looksLikeChineseJsonPayload(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith("{") && trimmed.includes('"translation"');
}

/** Extracts displayable translation/pinyin from a partial streamed response. */
export function extractStreamingDisplay(
  accumulated: string,
  expectsChineseJson: boolean,
): { translation: string; pinyin?: string } {
  if (!expectsChineseJson) {
    const plain = stripCodeFences(accumulated);

    if (looksLikeChineseJsonPayload(plain)) {
      const parsed = parseTranslationResponse(plain, true);

      if (parsed.translation) {
        return {
          translation: parsed.translation,
          ...(parsed.pinyin ? { pinyin: parsed.pinyin } : {}),
        };
      }
    }

    return { translation: plain };
  }

  const translation = extractJsonStringFieldLoose(accumulated, "translation");
  const pinyin =
    extractJsonStringFieldLoose(accumulated, "pinyin") ||
    extractJsonStringFieldLoose(accumulated, "jyutping");

  if (translation) {
    return {
      translation,
      ...(pinyin ? { pinyin } : {}),
    };
  }

  const parsed = parseTranslationResponse(accumulated, true);

  if (parsed.translation && !looksLikeChineseJsonPayload(parsed.translation)) {
    return {
      translation: parsed.translation,
      ...(parsed.pinyin ? { pinyin: parsed.pinyin } : {}),
    };
  }

  return { translation: "" };
}

export function parseStreamedTranslation(
  accumulated: string,
  expectsChineseJson: boolean,
) {
  return parseTranslationResponse(accumulated, expectsChineseJson);
}
