"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getSpeechRecognitionConstructor } from "@/lib/speech/get-speech-recognition";
import { unlockIosSpeechSynthesis } from "@/lib/speech/unlock-ios-tts";
import type { AppListeningState } from "@/types/speech";

export interface UseSpeechRecognitionOptions {
  lang: string;
  onFinalTranscript?: (text: string) => void;
  /** Fired when the user speaks (any STT result). Use to cancel overlapping TTS. */
  onSpeechActivity?: () => void;
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

function parseResults(event: SpeechRecognitionEvent): {
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

  return { final, interim };
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions,
): UseSpeechRecognitionReturn {
  const { lang, onFinalTranscript, onSpeechActivity } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [listeningState, setListeningState] =
    useState<AppListeningState>("idle");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningEnabledRef = useRef(false);
  const sessionFinalRef = useRef("");
  const langRef = useRef(lang);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const onSpeechActivityRef = useRef(onSpeechActivity);

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
    setIsSupported(getSpeechRecognitionConstructor() !== null);
  }, []);

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
      onSpeechActivityRef.current?.();

      const { final, interim } = parseResults(event);

      if (final) {
        sessionFinalRef.current += final;
        setFinalTranscript(sessionFinalRef.current);
        onFinalTranscriptRef.current?.(final.trim());
      }

      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") {
        return;
      }

      if (event.error === "not-allowed") {
        isListeningEnabledRef.current = false;
        setListeningState("idle");
        setError(
          "Microphone permission denied. Please allow access and try again.",
        );
        return;
      }

      setError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      setInterimTranscript("");

      if (isListeningEnabledRef.current) {
        setListeningState("listening");
        restartRecognition();
        return;
      }

      setListeningState("idle");
    };

    return () => {
      isListeningEnabledRef.current = false;
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
  }, [restartRecognition]);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    unlockIosSpeechSynthesis();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    recognition.lang = langRef.current;
    isListeningEnabledRef.current = true;
    setError(null);

    try {
      recognition.start();
    } catch {
      restartRecognition();
    }
  }, [restartRecognition]);

  const stopListening = useCallback(() => {
    isListeningEnabledRef.current = false;
    setInterimTranscript("");

    const recognition = recognitionRef.current;
    if (!recognition) {
      setListeningState("idle");
      return;
    }

    try {
      recognition.stop();
    } catch {
      setListeningState("idle");
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListeningEnabledRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  const clearTranscript = useCallback(() => {
    sessionFinalRef.current = "";
    setFinalTranscript("");
    setInterimTranscript("");
  }, []);

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
