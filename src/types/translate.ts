export interface TranslateRequestBody {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslateSuccessResponse {
  translation: string;
}

export interface TranslateErrorResponse {
  error: string;
}
