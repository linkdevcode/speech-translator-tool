export function pickVoiceForLocale(
  voices: SpeechSynthesisVoice[],
  locale: string,
): SpeechSynthesisVoice | null {
  if (voices.length === 0) {
    return null;
  }

  const target = locale.toLowerCase();
  const languagePrefix = target.split("-")[0] ?? target;

  const exact = voices.find((voice) => voice.lang.toLowerCase() === target);
  if (exact) {
    return exact;
  }

  const regional = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith(`${languagePrefix}-`),
  );
  if (regional) {
    return regional;
  }

  const byPrefix = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith(languagePrefix),
  );
  if (byPrefix) {
    return byPrefix;
  }

  const defaultForLang = voices.find(
    (voice) => voice.default && voice.lang.toLowerCase().startsWith(languagePrefix),
  );
  if (defaultForLang) {
    return defaultForLang;
  }

  return voices.find((voice) => voice.default) ?? voices[0] ?? null;
}
