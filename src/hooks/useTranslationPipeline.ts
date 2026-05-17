"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ToastVariant } from "@/hooks/useToast";
import { RateLimitError } from "@/lib/errors/rate-limit-error";
import {
  cancelNeuralSpeech,
  playNeuralTts,
} from "@/lib/speech/play-neural-tts";
import { isValidTranscript } from "@/lib/translate/is-valid-transcript";
import { translateText } from "@/lib/translate/translate-text";
import type { ConversationEntry, PipelineState } from "@/types/translator";

export interface UseTranslationPipelineOptions {
  sourceLanguage: string;
  targetLanguage: string;
  targetLanguageCode: string;
  neuralVoice: string;
  showToast: (message: string, variant?: ToastVariant) => void;
}

export interface UseTranslationPipelineReturn {
  pipelineState: PipelineState;
  history: ConversationEntry[];
  handleFinalTranscript: (text: string) => void;
  clearHistory: () => void;
  cancelSpeech: () => void;
}

export function useTranslationPipeline(
  options: UseTranslationPipelineOptions,
): UseTranslationPipelineReturn {
  const [pipelineState, setPipelineState] = useState<PipelineState>("idle");
  const [history, setHistory] = useState<ConversationEntry[]>([]);

  const isBusyRef = useRef(false);
  const requestIdRef = useRef(0);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const updateEntry = useCallback(
    (id: string, patch: Partial<ConversationEntry>) => {
      setHistory((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
      );
    },
    [],
  );

  const handleFinalTranscript = useCallback((text: string) => {
    if (!isValidTranscript(text) || isBusyRef.current) {
      return;
    }

    const {
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      targetLanguageCode,
      neuralVoice,
      showToast,
    } = optionsRef.current;

    const entryId = crypto.randomUUID();
    const requestId = ++requestIdRef.current;
    isBusyRef.current = true;

    try {
      cancelNeuralSpeech();
    } catch {
      // ignore cancel errors
    }

    setPipelineState("processing");
    setHistory((prev) => [
      ...prev,
      {
        id: entryId,
        sourceText: text.trim(),
        translatedText: "",
        createdAt: Date.now(),
        status: "translating",
      },
    ]);

    void (async () => {
      try {
        const result = await translateText(text, sourceLang, targetLang, {
          targetLanguageCode,
          onRetry: (_attempt, delayMs) => {
            const seconds = Math.round(delayMs / 1000);
            showToast(
              `System busy, retrying in ${seconds} seconds…`,
              "warning",
            );
          },
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        updateEntry(entryId, {
          translatedText: result.translation,
          pinyin: result.pinyin,
          status: "complete",
        });

        setPipelineState("speaking");

        try {
          await playNeuralTts(result.translation, neuralVoice);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Could not play translated audio.";
          showToast(message, "error");
        }
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (error instanceof RateLimitError) {
          updateEntry(entryId, {
            status: "error",
            errorMessage: error.message,
          });
          showToast(error.message, "error");
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Translation could not be completed.";

        updateEntry(entryId, {
          status: "error",
          errorMessage: message,
        });
        showToast(message, "error");
      } finally {
        if (requestId === requestIdRef.current) {
          isBusyRef.current = false;
          setPipelineState("idle");
        }
      }
    })();
  }, [updateEntry]);

  const clearHistory = useCallback(() => {
    requestIdRef.current += 1;
    isBusyRef.current = false;

    try {
      cancelNeuralSpeech();
    } catch {
      // ignore
    }

    setPipelineState("idle");
    setHistory([]);
  }, []);

  return {
    pipelineState,
    history,
    handleFinalTranscript,
    clearHistory,
    cancelSpeech: cancelNeuralSpeech,
  };
}
