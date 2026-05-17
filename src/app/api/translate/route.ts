import { NextRequest, NextResponse } from "next/server";

import { getGeminiModel } from "@/lib/gemini/client";
import { buildTranslationSystemPrompt } from "@/lib/gemini/prompt";
import type {
  TranslateErrorResponse,
  TranslateRequestBody,
  TranslateSuccessResponse,
} from "@/types/translate";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseRequestBody(body: unknown): TranslateRequestBody | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const { text, sourceLanguage, targetLanguage } = body as TranslateRequestBody;

  if (
    !isNonEmptyString(text) ||
    !isNonEmptyString(sourceLanguage) ||
    !isNonEmptyString(targetLanguage)
  ) {
    return null;
  }

  return {
    text: text.trim(),
    sourceLanguage: sourceLanguage.trim(),
    targetLanguage: targetLanguage.trim(),
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
        "text, sourceLanguage, and targetLanguage are required non-empty strings",
        400,
      );
    }

    const { text, sourceLanguage, targetLanguage } = parsed;
    const systemInstruction = buildTranslationSystemPrompt(
      sourceLanguage,
      targetLanguage,
    );

    const model = getGeminiModel();
    const result = await model.generateContent({
      systemInstruction,
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    });

    const translation = result.response.text()?.trim();

    if (!translation) {
      return jsonError("Empty translation from model", 502);
    }

    return NextResponse.json<TranslateSuccessResponse>({ translation });
  } catch (error) {
    console.error("[/api/translate]", error);

    const message =
      error instanceof Error ? error.message : "Translation failed";

    if (message.includes("GEMINI_API_KEY")) {
      return jsonError("Server translation is not configured", 500);
    }

    const status =
      message.includes("429") || message.toLowerCase().includes("quota")
        ? 429
        : 502;

    return jsonError("Translation service unavailable", status);
  }
}
