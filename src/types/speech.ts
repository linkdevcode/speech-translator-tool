export type AppListeningState = "idle" | "listening";

export type ChineseVariant = "simplified" | "traditional";

export interface LanguageOption {
  code: string;
  label: string;
  speechLocale: string;
  /** Human-readable name sent to Gemini */
  apiLanguageName: string;
  neuralVoice: string;
  chineseVariant?: ChineseVariant;
}

export interface SpeechRecognitionHookState {
  isSupported: boolean;
  listeningState: AppListeningState;
  finalTranscript: string;
  interimTranscript: string;
  error: string | null;
}
