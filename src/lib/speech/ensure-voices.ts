export function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve([]);
  }

  const existing = window.speechSynthesis.getVoices();

  if (existing.length > 0) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve) => {
    const handleVoicesChanged = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          handleVoicesChanged,
        );
        resolve(voices);
      }
    };

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      handleVoicesChanged,
    );
    window.speechSynthesis.getVoices();

    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        handleVoicesChanged,
      );
      resolve(window.speechSynthesis.getVoices());
    }, 500);
  });
}
