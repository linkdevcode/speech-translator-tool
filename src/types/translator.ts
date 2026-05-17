export type PipelineState = "idle" | "processing" | "speaking";

export type ConversationEntryStatus = "translating" | "complete" | "error";

export interface ConversationEntry {
  id: string;
  sourceText: string;
  translatedText: string;
  createdAt: number;
  status: ConversationEntryStatus;
  errorMessage?: string;
}
