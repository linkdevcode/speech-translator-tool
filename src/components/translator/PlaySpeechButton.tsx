"use client";

import { useCallback, useState } from "react";

import { vi } from "@/lib/i18n/vi";
import {
  cancelNeuralSpeech,
  playNeuralTts,
} from "@/lib/speech/play-neural-tts";
import { unlockIosAudioPlayback } from "@/lib/speech/unlock-ios-audio";

interface PlaySpeechButtonProps {
  text: string;
  voice: string;
  onError?: (message: string) => void;
}

export function PlaySpeechButton({
  text,
  voice,
  onError,
}: PlaySpeechButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = useCallback(async () => {
    if (isPlaying || !text.trim()) {
      return;
    }

    try {
      unlockIosAudioPlayback();
      setIsPlaying(true);
      await playNeuralTts(text, voice);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : vi.playback.playFailed;
      onError?.(message);
    } finally {
      setIsPlaying(false);
    }
  }, [isPlaying, onError, text, voice]);

  const handleStop = useCallback(() => {
    try {
      cancelNeuralSpeech();
    } catch {
      // ignore
    }
    setIsPlaying(false);
  }, []);

  return (
    <button
      type="button"
      onClick={isPlaying ? handleStop : handlePlay}
      disabled={!text.trim()}
      aria-label={isPlaying ? vi.playback.stop : vi.playback.play}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-white text-violet-600 shadow-sm transition-colors hover:bg-violet-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {isPlaying ? (
        <span className="inline-flex gap-0.5" aria-hidden>
          <span className="h-2 w-0.5 animate-pulse rounded-full bg-violet-500" />
          <span className="h-3 w-0.5 animate-pulse rounded-full bg-violet-500 [animation-delay:120ms]" />
          <span className="h-2 w-0.5 animate-pulse rounded-full bg-violet-500 [animation-delay:240ms]" />
        </span>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  );
}
