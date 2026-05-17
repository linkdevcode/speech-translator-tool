/** Unlocks iOS Safari speechSynthesis for later async playback. Call inside a user gesture. */
export function unlockIosSpeechSynthesis(): void {
  try {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
  } catch {
    // unlock is best-effort inside user gesture
  }
}
