export function isQuotaOrRateLimitError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const status = (error as { status?: number }).status;

  if (status === 429) {
    return true;
  }

  const message = (
    error instanceof Error ? error.message : String(error)
  ).toLowerCase();

  return (
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("rate_limit") ||
    message.includes("resource_exhausted") ||
    message.includes("too many requests") ||
    message.includes("exceeded")
  );
}
