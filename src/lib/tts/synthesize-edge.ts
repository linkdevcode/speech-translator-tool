import { EdgeTTS } from "edge-tts-universal";

import { getNeuralVoice } from "@/lib/speech/neural-voices";

/** Edge TTS volume boost (e.g. "+35%"). Override via TTS_VOLUME in .env.local */
const TTS_VOLUME = process.env.TTS_VOLUME ?? "+35%";

export async function synthesizeNeuralSpeech(
  text: string,
  voice?: string,
): Promise<Buffer> {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error("TTS text is empty");
  }

  const resolvedVoice = voice?.trim() || getNeuralVoice("en-US");

  try {
    const tts = new EdgeTTS(trimmed, resolvedVoice, { volume: TTS_VOLUME });
    const result = await tts.synthesize();
    const arrayBuffer = await result.audio.arrayBuffer();

    return Buffer.from(arrayBuffer);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Neural TTS synthesis failed";
    throw new Error(message);
  }
}
