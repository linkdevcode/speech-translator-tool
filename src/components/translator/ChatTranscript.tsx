"use client";

import { useEffect, useMemo, useRef } from "react";

import { LoadingDots } from "@/components/ui/LoadingDots";
import type { ConversationEntry } from "@/types/translator";

interface ChatTranscriptProps {
  entries: ConversationEntry[];
  sourceLabel: string;
  targetLabel: string;
  className?: string;
}

export function ChatTranscript({
  entries,
  sourceLabel,
  targetLabel,
  className = "",
}: ChatTranscriptProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollSignature = useMemo(
    () =>
      entries
        .map(
          (entry) =>
            `${entry.id}:${entry.status}:${entry.sourceText}:${entry.translatedText}:${entry.pinyin ?? ""}`,
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
          Conversation
        </h2>
        <p className="mt-auto text-sm leading-relaxed text-zinc-400">
          Your dialogue will appear here as chat bubbles — original on the right,
          translation on the left.
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
          Conversation
        </h2>
      </div>

      <div         ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-3 pb-2"
        aria-label="Conversation messages"
      >
        <div className="flex flex-col gap-4 pb-3">
          {entries.map((entry) => (
            <ChatTurn
              key={entry.id}
              entry={entry}
              sourceLabel={sourceLabel}
              targetLabel={targetLabel}
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
}: {
  entry: ConversationEntry;
  sourceLabel: string;
  targetLabel: string;
}) {
  return (
    <article className="flex flex-col gap-2">
      <SourceBubble label={sourceLabel} text={entry.sourceText} />

      {entry.status === "translating" ? (
        <TargetBubble label={targetLabel} isLoading />
      ) : null}

      {entry.status === "complete" && entry.translatedText ? (
        <TargetBubble
          label={targetLabel}
          text={entry.translatedText}
          pinyin={entry.pinyin}
        />
      ) : null}

      {entry.status === "error" ? (
        <div className="flex justify-start">
          <p className="max-w-[85%] rounded-2xl rounded-bl-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
            {entry.errorMessage ?? "Translation failed."}
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
  isLoading = false,
}: {
  label: string;
  text?: string;
  pinyin?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="pl-1 text-[10px] font-medium uppercase tracking-wide text-violet-500">
        {label}
      </span>
      <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-violet-100 bg-violet-50 px-4 py-2.5 text-sm leading-relaxed text-violet-950 shadow-sm">
        {isLoading ? (
          <LoadingDots label="Translating…" size="sm" className="text-violet-600" />
        ) : (
          <>
            <p className="font-semibold">{text}</p>
            {pinyin ? (
              <p className="mt-1.5 border-t border-violet-100/80 pt-1.5 text-xs font-normal tracking-wide text-violet-600/90">
                {pinyin}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
