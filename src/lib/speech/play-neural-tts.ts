import { vi } from "@/lib/i18n/vi";
import {
  getSharedAudioElement,
  unlockIosAudioPlayback,
} from "@/lib/speech/unlock-ios-audio";
import { preparePlaybackGain } from "@/lib/speech/audio-gain";

let activeObjectUrl: string | null = null;

export function cancelNeuralSpeech(): void {
  try {
    if (typeof window === "undefined") {
      return;
    }

    const audio = getSharedAudioElement();
    audio.pause();
    audio.currentTime = 0;
    audio.removeAttribute("src");
    audio.load();

    if (activeObjectUrl) {
      URL.revokeObjectURL(activeObjectUrl);
      activeObjectUrl = null;
    }
  } catch {
    // ignore cancel failures
  }
}

export { unlockIosAudioPlayback };

export async function playNeuralTts(
  text: string,
  voice: string,
): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Audio playback is only available in the browser.");
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  try {
    cancelNeuralSpeech();

    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed, voice }),
    });

    if (!response.ok) {
      let message: string = vi.playback.translatedAudioFailed;

      try {
        const body = (await response.json()) as { error?: string };
        if (body.error) {
          message = body.error;
        }
      } catch {
        // use default
      }

      throw new Error(message);
    }

    const blob = await response.blob();
    activeObjectUrl = URL.createObjectURL(blob);

    const audio = getSharedAudioElement();
    audio.src = activeObjectUrl;
    audio.volume = 1;
    preparePlaybackGain(audio);

    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        audio.onended = null;
        audio.onerror = null;
      };

      audio.onended = () => {
        cleanup();
        resolve();
      };

      audio.onerror = () => {
        cleanup();
        reject(new Error(vi.errors.neuralPlayback));
      };

      void audio.play().catch((error: unknown) => {
        cleanup();
        if (error instanceof Error) {
          reject(error);
          return;
        }
        reject(new Error(vi.errors.playbackStart));
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(vi.errors.neuralPlayback);
  }
}
