"use client";

import { useEffect, useMemo, useRef } from "react";

import { LoadingDots } from "@/components/ui/LoadingDots";
import { PlaySpeechButton } from "@/components/translator/PlaySpeechButton";
import { vi } from "@/lib/i18n/vi";
import { getRomanizationLabel } from "@/lib/speech/languages";
import type { ConversationEntry } from "@/types/translator";

interface ChatTranscriptProps {
  entries: ConversationEntry[];
  sourceLabel: string;
  targetLabel: string;
  neuralVoice: string;
  romanizationLabel?: string;
  interpreterMode?: boolean;
  onPlaybackError?: (message: string) => void;
  className?: string;
}

export function ChatTranscript({
  entries,
  sourceLabel,
  targetLabel,
  neuralVoice,
  romanizationLabel,
  interpreterMode = false,
  onPlaybackError,
  className = "",
}: ChatTranscriptProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollSignature = useMemo(
    () =>
      entries
        .map(
          (entry) =>
            `${entry.id}:${entry.status}:${entry.sourceText}:${entry.translatedText}:${entry.pinyin ?? ""}:${entry.directionLabel ?? ""}`,
        )
        .join("|"),
    [entries],
  );

  useEffect(() => {
    const anchor = messagesEndRef.current;
    if (!anchor) {
      return;
    }

    try {
      anchor.scrollIntoView({ behavior: "smooth", block: "end" });
    } catch {
      const container = scrollContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [scrollSignature]);

  if (entries.length === 0) {
    return (
      <section
        className={`flex min-h-[8rem] flex-col rounded-2xl border border-dashed border-zinc-200 bg-white/80 p-5 ${className}`}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {vi.conversation.title}
        </h2>
        <p className="mt-auto text-sm leading-relaxed text-zinc-400">
          {interpreterMode
            ? vi.conversation.emptyInterpreter
            : vi.conversation.emptyClassic}
        </p>
      </section>
    );
  }

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ${className}`}
    >
      <div className="shrink-0 border-b border-zinc-100 px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {vi.conversation.title}
        </h2>
      </div>

      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-3 pb-2"
        aria-label={vi.conversation.ariaMessages}
      >
        <div className="flex flex-col gap-4 pb-3">
          {entries.map((entry) => (
            <ChatTurn
              key={entry.id}
              entry={entry}
              sourceLabel={sourceLabel}
              targetLabel={targetLabel}
              neuralVoice={neuralVoice}
              romanizationLabel={romanizationLabel}
              interpreterMode={interpreterMode}
              onPlaybackError={onPlaybackError}
            />
          ))}
          <div ref={messagesEndRef} className="h-4 w-full shrink-0" aria-hidden />
        </div>
      </div>
    </section>
  );
}

function ChatTurn({
  entry,
  sourceLabel,
  targetLabel,
  neuralVoice,
  romanizationLabel,
  interpreterMode,
  onPlaybackError,
}: {
  entry: ConversationEntry;
  sourceLabel: string;
  targetLabel: string;
  neuralVoice: string;
  romanizationLabel?: string;
  interpreterMode: boolean;
  onPlaybackError?: (message: string) => void;
}) {
  const turnSourceLabel =
    interpreterMode && entry.detectedLabel ? entry.detectedLabel : sourceLabel;
  const turnTargetLabel =
    interpreterMode && entry.targetLabel ? entry.targetLabel : targetLabel;
  const turnVoice = entry.targetNeuralVoice ?? neuralVoice;
  const turnRomanizationLabel =
    interpreterMode && entry.targetLanguageCode
      ? getRomanizationLabel(entry.targetLanguageCode)
      : romanizationLabel;

  return (
    <article className="flex flex-col gap-2">
      {interpreterMode && entry.directionLabel ? (
        <p className="text-center text-[10px] font-medium tracking-wide text-zinc-400">
          {entry.directionLabel}
        </p>
      ) : null}

      <SourceBubble label={turnSourceLabel} text={entry.sourceText} />

      {entry.status === "translating" ? (
        <TargetBubble
          label={turnTargetLabel}
          text={entry.translatedText}
          pinyin={entry.pinyin}
          isStreaming
          romanizationLabel={turnRomanizationLabel}
        />
      ) : null}

      {entry.status === "complete" && entry.translatedText ? (
        <TargetBubble
          label={turnTargetLabel}
          text={entry.translatedText}
          pinyin={entry.pinyin}
          romanizationLabel={turnRomanizationLabel}
          neuralVoice={turnVoice}
          onPlaybackError={onPlaybackError}
        />
      ) : null}

      {entry.status === "error" ? (
        <div className="flex justify-start">
          <p className="max-w-[85%] rounded-2xl rounded-bl-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
            {entry.errorMessage ?? vi.conversation.failed}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function SourceBubble({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="pr-1 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      <p className="max-w-[88%] rounded-2xl rounded-br-md bg-zinc-900 px-4 py-2.5 text-sm font-semibold leading-relaxed text-white shadow-sm">
        {text}
      </p>
    </div>
  );
}

function TargetBubble({
  label,
  text,
  pinyin,
  romanizationLabel,
  neuralVoice,
  onPlaybackError,
  isLoading = false,
  isStreaming = false,
}: {
  label: string;
  text?: string;
  pinyin?: string;
  romanizationLabel?: string;
  neuralVoice?: string;
  onPlaybackError?: (message: string) => void;
  isLoading?: boolean;
  isStreaming?: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex w-full max-w-[88%] items-center justify-between gap-2 pl-1 pr-0.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-violet-500">
          {label}
        </span>
        {!isLoading && !isStreaming && text && neuralVoice ? (
          <PlaySpeechButton
            text={text}
            voice={neuralVoice}
            onError={onPlaybackError}
          />
        ) : null}
      </div>
      <div className="w-full max-w-[88%] rounded-2xl rounded-bl-md border border-violet-100 bg-violet-50 px-4 py-2.5 text-sm leading-relaxed text-violet-950 shadow-sm">
        {isStreaming && !text ? (
          <LoadingDots label={vi.status.processing} size="sm" className="text-violet-600" />
        ) : null}

        {text ? (
          <p className="font-semibold">
            {text}
            {isStreaming ? (
              <span
                className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-violet-500 align-middle"
                aria-hidden
              />
            ) : null}
          </p>
        ) : null}

        {isLoading && !isStreaming ? (
          <LoadingDots label={vi.status.processing} size="sm" className="text-violet-600" />
        ) : null}

        {pinyin ? (
          <div
            className={`mt-1.5 border-t border-violet-100/80 pt-1.5 ${
              isStreaming ? "text-violet-600/70" : "text-violet-600/90"
            }`}
          >
            {romanizationLabel ? (
              <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">
                {romanizationLabel}
              </p>
            ) : null}
            <p className="text-xs font-normal tracking-wide">{pinyin}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
