import type { AppListeningState } from "@/types/speech";

interface StatusBadgeProps {
  listeningState: AppListeningState;
}

const STATUS_COPY: Record<AppListeningState, string> = {
  idle: "Tap the mic to start",
  listening: "Listening…",
};

export function StatusBadge({ listeningState }: StatusBadgeProps) {
  const isListening = listeningState === "listening";

  return (
    <div className="flex items-center justify-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${
          isListening ? "bg-emerald-500 animate-pulse" : "bg-zinc-300"
        }`}
        aria-hidden
      />
      <p className="text-sm font-medium text-zinc-500">
        {STATUS_COPY[listeningState]}
      </p>
    </div>
  );
}
