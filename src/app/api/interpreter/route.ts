import { NextRequest, NextResponse } from "next/server";

import { buildInterpreterPrompt } from "@/lib/gemini/interpreter-prompt";
import { vi } from "@/lib/i18n/vi";
import { getLanguageByCode } from "@/lib/speech/languages";
import { createTranslationStream } from "@/lib/translate/create-translation-stream";
import { isQuotaOrRateLimitError } from "@/lib/translate/providers/is-quota-error";
import { GroqTranslationError } from "@/lib/translate/providers/groq-stream";
import type {
  InterpreterRequestBody,
  TranslateErrorResponse,
} from "@/types/translate";

export const runtime = "nodejs";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseRequestBody(body: unknown): InterpreterRequestBody | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const { text, languageACode, languageBCode } = body as InterpreterRequestBody;

  if (
    !isNonEmptyString(text) ||
    !isNonEmptyString(languageACode) ||
    !isNonEmptyString(languageBCode) ||
    languageACode.trim() === languageBCode.trim()
  ) {
    return null;
  }

  return {
    text: text.trim(),
    languageACode: languageACode.trim(),
    languageBCode: languageBCode.trim(),
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
      return jsonError("Dữ liệu gửi lên không hợp lệ", 400);
    }

    const parsed = parseRequestBody(body);

    if (!parsed) {
      return jsonError(
        "Thiếu text, languageACode, languageBCode hoặc hai ngôn ngữ trùng nhau",
        400,
      );
    }

    const { text, languageACode, languageBCode } = parsed;
    const languageA = getLanguageByCode(languageACode);
    const languageB = getLanguageByCode(languageBCode);

    const systemInstruction = buildInterpreterPrompt(
      { code: languageA.code, apiLanguageName: languageA.apiLanguageName },
      { code: languageB.code, apiLanguageName: languageB.apiLanguageName },
    );

    const { stream, provider } = await createTranslationStream({
      text,
      systemInstruction,
      maxOutputTokens: 2048,
      expectsChineseJson: true,
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
    console.error("[/api/interpreter]", error);

    const message =
      error instanceof Error ? error.message : "Interpreter failed";

    if (
      message.includes("GEMINI_API_KEY") ||
      message.includes("GROQ_API_KEY") ||
      message.includes("No translation API configured")
    ) {
      return jsonError("Máy chủ chưa cấu hình dịch thuật", 500);
    }

    if (error instanceof GroqTranslationError && error.status === 429) {
      return jsonError(
        vi.errors.rateLimitAll,
        429,
      );
    }

    const status =
      isQuotaOrRateLimitError(error) ||
      message.includes("429") ||
      message.toLowerCase().includes("quota")
        ? 429
        : 502;

    return jsonError("Dịch vụ phiên dịch tạm thời không khả dụng", status);
  }
}
