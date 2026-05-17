export function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve([]);
  }

  try {
    const existing = window.speechSynthesis.getVoices();

    if (existing.length > 0) {
      return Promise.resolve(existing);
    }

    return new Promise((resolve) => {
      const handleVoicesChanged = () => {
        try {
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            window.speechSynthesis.removeEventListener(
              "voiceschanged",
              handleVoicesChanged,
            );
            resolve(voices);
          }
        } catch {
          resolve([]);
        }
      };

      window.speechSynthesis.addEventListener(
        "voiceschanged",
        handleVoicesChanged,
      );
      window.speechSynthesis.getVoices();

      window.setTimeout(() => {
        try {
          window.speechSynthesis.removeEventListener(
            "voiceschanged",
            handleVoicesChanged,
          );
          resolve(window.speechSynthesis.getVoices());
        } catch {
          resolve([]);
        }
      }, 500);
    });
  } catch {
    return Promise.resolve([]);
  }
}
