import { unlockIosSpeechSynthesis } from "@/lib/speech/unlock-ios-tts";

/** Minimal silent MP3 — unlocks HTMLAudio playback on iOS after a user gesture. */
const SILENT_MP3 =
  "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+1DEAAAHAAGf/CAAAIgAANIAAAAQAAAaEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

let sharedAudio: HTMLAudioElement | null = null;

export function getSharedAudioElement(): HTMLAudioElement {
  if (typeof window === "undefined") {
    throw new Error("Audio is only available in the browser");
  }

  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.setAttribute("playsinline", "true");
    sharedAudio.preload = "auto";
  }

  return sharedAudio;
}

/** Call inside a user gesture (e.g. mic tap) before async neural TTS playback. */
export function unlockIosAudioPlayback(): void {
  try {
    const audio = getSharedAudioElement();
    audio.src = SILENT_MP3;
    audio.volume = 0.01;
    void audio.play().catch(() => {
      // best-effort unlock
    });
  } catch {
    // ignore
  }

  unlockIosSpeechSynthesis();
}
