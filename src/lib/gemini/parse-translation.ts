export interface ParsedTranslation {
  translation: string;
  pinyin?: string;
}

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function parseTranslationResponse(
  raw: string,
  expectsJson: boolean,
): ParsedTranslation {
  const cleaned = stripCodeFences(raw);

  if (!expectsJson) {
    return { translation: cleaned };
  }

  try {
    const parsed = JSON.parse(cleaned) as {
      translation?: string;
      pinyin?: string;
    };

    const translation = parsed.translation?.trim();

    if (!translation) {
      throw new Error("Missing translation field");
    }

    return {
      translation,
      pinyin: parsed.pinyin?.trim() || undefined,
    };
  } catch {
    // Fallback: model returned plain Chinese text without JSON
    return { translation: cleaned };
  }
}
