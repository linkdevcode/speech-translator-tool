import type { ConversationEntry } from "@/types/translator";

interface ConversationHistoryProps {
  entries: ConversationEntry[];
}

export function ConversationHistory({ entries }: ConversationHistoryProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Conversation
      </h2>
      <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="rounded-xl border border-zinc-200 bg-white p-3 text-sm leading-relaxed"
          >
            <p className="font-semibold text-zinc-900">{entry.sourceText}</p>
            <p className="mt-1 text-violet-800">{entry.translatedText}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
