import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set — chatbot will not function.");
}

export const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  vertexai: false,
});

// Free-tier friendly model. Check Google AI Studio for current free-tier
// availability — swap this string if Google changes free-tier models.
export const GEMINI_MODEL = "gemini-2.5-flash";
