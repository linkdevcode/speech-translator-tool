import { parseTranslationResponse } from "@/lib/gemini/parse-translation";

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function unescapeJsonString(value: string): string {
  return value
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\\\/g, "\\");
}

function extractJsonStringField(raw: string, field: string): string {
  const regex = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
  const match = raw.match(regex);

  if (!match?.[1]) {
    return "";
  }

  return unescapeJsonString(match[1]);
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
      return {
        translation: parsed.translation,
        ...(parsed.pinyin ? { pinyin: parsed.pinyin } : {}),
      };
    }

    return { translation: plain };
  }

  const translation = extractJsonStringField(accumulated, "translation");
  const pinyin = extractJsonStringField(accumulated, "pinyin");

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
