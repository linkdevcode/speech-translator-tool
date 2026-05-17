import {
  extractJsonStringFieldLoose,
} from "@/lib/gemini/parse-translation";

export interface ParsedInterpreterResponse {
  detectedLanguageCode: string;
  translation: string;
  pinyin?: string;
}

function looksLikeInterpreterJson(text: string): boolean {
  const trimmed = text.trim();
  return (
    trimmed.startsWith("{") &&
    trimmed.includes('"detectedLanguageCode"') &&
    trimmed.includes('"translation"')
  );
}

function extractRomanizationLoose(raw: string): string {
  return (
    extractJsonStringFieldLoose(raw, "romanization") ||
    extractJsonStringFieldLoose(raw, "pinyin") ||
    extractJsonStringFieldLoose(raw, "jyutping")
  );
}

export function parseInterpreterResponse(
  raw: string,
  languageACode: string,
  languageBCode: string,
): ParsedInterpreterResponse {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  if (!cleaned) {
    return { detectedLanguageCode: languageACode, translation: "" };
  }

  let detectedLanguageCode = extractJsonStringFieldLoose(
    cleaned,
    "detectedLanguageCode",
  );
  const translation = extractJsonStringFieldLoose(cleaned, "translation");
  const romanization = extractRomanizationLoose(cleaned);

  if (
    detectedLanguageCode !== languageACode &&
    detectedLanguageCode !== languageBCode
  ) {
    detectedLanguageCode = languageACode;
  }

  if (translation) {
    return {
      detectedLanguageCode,
      translation,
      ...(romanization ? { pinyin: romanization } : {}),
    };
  }

  try {
    const parsed = JSON.parse(cleaned) as {
      detectedLanguageCode?: string;
      translation?: string;
      romanization?: string;
      pinyin?: string;
      jyutping?: string;
    };

    const code = parsed.detectedLanguageCode?.trim();
    const resolvedCode =
      code === languageACode || code === languageBCode
        ? code
        : languageACode;

    const resolvedTranslation = parsed.translation?.trim() ?? "";
    const rom =
      parsed.romanization?.trim() ||
      parsed.pinyin?.trim() ||
      parsed.jyutping?.trim();

    return {
      detectedLanguageCode: resolvedCode,
      translation: resolvedTranslation,
      ...(rom ? { pinyin: rom } : {}),
    };
  } catch {
    if (looksLikeInterpreterJson(cleaned)) {
      return { detectedLanguageCode: languageACode, translation: "" };
    }

    return {
      detectedLanguageCode: languageACode,
      translation: cleaned,
    };
  }
}

/** Extract partial fields while interpreter JSON is streaming. */
export function extractInterpreterStreamDisplay(
  accumulated: string,
  languageACode: string,
  languageBCode: string,
): ParsedInterpreterResponse {
  const detectedLanguageCode =
    extractJsonStringFieldLoose(accumulated, "detectedLanguageCode") ||
    languageACode;
  const translation = extractJsonStringFieldLoose(accumulated, "translation");
  const romanization = extractRomanizationLoose(accumulated);

  const resolvedDetected =
    detectedLanguageCode === languageACode ||
    detectedLanguageCode === languageBCode
      ? detectedLanguageCode
      : languageACode;

  return {
    detectedLanguageCode: resolvedDetected,
    translation,
    ...(romanization ? { pinyin: romanization } : {}),
  };
}
