export class RateLimitError extends Error {
  constructor(
    message = "API rate limit reached. Please wait a moment and try again.",
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}
