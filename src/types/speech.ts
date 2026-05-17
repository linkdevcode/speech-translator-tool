export type AppListeningState = "idle" | "listening";

export interface LanguageOption {
  code: string;
  label: string;
  speechLocale: string;
}

export interface SpeechRecognitionHookState {
  isSupported: boolean;
  listeningState: AppListeningState;
  finalTranscript: string;
  interimTranscript: string;
  error: string | null;
}
