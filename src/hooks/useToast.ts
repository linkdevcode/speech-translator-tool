"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastVariant = "info" | "warning" | "error";

export interface ToastState {
  message: string;
  variant: ToastVariant;
}

export function useToast(autoDismissMs = 4000) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<number | null>(null);

  const dismissToast = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (
      message: string,
      variant: ToastVariant = "info",
      durationMs = autoDismissMs,
    ) => {
      try {
        if (timerRef.current) {
          window.clearTimeout(timerRef.current);
        }

        setToast({ message, variant });

        timerRef.current = window.setTimeout(() => {
          setToast(null);
          timerRef.current = null;
        }, durationMs);
      } catch {
        setToast({ message, variant });
      }
    },
    [autoDismissMs],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { toast, showToast, dismissToast };
}
