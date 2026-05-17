import { NextRequest, NextResponse } from "next/server";

import { getGeminiModel } from "@/lib/gemini/client";
import { buildStreamingTranslationPrompt } from "@/lib/gemini/prompt";
import { isChineseLanguage } from "@/lib/speech/languages";
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
    const chineseVariant =
      targetLanguageCode === "zh-CN"
        ? "simplified"
        : targetLanguageCode === "zh-TW"
          ? "traditional"
          : undefined;

    const systemInstruction = buildStreamingTranslationPrompt(
      sourceLanguage,
      targetLanguage,
      chineseVariant ? { chineseVariant } : undefined,
    );

    const model = getGeminiModel();
    const result = await model.generateContentStream({
      systemInstruction,
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 1024,
        ...(expectsChineseJson ? { responseMimeType: "application/json" } : {}),
      },
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const piece = chunk.text();

            if (piece) {
              controller.enqueue(encoder.encode(piece));
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });
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
