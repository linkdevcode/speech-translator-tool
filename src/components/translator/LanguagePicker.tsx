"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { vi } from "@/lib/i18n/vi";
import { LANGUAGES } from "@/lib/speech/languages";
import type { LanguageOption } from "@/types/speech";

interface LanguagePickerProps {
  label: string;
  value: string;
  selected: LanguageOption;
  onChange: (code: string) => void;
  excludeCode: string;
}

export function LanguagePicker({
  label,
  value,
  selected,
  onChange,
  excludeCode,
}: LanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const listId = useId();

  const options = LANGUAGES.filter((lang) => lang.code !== excludeCode);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleSelect = useCallback(
    (code: string) => {
      onChange(code);
      setOpen(false);
    },
    [onChange],
  );

  const sheet =
    open && mounted
      ? createPortal(
          <>
            <button
              type="button"
              aria-label={vi.language.closeMenu}
              className="fixed inset-0 z-[100] bg-zinc-900/40"
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={listId}
              className="language-sheet-enter fixed inset-x-0 bottom-0 z-[101] max-h-[min(70dvh,420px)] overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl"
            >
              <div className="flex justify-center pt-3 pb-1">
                <span
                  className="h-1 w-10 rounded-full bg-zinc-300"
                  aria-hidden
                />
              </div>
              <div className="border-b border-zinc-100 px-4 pb-3">
                <p
                  id={listId}
                  className="text-xs font-semibold uppercase tracking-wide text-zinc-400"
                >
                  {vi.language.pickerLabel(label)}
                </p>
              </div>
              <ul
                className="max-h-[min(55dvh,340px)] overflow-y-auto overscroll-contain px-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
                role="listbox"
                aria-label={vi.language.pickerLabel(label)}
              >
                {options.map((lang) => {
                  const isSelected = lang.code === value;

                  return (
                    <li key={lang.code} role="none">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(lang.code)}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors active:bg-zinc-100 ${
                          isSelected
                            ? "bg-violet-50 text-violet-900"
                            : "text-zinc-900"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {lang.label}
                          </span>
                          <span className="block truncate text-[11px] text-zinc-500">
                            {lang.speechLocale}
                          </span>
                        </span>
                        {isSelected ? (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 shrink-0 text-violet-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${vi.language.pickerLabel(label)}: ${selected.label}`}
        onClick={() => setOpen(true)}
        className="w-full truncate rounded-xl border border-zinc-200 bg-white px-2.5 py-2 text-left text-sm font-semibold text-zinc-900 shadow-sm outline-none ring-violet-400 focus-visible:ring-2 active:bg-zinc-50"
      >
        {selected.label}
      </button>
      {sheet}
    </>
  );
}
