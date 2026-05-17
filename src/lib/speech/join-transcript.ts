import { mergeTranscriptWithDedup } from "@/lib/speech/merge-transcript";
import { normalizeSpeechText } from "@/lib/speech/normalize-transcript";

export function joinTranscriptParts(...parts: string[]): string {
  let merged = "";

  for (const part of parts) {
    merged = mergeTranscriptWithDedup(merged, part);
  }

  return normalizeSpeechText(merged);
}
