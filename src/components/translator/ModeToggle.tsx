import { vi } from "@/lib/i18n/vi";
import type { AppMode } from "@/types/translator";

interface ModeToggleProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div
      className="flex rounded-xl border border-zinc-200 bg-zinc-100 p-0.5"
      role="tablist"
      aria-label={vi.mode.label}
    >
      <ModeButton
        active={mode === "classic"}
        onClick={() => onChange("classic")}
        label={vi.mode.classic}
      />
      <ModeButton
        active={mode === "interpreter"}
        onClick={() => onChange("interpreter")}
        label={vi.mode.interpreter}
      />
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-white text-zinc-900 shadow-sm"
          : "text-zinc-500 hover:text-zinc-700"
      }`}
    >
      {label}
    </button>
  );
}
