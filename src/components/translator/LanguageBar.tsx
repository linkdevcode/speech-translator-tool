import type { LanguageOption } from "@/types/speech";

import { LanguagePicker } from "./LanguagePicker";

interface LanguageBarProps {
  source: LanguageOption;
  target: LanguageOption;
  sourceCode: string;
  targetCode: string;
  onSourceChange: (code: string) => void;
  onTargetChange: (code: string) => void;
  onSwap: () => void;
}

export function LanguageBar({
  source,
  target,
  sourceCode,
  targetCode,
  onSourceChange,
  onTargetChange,
  onSwap,
}: LanguageBarProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
      <LanguageSelect
        label="From"
        value={sourceCode}
        selected={source}
        onChange={onSourceChange}
        excludeCode={targetCode}
      />
      <button
        type="button"
        onClick={onSwap}
        aria-label="Swap languages"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 active:scale-95"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M7 16V4m0 0L3 8m4-4 4 4" />
          <path d="M17 8v12m0 0 4-4m-4 4-4-4" />
        </svg>
      </button>
      <LanguageSelect
        label="To"
        value={targetCode}
        selected={target}
        onChange={onTargetChange}
        excludeCode={sourceCode}
      />
    </div>
  );
}

function LanguageSelect({
  label,
  value,
  selected,
  onChange,
  excludeCode,
}: {
  label: string;
  value: string;
  selected: LanguageOption;
  onChange: (code: string) => void;
  excludeCode: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      <LanguagePicker
        label={label}
        value={value}
        selected={selected}
        onChange={onChange}
        excludeCode={excludeCode}
      />
      <span className="truncate pl-0.5 text-[10px] text-zinc-400">
        {selected.speechLocale}
      </span>
    </div>
  );
}
