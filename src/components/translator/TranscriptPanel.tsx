interface TranscriptPanelProps {
  finalTranscript: string;
  interimTranscript: string;
  placeholder: string;
}

export function TranscriptPanel({
  finalTranscript,
  interimTranscript,
  placeholder,
}: TranscriptPanelProps) {
  const hasContent = Boolean(finalTranscript || interimTranscript);

  return (
    <section
      className="min-h-[140px] flex-1 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      aria-live="polite"
      aria-atomic="false"
    >
      {!hasContent ? (
        <p className="text-sm leading-relaxed text-zinc-400">{placeholder}</p>
      ) : (
        <p className="text-lg leading-relaxed text-zinc-900">
          {finalTranscript ? (
            <span className="font-semibold">{finalTranscript}</span>
          ) : null}
          {finalTranscript && interimTranscript ? " " : null}
          {interimTranscript ? (
            <span className="italic text-zinc-400">{interimTranscript}</span>
          ) : null}
        </p>
      )}
    </section>
  );
}
