import { getGeminiModel } from "@/lib/gemini/client";

import type { TranslationStreamParams } from "./types";

export async function streamGeminiTranslation(
  params: TranslationStreamParams,
): Promise<ReadableStream<Uint8Array>> {
  const { text, systemInstruction, maxOutputTokens, expectsChineseJson } =
    params;

  const model = getGeminiModel();
  const result = await model.generateContentStream({
    systemInstruction,
    contents: [{ role: "user", parts: [{ text }] }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens,
      ...(expectsChineseJson ? { responseMimeType: "application/json" } : {}),
    },
  });

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        let streamed = "";

        for await (const chunk of result.stream) {
          const piece = chunk.text();

          if (piece) {
            streamed += piece;
            controller.enqueue(encoder.encode(piece));
          }
        }

        if (!streamed.trim()) {
          const response = await result.response;
          const fullText = response.text();

          if (fullText) {
            controller.enqueue(encoder.encode(fullText));
          }
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
