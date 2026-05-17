"use client";

import { useCallback, useMemo, useState } from "react";

import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { getLanguageByCode } from "@/lib/speech/languages";
import { LanguageBar } from "./LanguageBar";
import { MicButton } from "./MicButton";
import { StatusBadge } from "./StatusBadge";
import { TranscriptPanel } from "./TranscriptPanel";
import { UnsupportedBrowser } from "./UnsupportedBrowser";

export function TranslatorApp() {
  const [sourceCode, setSourceCode] = useState("vi");
  const [targetCode, setTargetCode] = useState("en");

  const source = useMemo(() => getLanguageByCode(sourceCode), [sourceCode]);
  const target = useMemo(() => getLanguageByCode(targetCode), [targetCode]);

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
  });

  const handleSwap = useCallback(() => {
    setSourceCode(targetCode);
    setTargetCode(sourceCode);
    clearTranscript();
  }, [clearTranscript, sourceCode, targetCode]);

  if (!isSupported) {
    return <UnsupportedBrowser />;
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col gap-5 px-4 py-6 pb-10">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          Voice Translator
        </h1>
        <p className="text-sm text-zinc-500">
          Speak naturally — your words appear below in real time.
        </p>
      </header>

      <LanguageBar source={source} target={target} onSwap={handleSwap} />

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {source.label}
          </h2>
          {finalTranscript || interimTranscript ? (
            <button
              type="button"
              onClick={clearTranscript}
              className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
            >
              Clear
            </button>
          ) : null}
        </div>

        <TranscriptPanel
          finalTranscript={finalTranscript}
          interimTranscript={interimTranscript}
          placeholder={`Tap the microphone and speak in ${source.label}…`}
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {error}
        </p>
      ) : null}

      <footer className="mt-auto flex flex-col items-center gap-4 pt-2">
        <StatusBadge listeningState={listeningState} />
        <MicButton
          listeningState={listeningState}
          onClick={toggleListening}
        />
      </footer>
    </main>
  );
}
