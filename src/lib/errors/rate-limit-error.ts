import { vi } from "@/lib/i18n/vi";

export class RateLimitError extends Error {
  constructor(message?: string) {
    super(message ?? vi.errors.rateLimit);
    this.name = "RateLimitError";
  }
}
