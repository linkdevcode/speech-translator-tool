"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTranslationPipeline } from "@/hooks/useTranslationPipeline";
import { ensureVoicesLoaded } from "@/lib/speech/ensure-voices";
import { getLanguageByCode } from "@/lib/speech/languages";
import { ConversationHistory } from "./ConversationHistory";
import { LanguageBar } from "./LanguageBar";
import { MicButton } from "./MicButton";
import { StatusBadge } from "./StatusBadge";
import { ToastBanner } from "./ToastBanner";
import { TranscriptPanel } from "./TranscriptPanel";
import { TranslationPanel } from "./TranslationPanel";
import { UnsupportedBrowser } from "./UnsupportedBrowser";

export function TranslatorApp() {
  const [sourceCode, setSourceCode] = useState("vi");
  const [targetCode, setTargetCode] = useState("en");

  const source = useMemo(() => getLanguageByCode(sourceCode), [sourceCode]);
  const target = useMemo(() => getLanguageByCode(targetCode), [targetCode]);

  const {
    pipelineState,
    currentTranslation,
    history,
    toast,
    handleFinalTranscript,
    clearHistory,
    cancelSpeech,
  } = useTranslationPipeline({
    sourceLanguage: source.label,
    targetLanguage: target.label,
    targetLocale: target.speechLocale,
  });

  useEffect(() => {
    void ensureVoicesLoaded();
  }, []);

  const {
    isSupported,
    listeningState,
    finalTranscript,
    interimTranscript,
    error,
    toggleListening,
    clearTranscript,
  } = useSpeechRecognition({
    lang: source.speechLocale,
    onFinalTranscript: handleFinalTranscript,
    onSpeechActivity: cancelSpeech,
  });

  const handleSwap = useCallback(() => {
    setSourceCode(targetCode);
    setTargetCode(sourceCode);
    clearTranscript();
    clearHistory();
  }, [clearHistory, clearTranscript, sourceCode, targetCode]);

  const handleClearAll = useCallback(() => {
    clearTranscript();
    clearHistory();
  }, [clearHistory, clearTranscript]);

  const hasTranscript = Boolean(finalTranscript || interimTranscript);

  if (!isSupported) {
    return <UnsupportedBrowser />;
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col gap-4 px-4 py-6 pb-10">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          Voice Translator
        </h1>
        <p className="text-sm text-zinc-500">
          Speak, translate, and hear the result instantly.
        </p>
      </header>

      <LanguageBar source={source} target={target} onSwap={handleSwap} />

      <div className="flex flex-col gap-3">
        <PanelHeader
          label={source.label}
          showClear={hasTranscript || Boolean(currentTranslation) || history.length > 0}
          onClear={handleClearAll}
        />
        <TranscriptPanel
          finalTranscript={finalTranscript}
          interimTranscript={interimTranscript}
          placeholder={`Tap the mic and speak in ${source.label}…`}
        />
      </div>

      <TranslationPanel
        label={target.label}
        translation={currentTranslation}
        pipelineState={pipelineState}
        placeholder={`Translation to ${target.label} will appear here`}
      />

      <ConversationHistory entries={history} />

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {error}
        </p>
      ) : null}

      <ToastBanner message={toast} />

      <footer className="mt-auto flex flex-col items-center gap-4 pt-2">
        <StatusBadge
          listeningState={listeningState}
          pipelineState={pipelineState}
        />
        <MicButton
          listeningState={listeningState}
          onClick={toggleListening}
        />
      </footer>
    </main>
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
          Clear
        </button>
      ) : null}
    </div>
  );
}
