export type PipelineState = "idle" | "processing" | "speaking";

export type ConversationEntryStatus = "translating" | "complete" | "error";

export type AppMode = "classic" | "interpreter";

export interface ConversationEntry {
  id: string;
  sourceText: string;
  translatedText: string;
  pinyin?: string;
  createdAt: number;
  status: ConversationEntryStatus;
  errorMessage?: string;
  /** Interpreter mode: detected spoken language */
  detectedLanguageCode?: string;
  /** Interpreter mode: translation target language */
  targetLanguageCode?: string;
  directionLabel?: string;
  detectedLabel?: string;
  targetLabel?: string;
  targetNeuralVoice?: string;
}
