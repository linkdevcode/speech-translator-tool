"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useInterpreterPipeline } from "@/hooks/useInterpreterPipeline";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useToast } from "@/hooks/useToast";
import { useTranslationPipeline } from "@/hooks/useTranslationPipeline";
import { isSpeechRecognitionSupported } from "@/lib/speech/get-speech-recognition";
import { guessLanguageFromText } from "@/lib/speech/guess-language";
import { vi } from "@/lib/i18n/vi";
import {
  getLanguageByCode,
  getRomanizationLabel,
} from "@/lib/speech/languages";
import type { AppMode } from "@/types/translator";
import { ChatTranscript } from "./ChatTranscript";
import { LanguageBar } from "./LanguageBar";
import { LanguagePairBar } from "./LanguagePairBar";
import { MicButton } from "./MicButton";
import { ModeToggle } from "./ModeToggle";
import { StatusBadge } from "./StatusBadge";
import { Toast } from "./Toast";
import { TranscriptPanel } from "./TranscriptPanel";
import { UnsupportedBrowser } from "./UnsupportedBrowser";

const MODE_STORAGE_KEY = "translator-mode";
const LAST_DETECTED_STORAGE_KEY = "translator-last-detected";

function readStoredMode(): AppMode {
  if (typeof window === "undefined") {
    return "classic";
  }

  const stored = window.localStorage.getItem(MODE_STORAGE_KEY);

  return stored === "interpreter" ? "interpreter" : "classic";
}

function readStoredLastDetected(fallback: string): string {
  if (typeof window === "undefined") {
    return fallback;
  }

  return window.localStorage.getItem(LAST_DETECTED_STORAGE_KEY) ?? fallback;
}

