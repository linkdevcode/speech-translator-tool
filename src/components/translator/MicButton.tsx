import type { AppListeningState } from "@/types/speech";

interface MicButtonProps {
  listeningState: AppListeningState;
  disabled?: boolean;
  onClick: () => void;
}

export function MicButton({
  listeningState,
  disabled = false,
  onClick,
}: MicButtonProps) {
  const isListening = listeningState === "listening";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isListening}
      aria-label={isListening ? "Stop listening" : "Start listening"}
      className={`group relative flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
        isListening ? "animate-mic-glow" : ""
      }`}
    >
      {isListening ? (
        <>
          <span
            className="absolute inset-0 rounded-full bg-emerald-400/40 animate-mic-pulse"
            aria-hidden
          />
          <span
            className="absolute inset-0 rounded-full bg-emerald-400/25 animate-mic-pulse [animation-delay:450ms]"
            aria-hidden
          />
          <span
            className="absolute -inset-2 rounded-full border-2 border-emerald-400/50 animate-mic-ring"
            aria-hidden
          />
        </>
      ) : null}

      <span className="relative flex h-10 w-10 items-center justify-center">
        {isListening ? (
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7"
            fill="currentColor"
            aria-hidden
          >
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
            <path d="M12 18v4" />
            <path d="M8 22h8" />
          </svg>
        )}
      </span>
    </button>
  );
}
