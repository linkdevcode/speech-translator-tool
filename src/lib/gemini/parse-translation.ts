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

/** Reads a JSON string value after `"field": "` — works even if JSON is truncated. */
export function extractJsonStringFieldLoose(raw: string, field: string): string {
  const closed = extractJsonStringField(raw, field);
  if (closed) {
    return closed;
  }

  const keyPattern = new RegExp(`"${field}"\\s*:\\s*"`);
  const match = keyPattern.exec(raw);

  if (!match || match.index === undefined) {
    return "";
  }

  let i = match.index + match[0].length;
  let value = "";

  while (i < raw.length) {
    const char = raw[i];

    if (char === "\\") {
      const next = raw[i + 1];

      if (next === undefined) {
        break;
      }

      if (next === "n") {
        value += "\n";
      } else if (next === "t") {
        value += "\t";
      } else {
        value += next;
      }

      i += 2;
      continue;
    }

    if (char === '"') {
      break;
    }

    value += char;
    i += 1;
  }

  return value.trim();
}

function extractJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");

  if (start < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < raw.length; i++) {
    const char = raw[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

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

function looksLikeChineseJsonPayload(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith("{") && trimmed.includes('"translation"');
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
    const translation = extractJsonStringFieldLoose(cleaned, "translation");
    const pinyin = extractJsonStringFieldLoose(cleaned, "pinyin");

    if (!translation) {
      return null;
    }

    return {
      translation,
      ...(pinyin ? { pinyin } : {}),
    };
  }
}

export function parseTranslationResponse(
  raw: string,
  expectsJson: boolean,
): ParsedTranslation {
  const cleaned = stripCodeFences(raw);

  if (!cleaned) {
    return { translation: "" };
  }

  if (!expectsJson) {
    if (looksLikeChineseJsonPayload(cleaned)) {
      const parsed = parseChineseJsonPayload(cleaned);

      if (parsed?.translation) {
        return parsed;
      }
    }

    return { translation: cleaned };
  }

  const parsed = parseChineseJsonPayload(cleaned);

  if (parsed?.translation) {
    return parsed;
  }

  if (looksLikeChineseJsonPayload(cleaned)) {
    const translation = extractJsonStringFieldLoose(cleaned, "translation");
    const pinyin = extractJsonStringFieldLoose(cleaned, "pinyin");

    if (translation) {
      return {
        translation,
        ...(pinyin ? { pinyin } : {}),
      };
    }
  }

  const plain = cleaned
    .replace(/^\s*\{[\s\S]*?"translation"\s*:\s*"/, "")
    .replace(/"\s*,\s*"pinyin"[\s\S]*$/, "")
    .replace(/"\s*\}\s*$/, "")
    .trim();

  if (plain && !plain.startsWith("{")) {
    return { translation: unescapeJsonString(plain) };
  }

  return { translation: cleaned };
}
