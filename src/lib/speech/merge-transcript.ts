import { normalizeSpeechText } from "@/lib/speech/normalize-transcript";

const MIN_OVERLAP_CHARS = 6;

function compareKey(text: string): string {
  return normalizeSpeechText(text).toLowerCase();
}

/** Merges a new STT chunk without duplicating overlap from pauses / iOS restarts. */
export function mergeTranscriptWithDedup(
  existing: string,
  incoming: string,
): string {
  const left = normalizeSpeechText(existing);
  const right = normalizeSpeechText(incoming);

  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  if (left === right) {
    return left;
  }

  const leftKey = compareKey(left);
  const rightKey = compareKey(right);

  if (rightKey.includes(leftKey)) {
    return right;
  }

  if (leftKey.includes(rightKey)) {
    return left;
  }

  const maxOverlap = Math.min(leftKey.length, rightKey.length);

  for (let size = maxOverlap; size >= MIN_OVERLAP_CHARS; size--) {
    if (leftKey.endsWith(rightKey.slice(0, size))) {
      const append = right.slice(size).trim();
      return append ? `${left} ${append}` : left;
    }
  }

  return `${left} ${right}`;
}

/** Collapses duplicated phrases inside one session transcript. */
export function collapseTranscriptRepetition(text: string): string {
  let current = normalizeSpeechText(text);

  if (!current) {
    return current;
  }

  const words = current.split(/\s+/);

  for (let split = 1; split < words.length; split++) {
    const left = words.slice(0, split).join(" ");
    const right = words.slice(split).join(" ");
    const merged = mergeTranscriptWithDedup(left, right);

    if (merged.length + 4 < left.length + right.length) {
      current = merged;
      return collapseTranscriptRepetition(current);
    }
  }

  return current;
}
