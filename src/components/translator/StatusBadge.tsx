import type { AppListeningState } from "@/types/speech";
import type { PipelineState } from "@/types/translator";

interface StatusBadgeProps {
  listeningState: AppListeningState;
  pipelineState: PipelineState;
}

type DisplayStatus = AppListeningState | PipelineState;

const STATUS_COPY: Record<DisplayStatus, string> = {
  idle: "Tap the mic to start",
  listening: "Listening…",
  processing: "Translating…",
  speaking: "Playing translation…",
};

const STATUS_COLOR: Record<DisplayStatus, string> = {
  idle: "bg-zinc-300",
  listening: "bg-emerald-500 animate-pulse",
  processing: "bg-amber-400 animate-pulse",
  speaking: "bg-violet-500 animate-pulse",
};

function resolveDisplayStatus(
  listeningState: AppListeningState,
  pipelineState: PipelineState,
): DisplayStatus {
  if (pipelineState === "processing" || pipelineState === "speaking") {
    return pipelineState;
  }

  return listeningState;
}

export function StatusBadge({
  listeningState,
  pipelineState,
}: StatusBadgeProps) {
  const displayStatus = resolveDisplayStatus(listeningState, pipelineState);

  return (
    <div className="flex items-center justify-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${STATUS_COLOR[displayStatus]}`}
        aria-hidden
      />
      <p className="text-sm font-medium text-zinc-500">
        {STATUS_COPY[displayStatus]}
      </p>
    </div>
  );
}
