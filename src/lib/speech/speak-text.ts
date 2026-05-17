import { ensureVoicesLoaded } from "@/lib/speech/ensure-voices";
import { pickVoiceForLocale } from "@/lib/speech/pick-voice";

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua);
}

export function cancelSpeech(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }

  window.speechSynthesis.cancel();
}

export async function speakText(
  text: string,
  locale: string,
): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    throw new Error("Text-to-speech is not supported in this browser.");
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  cancelSpeech();

  const voices = await ensureVoicesLoaded();
  const voice = pickVoiceForLocale(voices, locale);

  await new Promise<void>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = locale;

    if (voice) {
      utterance.voice = voice;
    }

    let settled = false;

    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      if (resumeTimer) {
        window.clearInterval(resumeTimer);
      }
      resolve();
    };

    const fail = (message: string) => {
      if (settled) {
        return;
      }
      settled = true;
      if (resumeTimer) {
        window.clearInterval(resumeTimer);
      }
      reject(new Error(message));
    };

    utterance.onend = finish;
    utterance.onerror = () => fail("Speech playback failed");

    let resumeTimer: number | undefined;

    if (isIosSafari()) {
      resumeTimer = window.setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          return;
        }
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }, 8000);
    }

    window.speechSynthesis.speak(utterance);

    window.setTimeout(() => {
      if (!settled && !window.speechSynthesis.speaking) {
        finish();
      }
    }, 300);
  });
}
