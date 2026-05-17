"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getSpeechRecognitionConstructor } from "@/lib/speech/get-speech-recognition";
import { joinTranscriptParts } from "@/lib/speech/join-transcript";
import { collapseTranscriptRepetition } from "@/lib/speech/merge-transcript";
import { normalizeSpeechText } from "@/lib/speech/normalize-transcript";
import { cancelNeuralSpeech } from "@/lib/speech/play-neural-tts";
import { unlockIosAudioPlayback } from "@/lib/speech/unlock-ios-audio";
import type { AppListeningState } from "@/types/speech";

/** Promote interim text into the session buffer after a short pause (no translate). */
const INTERIM_MERGE_DEBOUNCE_MS = 600;

export interface UseSpeechRecognitionOptions {
  lang: string;
  /** Called once when the user stops the mic with the full session transcript. */
  onFinalTranscript?: (text: string) => void;
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

/** Current non-final text in this recognition pass (replaces prior interim). */
function buildCurrentInterimSnapshot(event: SpeechRecognitionEvent): string {
  let interim = "";

  for (let i = 0; i < event.results.length; i++) {
    const result = event.results[i];

    if (!result.isFinal) {
      interim += result[0]?.transcript ?? "";
    }
  }

  return interim.trim();
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
  const sessionAccumulatedRef = useRef("");
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

  const updateLiveDisplay = useCallback(() => {
    setFinalTranscript(sessionAccumulatedRef.current);
    setInterimTranscript(pendingInterimRef.current);
  }, []);

  const appendToSession = useCallback((raw: string) => {
    const piece = normalizeSpeechText(raw);
    if (!piece) {
      return;
    }

    sessionAccumulatedRef.current = joinTranscriptParts(
      sessionAccumulatedRef.current,
      piece,
    );
    updateLiveDisplay();
  }, [updateLiveDisplay]);

  const mergePendingInterimIntoSession = useCallback(() => {
    if (!pendingInterimRef.current.trim()) {
      return;
    }

    appendToSession(pendingInterimRef.current);
    pendingInterimRef.current = "";
    setInterimTranscript("");
  }, [appendToSession]);

  const flushSessionForTranslation = useCallback(() => {
    clearDebounce();
    mergePendingInterimIntoSession();

    const fullSession = collapseTranscriptRepetition(
      sessionAccumulatedRef.current,
    );
    sessionAccumulatedRef.current = "";
    resetLiveTranscript();

    if (fullSession) {
      onFinalTranscriptRef.current?.(fullSession);
    }
  }, [clearDebounce, mergePendingInterimIntoSession, resetLiveTranscript]);

  const scheduleInterimMerge = useCallback(() => {
    clearDebounce();

    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;

      if (!isListeningEnabledRef.current) {
        return;
      }

      mergePendingInterimIntoSession();
    }, INTERIM_MERGE_DEBOUNCE_MS);
  }, [clearDebounce, mergePendingInterimIntoSession]);

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

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? "";

          if (result.isFinal && transcript.trim()) {
            appendToSession(transcript);
          }
        }

        const interimSnapshot = buildCurrentInterimSnapshot(event);

        if (interimSnapshot) {
          pendingInterimRef.current = interimSnapshot;
          updateLiveDisplay();
          scheduleInterimMerge();
        } else {
          pendingInterimRef.current = "";
          setInterimTranscript("");
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
          sessionAccumulatedRef.current = "";
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
      if (isListeningEnabledRef.current) {
        mergePendingInterimIntoSession();
        setListeningState("listening");
        restartRecognition();
        return;
      }

      setListeningState("idle");
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
    appendToSession,
    clearDebounce,
    mergePendingInterimIntoSession,
    reportError,
    restartRecognition,
    scheduleInterimMerge,
    updateLiveDisplay,
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
      sessionAccumulatedRef.current = "";
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
    const wasListening = isListeningEnabledRef.current;
    isListeningEnabledRef.current = false;

    const recognition = recognitionRef.current;

    if (wasListening) {
      flushSessionForTranslation();
    }

    if (!recognition) {
      setListeningState("idle");
      return;
    }

    try {
      recognition.stop();
    } catch {
      setListeningState("idle");
    }
  }, [flushSessionForTranslation]);

  const toggleListening = useCallback(() => {
    if (isListeningEnabledRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  const clearTranscript = useCallback(() => {
    clearDebounce();
    sessionAccumulatedRef.current = "";
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
