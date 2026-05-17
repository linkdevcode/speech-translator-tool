interface LanguageDescriptor {
  code: string;
  apiLanguageName: string;
}

export function buildInterpreterPrompt(
  languageA: LanguageDescriptor,
  languageB: LanguageDescriptor,
): string {
  return `You are a two-language conversation interpreter.

Languages (use these exact codes in detectedLanguageCode):
- A: ${languageA.apiLanguageName} (code: "${languageA.code}")
- B: ${languageB.apiLanguageName} (code: "${languageB.code}")

Task:
1. Detect whether the user text is in language A or B (pick the best match; if mixed, use the dominant language).
2. Translate into the OTHER language only.

Output JSON only, no markdown:
{"detectedLanguageCode":"<A or B code>","translation":"<translated text>","romanization":"<romanization or empty>"}

Rules:
- detectedLanguageCode MUST be exactly "${languageA.code}" or "${languageB.code}".
- translation MUST be in the opposite language from detectedLanguageCode.
- If translation is in zh-CN or zh-TW: fill romanization with tone-marked Pinyin; use correct simplified/traditional script.
- If translation is in zh-HK (Cantonese): fill romanization with tone-marked Jyutping; use written Cantonese.
- If translation is NOT Chinese, set romanization to "".
- Natural conversational phrasing, not word-for-word.`;
}

export function getTargetCode(
  detectedCode: string,
  languageACode: string,
  languageBCode: string,
): string {
  if (detectedCode === languageACode) {
    return languageBCode;
  }

  return languageACode;
}
