export interface TranslateRequestBody {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  targetLanguageCode: string;
}

export interface TranslateSuccessResponse {
  translation: string;
  pinyin?: string;
}

export interface TranslateErrorResponse {
  error: string;
}

export interface TranslationResult {
  translation: string;
  pinyin?: string;
}
