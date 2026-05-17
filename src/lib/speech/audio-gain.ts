/** Playback boost via Web Audio API (HTMLAudioElement.volume max is 1.0). */
const PLAYBACK_GAIN = 1.7;

let audioContext: AudioContext | null = null;
let gainNode: GainNode | null = null;
let mediaSource: MediaElementAudioSourceNode | null = null;
let connectedElement: HTMLAudioElement | null = null;

export async function resumeAudioContext(): Promise<void> {
  try {
    if (!audioContext) {
      return;
    }

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
  } catch {
    // best-effort
  }
}

export function preparePlaybackGain(audio: HTMLAudioElement): void {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    if (connectedElement !== audio) {
      try {
        mediaSource?.disconnect();
      } catch {
        // ignore
      }

      mediaSource = audioContext.createMediaElementSource(audio);
      connectedElement = audio;

      gainNode = audioContext.createGain();
      mediaSource.connect(gainNode);
      gainNode.connect(audioContext.destination);
    }

    if (gainNode) {
      gainNode.gain.value = PLAYBACK_GAIN;
    }

    void resumeAudioContext();
  } catch {
    // Fallback: rely on audio.volume only
    audio.volume = 1;
  }
}