export function TranslatorApp() {
  const [appMode, setAppMode] = useState<AppMode>("classic");
  const [sourceCode, setSourceCode] = useState("vi");
  const [targetCode, setTargetCode] = useState("en");
  const [languageACode, setLanguageACode] = useState("vi");
  const [languageBCode, setLanguageBCode] = useState("zh-CN");
  const [lastDetectedCode, setLastDetectedCode] = useState("vi");
  const [browserSupported, setBrowserSupported] = useState<boolean | null>(null);

  const { toast, showToast, dismissToast } = useToast();

  const source = useMemo(() => getLanguageByCode(sourceCode), [sourceCode]);
  const target = useMemo(() => getLanguageByCode(targetCode), [targetCode]);
  const languageA = useMemo(
    () => getLanguageByCode(languageACode),
    [languageACode],
  );
  const languageB = useMemo(
    () => getLanguageByCode(languageBCode),
    [languageBCode],
  );

  useEffect(() => {
    setAppMode(readStoredMode());
    setLastDetectedCode(readStoredLastDetected(languageACode));
  }, [languageACode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, appMode);
    } catch {
      // ignore
    }
  }, [appMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LAST_DETECTED_STORAGE_KEY, lastDetectedCode);
    } catch {
      // ignore
    }
  }, [lastDetectedCode]);

  useEffect(() => {
    try {
      const supported = isSpeechRecognitionSupported();
      setBrowserSupported(supported);

      if (!supported) {
        showToast(vi.toast.unsupportedBrowser, "error", 8000);
      }
    } catch {
      setBrowserSupported(false);
      showToast(vi.toast.unsupportedBrowser, "error", 8000);
    }
  }, [showToast]);

  const handleDetectedLanguage = useCallback((code: string) => {
    setLastDetectedCode(code);
  }, []);

  const classicPipeline = useTranslationPipeline({
    sourceLanguage: source.apiLanguageName,
    targetLanguage: target.apiLanguageName,
    targetLanguageCode: target.code,
    neuralVoice: target.neuralVoice,
    showToast,
  });

  const interpreterPipeline = useInterpreterPipeline({
    languageACode,
    languageBCode,
    showToast,
    onDetectedLanguage: handleDetectedLanguage,
  });

  const isInterpreter = appMode === "interpreter";
  const pipelineState = isInterpreter
    ? interpreterPipeline.pipelineState
    : classicPipeline.pipelineState;
  const history = isInterpreter
    ? interpreterPipeline.history
    : classicPipeline.history;
  const clearHistory = isInterpreter
    ? interpreterPipeline.clearHistory
    : classicPipeline.clearHistory;
  const cancelSpeech = isInterpreter
    ? interpreterPipeline.cancelSpeech
    : classicPipeline.cancelSpeech;

  const handleClassicFinal = classicPipeline.handleFinalTranscript;
  const handleInterpreterFinal = interpreterPipeline.handleFinalTranscript;

  const onFinalTranscriptRef = useRef(handleClassicFinal);

  useEffect(() => {
    onFinalTranscriptRef.current = isInterpreter
      ? handleInterpreterFinal
      : handleClassicFinal;
  }, [handleClassicFinal, handleInterpreterFinal, isInterpreter]);

  const onFinalTranscript = useCallback((text: string) => {
    if (isInterpreter) {
      const guessed = guessLanguageFromText(text, languageACode, languageBCode);

      if (guessed) {
        setLastDetectedCode(guessed);
      }
    }

    onFinalTranscriptRef.current(text);
  }, [isInterpreter, languageACode, languageBCode]);

  const sttLocale = isInterpreter
    ? getLanguageByCode(lastDetectedCode).speechLocale
    : source.speechLocale;

  const listeningLanguage = isInterpreter
    ? getLanguageByCode(lastDetectedCode)
    : source;

  const handleSpeechError = useCallback(
    (message: string) => {
      showToast(message, "error");
    },
    [showToast],
  );

  const {
    isSupported,
    listeningState,
    finalTranscript,
    interimTranscript,
    toggleListening,
    clearTranscript,
  } = useSpeechRecognition({
    lang: sttLocale,
    onFinalTranscript,
    onSpeechActivity: cancelSpeech,
    onError: handleSpeechError,
  });

  const handleSwapClassic = useCallback(() => {
    try {
      setSourceCode(targetCode);
      setTargetCode(sourceCode);
      clearTranscript();
      clearHistory();
    } catch {
      showToast(vi.toast.swapFailed, "error");
    }
  }, [clearHistory, clearTranscript, showToast, sourceCode, targetCode]);

  const handleSwapPair = useCallback(() => {
    try {
      setLanguageACode(languageBCode);
      setLanguageBCode(languageACode);
      setLastDetectedCode(languageBCode);
      clearTranscript();
      clearHistory();
    } catch {
      showToast(vi.toast.swapFailed, "error");
    }
  }, [
    clearHistory,
    clearTranscript,
    languageACode,
    languageBCode,
    showToast,
  ]);

  const handleClearAll = useCallback(() => {
    try {
      clearTranscript();
      clearHistory();

      if (isInterpreter) {
        setLastDetectedCode(languageACode);
      }
    } catch {
      showToast(vi.toast.clearFailed, "error");
    }
  }, [clearHistory, clearTranscript, isInterpreter, languageACode, showToast]);

  const handleMicClick = useCallback(() => {
    try {
      toggleListening();
    } catch {
      showToast(vi.toast.micFailed, "error");
    }
  }, [showToast, toggleListening]);

  const hasTranscript = Boolean(finalTranscript || interimTranscript);
  const isUnsupported = browserSupported === false || !isSupported;

  const headerSubtitle = isInterpreter
    ? vi.app.subtitleInterpreter(languageA.label, languageB.label)
    : vi.app.subtitleClassic;

  const liveLabel = isInterpreter
    ? vi.live.labelInterpreter(listeningLanguage.label)
    : vi.live.labelClassic(source.label);

  const livePlaceholder = isInterpreter
    ? vi.live.placeholderInterpreter(languageA.label, languageB.label)
    : vi.live.placeholderClassic(source.label);

  if (browserSupported === null) {
    return (
      <main className="mx-auto flex min-h-full max-w-md items-center justify-center px-4 py-12">
        <p className="text-sm text-zinc-500">{vi.app.loading}</p>
      </main>
    );
  }

  if (isUnsupported) {
    return (
      <>
        <UnsupportedBrowser />
        <Toast toast={toast} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <>
      <main className="mx-auto flex h-dvh max-h-dvh w-full max-w-md flex-col gap-3 overflow-hidden px-4 pt-4 pb-[calc(10.5rem+env(safe-area-inset-bottom,0px))]">
        <header className="shrink-0 space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            {vi.app.title}
          </h1>
          <p className="text-sm text-zinc-500">{headerSubtitle}</p>
          <ModeToggle mode={appMode} onChange={setAppMode} />
        </header>

        <div className="shrink-0">
          {isInterpreter ? (
            <LanguagePairBar
              languageA={languageA}
              languageB={languageB}
              languageACode={languageACode}
              languageBCode={languageBCode}
              onLanguageAChange={setLanguageACode}
              onLanguageBChange={setLanguageBCode}
              onSwap={handleSwapPair}
            />
          ) : (
            <LanguageBar
              source={source}
              target={target}
              sourceCode={sourceCode}
              targetCode={targetCode}
              onSourceChange={setSourceCode}
              onTargetChange={setTargetCode}
              onSwap={handleSwapClassic}
            />
          )}
        </div>

        <section className="flex shrink-0 flex-col gap-2">
          <PanelHeader
            label={liveLabel}
            showClear={hasTranscript || history.length > 0}
            onClear={handleClearAll}
          />
          <TranscriptPanel
            finalTranscript={finalTranscript}
            interimTranscript={interimTranscript}
            placeholder={livePlaceholder}
          />
        </section>

        <ChatTranscript
          entries={history}
          sourceLabel={isInterpreter ? languageA.label : source.label}
          targetLabel={isInterpreter ? languageB.label : target.label}
          neuralVoice={isInterpreter ? languageB.neuralVoice : target.neuralVoice}
          romanizationLabel={
            isInterpreter
              ? undefined
              : getRomanizationLabel(target.code)
          }
          interpreterMode={isInterpreter}
          onPlaybackError={(message) => showToast(message, "error")}
          className="min-h-0 flex-1"
        />

        <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-zinc-100/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-2">
            {isInterpreter ? (
              <p className="text-center text-[11px] text-zinc-500">
                {vi.mic.listeningFor}{" "}
                <span className="font-medium text-zinc-700">
                  {listeningLanguage.label}
                </span>
              </p>
            ) : null}
            <StatusBadge
              listeningState={listeningState}
              pipelineState={pipelineState}
            />
            <MicButton
              listeningState={listeningState}
              onClick={handleMicClick}
              disabled={pipelineState === "processing"}
            />
          </div>
        </footer>
      </main>

      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}

function PanelHeader({
  label,
  showClear,
  onClear,
}: {
  label: string;
  showClear: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </h2>
      {showClear ? (
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
        >
          {vi.live.clear}
        </button>
      ) : null}
    </div>
  );
}
