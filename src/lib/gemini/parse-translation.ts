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

  return unescapeJsonString(match[1]).trim();
}

function extractJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");

  if (start < 0) {
    return null;
  }

  let depth = 0;

  for (let i = start; i < raw.length; i++) {
    const char = raw[i];

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return raw.slice(start, i + 1);
      }
    }
  }

  return null;
}

function parseChineseJsonPayload(raw: string): ParsedTranslation | null {
  const cleaned = stripCodeFences(raw);
  const jsonBlob = extractJsonObject(cleaned) ?? cleaned;

  try {
    const parsed = JSON.parse(jsonBlob) as {
      translation?: string;
      pinyin?: string;
    };

    const translation = parsed.translation?.trim();

    if (!translation) {
      return null;
    }

    return {
      translation,
      pinyin: parsed.pinyin?.trim() || undefined,
    };
  } catch {
    const translation = extractJsonStringField(jsonBlob, "translation");
    const pinyin = extractJsonStringField(jsonBlob, "pinyin");

    if (!translation) {
      return null;
    }

    return {
      translation,
      ...(pinyin ? { pinyin } : {}),
    };
  }
}

function looksLikeChineseJsonPayload(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith("{") && trimmed.includes('"translation"');
}

export function parseTranslationResponse(
  raw: string,
  expectsJson: boolean,
): ParsedTranslation {
  const cleaned = stripCodeFences(raw);

  if (!expectsJson) {
    if (looksLikeChineseJsonPayload(cleaned)) {
      const parsed = parseChineseJsonPayload(cleaned);

      if (parsed) {
        return parsed;
      }
    }

    return { translation: cleaned };
  }

  const parsed = parseChineseJsonPayload(cleaned);

  if (parsed) {
    return parsed;
  }

  if (looksLikeChineseJsonPayload(cleaned)) {
    return { translation: "" };
  }

  return { translation: cleaned };
}
