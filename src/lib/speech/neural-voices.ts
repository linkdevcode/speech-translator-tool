const DEFAULT_VOICE = "en-US-JennyNeural";

const LOCALE_VOICE_MAP: Record<string, string> = {
  "vi-VN": "vi-VN-HoaiMyNeural",
  "en-US": "en-US-JennyNeural",
  "zh-CN": "zh-CN-XiaoxiaoNeural",
  "zh-TW": "zh-TW-HsiaoChenNeural",
};

export function getNeuralVoice(localeOrVoice: string): string {
  const key = localeOrVoice.trim();

  if (key.includes("Neural")) {
    return key;
  }

  return LOCALE_VOICE_MAP[key] ?? DEFAULT_VOICE;
}
