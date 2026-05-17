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

export interface InterpreterRequestBody {
  text: string;
  languageACode: string;
  languageBCode: string;
}

export interface InterpreterResult {
  detectedLanguageCode: string;
  translation: string;
  pinyin?: string;
}
