/** Lightweight script heuristic — does not replace LLM detection. */
export function guessLanguageFromText(
  text: string,
  languageACode: string,
  languageBCode: string,
): string | null {
  const sample = text.trim();

  if (!sample) {
    return null;
  }

  const scores: Record<string, number> = {
    [languageACode]: 0,
    [languageBCode]: 0,
  };

  const vietnameseDiacritics =
    /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  const cjk = /[\u4e00-\u9fff\u3400-\u4dbf]/;
  const latin = /[a-z]/i;

  if (vietnameseDiacritics.test(sample)) {
    if (languageACode === "vi" || languageBCode === "vi") {
      const viCode = languageACode === "vi" ? languageACode : languageBCode;
      scores[viCode] = (scores[viCode] ?? 0) + 3;
    }
  }

  const cjkCount = (sample.match(cjk) ?? []).length;

  if (cjkCount > 0) {
    for (const code of [languageACode, languageBCode]) {
      if (code.startsWith("zh") || code === "yue-HK") {
        scores[code] = (scores[code] ?? 0) + cjkCount;
      }
    }
  }

  const latinCount = (sample.match(latin) ?? []).length;

  if (latinCount > 0 && !vietnameseDiacritics.test(sample)) {
    for (const code of [languageACode, languageBCode]) {
      if (code === "en") {
        scores[code] = (scores[code] ?? 0) + latinCount;
      }
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];

  if (!top || top[1] === 0) {
    return null;
  }

  return top[0];
}
