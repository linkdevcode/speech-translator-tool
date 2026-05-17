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
  const regex = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`);
  const match = raw.match(regex);

  if (!match?.[1]) {
    return "";
  }

  return unescapeJsonString(match[1]);
}

/** Extracts displayable translation/pinyin from a partial streamed response. */
export function extractStreamingDisplay(
  accumulated: string,
  expectsChineseJson: boolean,
): { translation: string; pinyin?: string } {
  if (!expectsChineseJson) {
    return { translation: stripCodeFences(accumulated) };
  }

  const translation = extractJsonStringField(accumulated, "translation");
  const pinyin = extractJsonStringField(accumulated, "pinyin");

  return {
    translation,
    ...(pinyin ? { pinyin } : {}),
  };
}

export function parseStreamedTranslation(
  accumulated: string,
  expectsChineseJson: boolean,
) {
  return parseTranslationResponse(accumulated, expectsChineseJson);
}
