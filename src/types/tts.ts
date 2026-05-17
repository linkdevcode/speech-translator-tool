export interface TtsRequestBody {
  text: string;
  voice: string;
}

export interface TtsErrorResponse {
  error: string;
}
