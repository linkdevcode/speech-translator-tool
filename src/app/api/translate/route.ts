import { NextRequest, NextResponse } from "next/server";

import { buildStreamingTranslationPrompt } from "@/lib/gemini/prompt";
import { createTranslationStream } from "@/lib/translate/create-translation-stream";
import { isQuotaOrRateLimitError } from "@/lib/translate/providers/is-quota-error";
import { GroqTranslationError } from "@/lib/translate/providers/groq-stream";
import {
  getChineseVariant,
  isChineseLanguage,
} from "@/lib/speech/languages";
import type { TranslateErrorResponse, TranslateRequestBody } from "@/types/translate";

export const runtime = "nodejs";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseRequestBody(body: unknown): TranslateRequestBody | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const { text, sourceLanguage, targetLanguage, targetLanguageCode } =
    body as TranslateRequestBody;

  if (
    !isNonEmptyString(text) ||
    !isNonEmptyString(sourceLanguage) ||
    !isNonEmptyString(targetLanguage) ||
    !isNonEmptyString(targetLanguageCode)
  ) {
    return null;
  }

  return {
    text: text.trim(),
    sourceLanguage: sourceLanguage.trim(),
    targetLanguage: targetLanguage.trim(),
    targetLanguageCode: targetLanguageCode.trim(),
  };
}

function jsonError(
  message: string,
  status: number,
): NextResponse<TranslateErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const parsed = parseRequestBody(body);

    if (!parsed) {
      return jsonError(
        "text, sourceLanguage, targetLanguage, and targetLanguageCode are required",
        400,
      );
    }

    const { text, sourceLanguage, targetLanguage, targetLanguageCode } = parsed;
    const expectsChineseJson = isChineseLanguage(targetLanguageCode);
    const chineseVariant = getChineseVariant(targetLanguageCode);

    const systemInstruction = buildStreamingTranslationPrompt(
      sourceLanguage,
      targetLanguage,
      chineseVariant ? { chineseVariant } : undefined,
    );

    const maxOutputTokens = expectsChineseJson ? 2048 : 1024;

    const { stream, provider } = await createTranslationStream({
      text,
      systemInstruction,
      maxOutputTokens,
      expectsChineseJson,
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
        "X-Translate-Provider": provider,
      },
    });
  } catch (error) {
    console.error("[/api/translate]", error);

    const message =
      error instanceof Error ? error.message : "Translation failed";

    if (
      message.includes("GEMINI_API_KEY") ||
      message.includes("GROQ_API_KEY") ||
      message.includes("No translation API configured")
    ) {
      return jsonError("Server translation is not configured", 500);
    }

    if (error instanceof GroqTranslationError && error.status === 429) {
      return jsonError(
        "Translation rate limit reached on all providers. Please wait and try again.",
        429,
      );
    }

    const status =
      isQuotaOrRateLimitError(error) ||
      message.includes("429") ||
      message.toLowerCase().includes("quota")
        ? 429
        : 502;

    return jsonError("Translation service unavailable", status);
  }
}
