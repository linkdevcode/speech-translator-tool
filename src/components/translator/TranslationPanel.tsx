import type { PipelineState } from "@/types/translator";

interface TranslationPanelProps {
  label: string;
  translation: string;
  pipelineState: PipelineState;
  placeholder: string;
}

export function TranslationPanel({
  label,
  translation,
  pipelineState,
  placeholder,
}: TranslationPanelProps) {
  const isProcessing = pipelineState === "processing";
  const isSpeaking = pipelineState === "speaking";

  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {label}
        </h2>
        {isSpeaking ? (
          <span className="flex items-center gap-1 text-xs font-medium text-violet-600">
            <span className="inline-flex gap-0.5" aria-hidden>
              <span className="h-2 w-0.5 animate-pulse rounded-full bg-violet-500" />
              <span className="h-3 w-0.5 animate-pulse rounded-full bg-violet-500 [animation-delay:120ms]" />
              <span className="h-2 w-0.5 animate-pulse rounded-full bg-violet-500 [animation-delay:240ms]" />
            </span>
            Speaking
          </span>
        ) : null}
      </div>

      {isProcessing ? (
        <div className="flex items-center gap-2 text-zinc-400">
          <span className="inline-flex gap-1" aria-hidden>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:240ms]" />
          </span>
          <span className="text-sm">Translating…</span>
        </div>
      ) : translation ? (
        <p className="text-lg font-semibold leading-relaxed text-violet-900">
          {translation}
        </p>
      ) : (
        <p className="text-sm text-zinc-400">{placeholder}</p>
      )}
    </section>
  );
}
