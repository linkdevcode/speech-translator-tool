"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cancelSpeech, speakText } from "@/lib/speech/speak-text";
import { isValidTranscript } from "@/lib/translate/is-valid-transcript";
import { translateText } from "@/lib/translate/translate-text";
import type { ConversationEntry, PipelineState } from "@/types/translator";

export interface UseTranslationPipelineOptions {
  sourceLanguage: string;
  targetLanguage: string;
  targetLocale: string;
}

export interface UseTranslationPipelineReturn {
  pipelineState: PipelineState;
  currentTranslation: string;
  history: ConversationEntry[];
  toast: string | null;
  handleFinalTranscript: (text: string) => void;
  clearHistory: () => void;
  cancelSpeech: () => void;
}

export function useTranslationPipeline(
  options: UseTranslationPipelineOptions,
): UseTranslationPipelineReturn {
  const { sourceLanguage, targetLanguage, targetLocale } = options;

  const [pipelineState, setPipelineState] = useState<PipelineState>("idle");
  const [currentTranslation, setCurrentTranslation] = useState("");
  const [history, setHistory] = useState<ConversationEntry[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const isBusyRef = useRef(false);
  const requestIdRef = useRef(0);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const dismissToastLater = useCallback(() => {
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const handleFinalTranscript = useCallback(
    (text: string) => {
      if (!isValidTranscript(text) || isBusyRef.current) {
        return;
      }

      const {
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        targetLocale: locale,
      } = optionsRef.current;

      const requestId = ++requestIdRef.current;
      isBusyRef.current = true;
      cancelSpeech();
      setPipelineState("processing");
      setToast(null);

      void (async () => {
        try {
          const translation = await translateText(text, sourceLang, targetLang, {
            onRetry: (_attempt, delayMs) => {
              const seconds = Math.round(delayMs / 1000);
              setToast(`System busy, retrying in ${seconds} seconds…`);
            },
          });

          if (requestId !== requestIdRef.current) {
            return;
          }

          setCurrentTranslation(translation);
          setHistory((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              sourceText: text.trim(),
              translatedText: translation,
              createdAt: Date.now(),
            },
          ]);

          setPipelineState("speaking");
          await speakText(translation, locale);
        } catch (error) {
          if (requestId !== requestIdRef.current) {
            return;
          }

          const message =
            error instanceof Error
              ? error.message
              : "Translation could not be completed.";

          setToast(message);
          dismissToastLater();
        } finally {
          if (requestId === requestIdRef.current) {
            isBusyRef.current = false;
            setPipelineState("idle");
          }
        }
      })();
    },
    [dismissToastLater],
  );

  const clearHistory = useCallback(() => {
    requestIdRef.current += 1;
    isBusyRef.current = false;
    cancelSpeech();
    setPipelineState("idle");
    setCurrentTranslation("");
    setHistory([]);
    setToast(null);
  }, []);

  return {
    pipelineState,
    currentTranslation,
    history,
    toast,
    handleFinalTranscript,
    clearHistory,
    cancelSpeech,
  };
}
