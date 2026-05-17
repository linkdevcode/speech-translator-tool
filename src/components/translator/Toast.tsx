import type { ToastState } from "@/hooks/useToast";

interface ToastProps {
  toast: ToastState | null;
  onDismiss: () => void;
}

const VARIANT_STYLES: Record<
  ToastState["variant"],
  { container: string; icon: string }
> = {
  info: {
    container: "border-zinc-200 bg-zinc-900 text-white shadow-lg",
    icon: "text-zinc-300",
  },
  warning: {
    container: "border-amber-200 bg-amber-50 text-amber-950 shadow-md",
    icon: "text-amber-600",
  },
  error: {
    container: "border-red-200 bg-red-50 text-red-950 shadow-md",
    icon: "text-red-600",
  },
};

export function Toast({ toast, onDismiss }: ToastProps) {
  if (!toast) {
    return null;
  }

  const styles = VARIANT_STYLES[toast.variant];

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4"
      role={toast.variant === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 ${styles.container}`}
      >
        <ToastIcon variant={toast.variant} className={styles.icon} />
        <p className="flex-1 text-sm leading-relaxed">{toast.message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg px-1 text-xs opacity-70 transition-opacity hover:opacity-100"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function ToastIcon({
  variant,
  className,
}: {
  variant: ToastState["variant"];
  className: string;
}) {
  if (variant === "error") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={`mt-0.5 h-5 w-5 shrink-0 ${className}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    );
  }

  if (variant === "warning") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={`mt-0.5 h-5 w-5 shrink-0 ${className}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={`mt-0.5 h-5 w-5 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}
