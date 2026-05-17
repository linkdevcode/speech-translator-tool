"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ToastVariant } from "@/hooks/useToast";
import { getTargetCode } from "@/lib/gemini/interpreter-prompt";
import { RateLimitError } from "@/lib/errors/rate-limit-error";
import { vi } from "@/lib/i18n/vi";
import { getLanguageByCode } from "@/lib/speech/languages";
import {
  cancelNeuralSpeech,
  playNeuralTts,
} from "@/lib/speech/play-neural-tts";
import { isValidTranscript } from "@/lib/translate/is-valid-transcript";
import { interpreterText } from "@/lib/translate/interpreter-text";
import type { ConversationEntry, PipelineState } from "@/types/translator";

export interface UseInterpreterPipelineOptions {
  languageACode: string;
  languageBCode: string;
  showToast: (message: string, variant?: ToastVariant) => void;
  onDetectedLanguage?: (code: string) => void;
}

export interface UseInterpreterPipelineReturn {
  pipelineState: PipelineState;
  history: ConversationEntry[];
  handleFinalTranscript: (text: string) => void;
  clearHistory: () => void;
  cancelSpeech: () => void;
}

function buildDirectionLabel(detectedCode: string, targetCode: string): string {
  const detected = getLanguageByCode(detectedCode);
  const target = getLanguageByCode(targetCode);
  return `${detected.label} → ${target.label}`;
}

export function useInterpreterPipeline(
  options: UseInterpreterPipelineOptions,
): UseInterpreterPipelineReturn {
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

    const { languageACode, languageBCode, showToast, onDetectedLanguage } =
      optionsRef.current;

    const entryId = crypto.randomUUID();
    const requestId = ++requestIdRef.current;
    isBusyRef.current = true;

    try {
      cancelNeuralSpeech();
    } catch {
      // ignore
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
        const result = await interpreterText(text, {
          languageACode,
          languageBCode,
          onRetry: (_attempt, delayMs) => {
            const seconds = Math.round(delayMs / 1000);
            showToast(vi.toast.retryIn(seconds), "warning");
          },
          onStreamUpdate: (display) => {
            if (requestId !== requestIdRef.current) {
              return;
            }

            const targetCode = getTargetCode(
              display.detectedLanguageCode,
              languageACode,
              languageBCode,
            );

            updateEntry(entryId, {
              translatedText: display.translation,
              pinyin: display.pinyin,
              detectedLanguageCode: display.detectedLanguageCode,
              targetLanguageCode: targetCode,
              directionLabel: buildDirectionLabel(
                display.detectedLanguageCode,
                targetCode,
              ),
              detectedLabel: getLanguageByCode(
                display.detectedLanguageCode,
              ).label,
              targetLabel: getLanguageByCode(targetCode).label,
              targetNeuralVoice: getLanguageByCode(targetCode).neuralVoice,
              status: "translating",
            });
          },
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        const translation = result.translation.trim();

        if (!translation) {
          throw new Error(vi.errors.emptyTranslation);
        }

        const targetCode = getTargetCode(
          result.detectedLanguageCode,
          languageACode,
          languageBCode,
        );
        const targetLang = getLanguageByCode(targetCode);

        updateEntry(entryId, {
          translatedText: translation,
          pinyin: result.pinyin,
          detectedLanguageCode: result.detectedLanguageCode,
          targetLanguageCode: targetCode,
          directionLabel: buildDirectionLabel(
            result.detectedLanguageCode,
            targetCode,
          ),
          detectedLabel: getLanguageByCode(result.detectedLanguageCode).label,
          targetLabel: targetLang.label,
          targetNeuralVoice: targetLang.neuralVoice,
          status: "complete",
        });

        onDetectedLanguage?.(result.detectedLanguageCode);

        setPipelineState("speaking");

        try {
          await playNeuralTts(translation, targetLang.neuralVoice);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : vi.playback.translatedAudioFailed;
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
            : vi.errors.interpreterFailed;

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
