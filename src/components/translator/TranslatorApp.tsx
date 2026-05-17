"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useToast } from "@/hooks/useToast";
import { useTranslationPipeline } from "@/hooks/useTranslationPipeline";
import { isSpeechRecognitionSupported } from "@/lib/speech/get-speech-recognition";
import { getLanguageByCode } from "@/lib/speech/languages";
import { ChatTranscript } from "./ChatTranscript";
import { LanguageBar } from "./LanguageBar";
import { MicButton } from "./MicButton";
import { StatusBadge } from "./StatusBadge";
import { Toast } from "./Toast";
import { TranscriptPanel } from "./TranscriptPanel";
import { UnsupportedBrowser } from "./UnsupportedBrowser";

const UNSUPPORTED_BROWSER_MESSAGE =
  "Your browser does not support native voice recognition. Please use Google Chrome, Microsoft Edge, or Safari.";

export function TranslatorApp() {
  const [sourceCode, setSourceCode] = useState("vi");
  const [targetCode, setTargetCode] = useState("en");
  const [browserSupported, setBrowserSupported] = useState<boolean | null>(null);

  const { toast, showToast, dismissToast } = useToast();

  const source = useMemo(() => getLanguageByCode(sourceCode), [sourceCode]);
  const target = useMemo(() => getLanguageByCode(targetCode), [targetCode]);

  useEffect(() => {
    try {
      const supported = isSpeechRecognitionSupported();
      setBrowserSupported(supported);

      if (!supported) {
        showToast(UNSUPPORTED_BROWSER_MESSAGE, "error", 8000);
      }
    } catch {
      setBrowserSupported(false);
      showToast(UNSUPPORTED_BROWSER_MESSAGE, "error", 8000);
    }
  }, [showToast]);

  const {
    pipelineState,
    history,
    handleFinalTranscript,
    clearHistory,
    cancelSpeech,
  } = useTranslationPipeline({
    sourceLanguage: source.apiLanguageName,
    targetLanguage: target.apiLanguageName,
    targetLanguageCode: target.code,
    neuralVoice: target.neuralVoice,
    showToast,
  });

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
    lang: source.speechLocale,
    onFinalTranscript: handleFinalTranscript,
    onSpeechActivity: cancelSpeech,
    onError: handleSpeechError,
  });

  const handleSwap = useCallback(() => {
    try {
      setSourceCode(targetCode);
      setTargetCode(sourceCode);
      clearTranscript();
      clearHistory();
    } catch {
      showToast("Could not swap languages. Please try again.", "error");
    }
  }, [clearHistory, clearTranscript, showToast, sourceCode, targetCode]);

  const handleClearAll = useCallback(() => {
    try {
      clearTranscript();
      clearHistory();
    } catch {
      showToast("Could not clear conversation.", "error");
    }
  }, [clearHistory, clearTranscript, showToast]);

  const handleMicClick = useCallback(() => {
    try {
      toggleListening();
    } catch {
      showToast("Microphone could not be started. Please try again.", "error");
    }
  }, [showToast, toggleListening]);

  const hasTranscript = Boolean(finalTranscript || interimTranscript);
  const isUnsupported = browserSupported === false || !isSupported;

  if (browserSupported === null) {
    return (
      <main className="mx-auto flex min-h-full max-w-md items-center justify-center px-4 py-12">
        <p className="text-sm text-zinc-500">Loading…</p>
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
      <main className="mx-auto flex min-h-full w-full max-w-md flex-col gap-4 px-4 py-6 pb-28">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            Voice Translator
          </h1>
          <p className="text-sm text-zinc-500">
            Speak, translate, and hear results in a live chat view.
          </p>
        </header>

        <LanguageBar
        source={source}
        target={target}
        sourceCode={sourceCode}
        targetCode={targetCode}
        onSourceChange={setSourceCode}
        onTargetChange={setTargetCode}
        onSwap={handleSwap}
      />

        <section className="flex flex-col gap-2">
          <PanelHeader
            label={`Live · ${source.label}`}
            showClear={hasTranscript || history.length > 0}
            onClear={handleClearAll}
          />
          <TranscriptPanel
            finalTranscript={finalTranscript}
            interimTranscript={interimTranscript}
            placeholder={`Tap the mic and speak in ${source.label}…`}
          />
        </section>

        <ChatTranscript
          entries={history}
          sourceLabel={source.label}
          targetLabel={target.label}
        />

        <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-zinc-100/95 px-4 py-4 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3">
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
          Clear
        </button>
      ) : null}
    </div>
  );
}
