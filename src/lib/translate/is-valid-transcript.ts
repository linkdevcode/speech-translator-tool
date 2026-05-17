export function isValidTranscript(text: string): boolean {
  const trimmed = text.trim();

  if (!trimmed) {
    return false;
  }

  if (!/[\p{L}\p{N}]/u.test(trimmed)) {
    return false;
  }

  return true;
}
