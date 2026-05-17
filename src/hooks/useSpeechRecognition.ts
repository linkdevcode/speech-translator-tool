"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getSpeechRecognitionConstructor } from "@/lib/speech/get-speech-recognition";
import { normalizeSpeechText } from "@/lib/speech/normalize-transcript";
import { cancelNeuralSpeech } from "@/lib/speech/play-neural-tts";
import { unlockIosAudioPlayback } from "@/lib/speech/unlock-ios-audio";
import type { AppListeningState } from "@/types/speech";

const SILENCE_DEBOUNCE_MS = 600;

export interface UseSpeechRecognitionOptions {
  lang: string;
  onFinalTranscript?: (text: string) => void;
  /** Fired when the user speaks (any STT result). Use to cancel overlapping TTS. */
  onSpeechActivity?: () => void;
  onError?: (message: string) => void;
}

export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  listeningState: AppListeningState;
  finalTranscript: string;
  interimTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  clearTranscript: () => void;
}

function buildDisplayTranscripts(event: SpeechRecognitionEvent): {
  final: string;
  interim: string;
} {
  let final = "";
  let interim = "";

  for (let i = 0; i < event.results.length; i++) {
    const result = event.results[i];
    const transcript = result[0]?.transcript ?? "";

    if (result.isFinal) {
      final += transcript;
    } else {
      interim += transcript;
    }
  }

  return {
    final: normalizeSpeechText(final),
    interim: interim.trim(),
  };
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions,
): UseSpeechRecognitionReturn {
  const { lang, onFinalTranscript, onSpeechActivity, onError } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [listeningState, setListeningState] =
    useState<AppListeningState>("idle");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningEnabledRef = useRef(false);
  const langRef = useRef(lang);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const onSpeechActivityRef = useRef(onSpeechActivity);
  const onErrorRef = useRef(onError);
  const debounceTimerRef = useRef<number | null>(null);
  const pendingInterimRef = useRef("");

  const reportError = useCallback((message: string) => {
    setError(message);
    onErrorRef.current?.(message);
  }, []);

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const resetLiveTranscript = useCallback(() => {
    setFinalTranscript("");
    setInterimTranscript("");
    pendingInterimRef.current = "";
  }, []);

  const commitUtterance = useCallback(
    (raw: string) => {
      clearDebounce();

      const normalized = normalizeSpeechText(raw);
      if (!normalized) {
        return;
      }

      onFinalTranscriptRef.current?.(normalized);
      resetLiveTranscript();
    },
    [clearDebounce, resetLiveTranscript],
  );

  const scheduleInterimFlush = useCallback(() => {
    clearDebounce();

    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      const pending = pendingInterimRef.current;
      pendingInterimRef.current = "";

      if (pending) {
        commitUtterance(pending);
      }
    }, SILENCE_DEBOUNCE_MS);
  }, [clearDebounce, commitUtterance]);

  const flushPendingInterim = useCallback(() => {
    clearDebounce();

    if (pendingInterimRef.current) {
      commitUtterance(pendingInterimRef.current);
    }
  }, [clearDebounce, commitUtterance]);

  useEffect(() => {
    langRef.current = lang;
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.lang = lang;
    }
  }, [lang]);

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    onSpeechActivityRef.current = onSpeechActivity;
  }, [onSpeechActivity]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    setIsSupported(getSpeechRecognitionConstructor() !== null);
  }, []);

  useEffect(() => {
    return () => {
      clearDebounce();
    };
  }, [clearDebounce]);

  const restartRecognition = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition || !isListeningEnabledRef.current) {
      return;
    }

    try {
      recognition.start();
    } catch {
      // start() may throw if already active; safe on iOS overlap
    }
  }, []);

  useEffect(() => {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) {
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = langRef.current;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setListeningState("listening");
      setError(null);
    };

    recognition.onresult = (event) => {
      try {
        onSpeechActivityRef.current?.();

        let newFinalSegment = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? "";

          if (result.isFinal) {
            newFinalSegment += transcript;
          }
        }

        const { final: displayFinal, interim: displayInterim } =
          buildDisplayTranscripts(event);

        setFinalTranscript(displayFinal);
        setInterimTranscript(displayInterim);

        if (newFinalSegment.trim()) {
          commitUtterance(newFinalSegment);
          return;
        }

        if (displayInterim) {
          pendingInterimRef.current = displayInterim;
          scheduleInterimFlush();
        } else {
          pendingInterimRef.current = "";
          clearDebounce();
        }
      } catch {
        reportError("Could not process speech recognition result.");
      }
    };

    recognition.onerror = (event) => {
      try {
        if (event.error === "aborted" || event.error === "no-speech") {
          return;
        }

        if (event.error === "not-allowed") {
          isListeningEnabledRef.current = false;
          setListeningState("idle");
          clearDebounce();
          reportError(
            "Microphone permission denied. Please allow access and try again.",
          );
          return;
        }

        reportError(`Speech recognition error: ${event.error}`);
      } catch {
        reportError("Speech recognition encountered an unexpected error.");
      }
    };

    recognition.onend = () => {
      flushPendingInterim();

      if (isListeningEnabledRef.current) {
        setListeningState("listening");
        restartRecognition();
        return;
      }

      setListeningState("idle");
      resetLiveTranscript();
    };

    return () => {
      isListeningEnabledRef.current = false;
      clearDebounce();
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;

      try {
        recognition.abort();
      } catch {
        recognition.stop();
      }

      recognitionRef.current = null;
    };
  }, [
    clearDebounce,
    commitUtterance,
    flushPendingInterim,
    reportError,
    resetLiveTranscript,
    restartRecognition,
    scheduleInterimFlush,
  ]);

  const startListening = useCallback(() => {
    try {
      const recognition = recognitionRef.current;
      if (!recognition) {
        reportError("Speech recognition is not supported in this browser.");
        return;
      }

      unlockIosAudioPlayback();
      try {
        cancelNeuralSpeech();
      } catch {
        // ignore
      }

      recognition.lang = langRef.current;
      isListeningEnabledRef.current = true;
      setError(null);
      resetLiveTranscript();
      clearDebounce();

      try {
        recognition.start();
      } catch {
        restartRecognition();
      }
    } catch {
      reportError("Could not start the microphone. Please try again.");
    }
  }, [
    clearDebounce,
    reportError,
    resetLiveTranscript,
    restartRecognition,
  ]);

  const stopListening = useCallback(() => {
    isListeningEnabledRef.current = false;
    flushPendingInterim();

    const recognition = recognitionRef.current;
    if (!recognition) {
      setListeningState("idle");
      resetLiveTranscript();
      return;
    }

    try {
      recognition.stop();
    } catch {
      setListeningState("idle");
      resetLiveTranscript();
    }
  }, [flushPendingInterim, resetLiveTranscript]);

  const toggleListening = useCallback(() => {
    if (isListeningEnabledRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  const clearTranscript = useCallback(() => {
    clearDebounce();
    resetLiveTranscript();
  }, [clearDebounce, resetLiveTranscript]);

  return {
    isSupported,
    listeningState,
    finalTranscript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
  };
}
