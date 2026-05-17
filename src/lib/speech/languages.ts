import type { LanguageOption } from "@/types/speech";

export const LANGUAGES: LanguageOption[] = [
  { code: "vi", label: "Tiếng Việt", speechLocale: "vi-VN" },
  { code: "en", label: "English", speechLocale: "en-US" },
];

export function getLanguageByCode(code: string): LanguageOption {
  return (
    LANGUAGES.find((lang) => lang.code === code) ??
    LANGUAGES[0]!
  );
}
