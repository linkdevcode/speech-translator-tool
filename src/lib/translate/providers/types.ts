export interface TranslationStreamParams {
  text: string;
  systemInstruction: string;
  maxOutputTokens: number;
  expectsChineseJson: boolean;
}

export type TranslationProvider = "gemini" | "groq";
