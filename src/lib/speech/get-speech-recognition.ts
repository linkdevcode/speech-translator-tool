export type SpeechRecognitionConstructor = new () => SpeechRecognition;

export function getSpeechRecognitionConstructor():
  | SpeechRecognitionConstructor
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  const Ctor =
    window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;

  return Ctor ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}
