import { normalizeSpeechText } from "@/lib/speech/normalize-transcript";

export function joinTranscriptParts(...parts: string[]): string {
  const merged = parts
    .map((part) => normalizeSpeechText(part))
    .filter(Boolean)
    .join(" ");

  return normalizeSpeechText(merged);
}
