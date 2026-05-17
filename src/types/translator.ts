export type PipelineState = "idle" | "processing" | "speaking";

export interface ConversationEntry {
  id: string;
  sourceText: string;
  translatedText: string;
  createdAt: number;
}
