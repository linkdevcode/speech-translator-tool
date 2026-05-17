import type { ChineseVariant, LanguageOption } from "@/types/speech";

export const LANGUAGES: LanguageOption[] = [
  {
    code: "vi",
    label: "Tiếng Việt",
    speechLocale: "vi-VN",
    apiLanguageName: "Vietnamese",
    neuralVoice: "vi-VN-HoaiMyNeural",
  },
  {
    code: "en",
    label: "English",
    speechLocale: "en-US",
    apiLanguageName: "English",
    neuralVoice: "en-US-JennyNeural",
  },
  {
    code: "zh-CN",
    label: "中文 (简体)",
    speechLocale: "zh-CN",
    apiLanguageName: "Simplified Chinese (Mainland, zh-CN)",
    neuralVoice: "zh-CN-XiaoxiaoNeural",
    chineseVariant: "simplified",
  },
  {
    code: "zh-TW",
    label: "中文 (繁體)",
    speechLocale: "zh-TW",
    apiLanguageName: "Traditional Chinese (Taiwan, zh-TW)",
    neuralVoice: "zh-TW-HsiaoChenNeural",
    chineseVariant: "traditional",
  },
];

export function getLanguageByCode(code: string): LanguageOption {
  return LANGUAGES.find((lang) => lang.code === code) ?? LANGUAGES[0]!;
}

export function isChineseLanguage(code: string): boolean {
  return code === "zh-CN" || code === "zh-TW";
}

export function getChineseVariant(code: string): ChineseVariant | undefined {
  return getLanguageByCode(code).chineseVariant;
}
