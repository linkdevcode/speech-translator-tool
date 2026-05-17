import { NextRequest, NextResponse } from "next/server";

import { synthesizeNeuralSpeech } from "@/lib/tts/synthesize-edge";
import type { TtsErrorResponse, TtsRequestBody } from "@/types/tts";

export const runtime = "nodejs";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseBody(body: unknown): TtsRequestBody | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const { text, voice } = body as TtsRequestBody;

  if (!isNonEmptyString(text) || !isNonEmptyString(voice)) {
    return null;
  }

  return { text: text.trim(), voice: voice.trim() };
}

function jsonError(
  message: string,
  status: number,
): NextResponse<TtsErrorResponse> {
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

    const parsed = parseBody(body);

    if (!parsed) {
      return jsonError("text and voice are required non-empty strings", 400);
    }

    const audioBuffer = await synthesizeNeuralSpeech(parsed.text, parsed.voice);

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[/api/tts]", error);

    return jsonError("Neural speech synthesis unavailable", 502);
  }
}
