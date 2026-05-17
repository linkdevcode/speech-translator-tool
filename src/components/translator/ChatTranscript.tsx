"use client";

import { useEffect, useRef } from "react";

import { LoadingDots } from "@/components/ui/LoadingDots";
import type { ConversationEntry } from "@/types/translator";

interface ChatTranscriptProps {
  entries: ConversationEntry[];
  sourceLabel: string;
  targetLabel: string;
}

export function ChatTranscript({
  entries,
  sourceLabel,
  targetLabel,
}: ChatTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    try {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    } catch {
      container.scrollTop = container.scrollHeight;
    }
  }, [entries]);

  if (entries.length === 0) {
    return (
      <section className="flex min-h-[220px] flex-1 flex-col rounded-2xl border border-dashed border-zinc-200 bg-white/80 p-5">
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
    <section className="flex min-h-[220px] flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Conversation
        </h2>
      </div>

      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4"
      >
        {entries.map((entry) => (
          <ChatTurn
            key={entry.id}
            entry={entry}
            sourceLabel={sourceLabel}
            targetLabel={targetLabel}
          />
        ))}
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
        <TargetBubble label={targetLabel} text={entry.translatedText} />
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
  isLoading = false,
}: {
  label: string;
  text?: string;
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
          <p className="font-semibold">{text}</p>
        )}
      </div>
    </div>
  );
}
