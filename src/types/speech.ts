export type AppListeningState = "idle" | "listening";

export type ChineseVariant = "simplified" | "traditional" | "cantonese";

export interface LanguageOption {
  code: string;
  label: string;
  speechLocale: string;
  /** Human-readable name sent to the translation API */
  apiLanguageName: string;
  neuralVoice: string;
  chineseVariant?: ChineseVariant;
  /** UI label for romanization line (Pinyin, Jyutping, …) */
  romanizationLabel?: string;
}

export interface SpeechRecognitionHookState {
  isSupported: boolean;
  listeningState: AppListeningState;
  finalTranscript: string;
  interimTranscript: string;
  error: string | null;
}
