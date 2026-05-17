import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";

export function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const modelId = process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({ model: modelId });
}
