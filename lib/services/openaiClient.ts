import OpenAI from "openai";
import { createToddlerTtsInstruction } from "@/lib/safetyPrompt";
import { LanguageCode } from "@/types/flashcard";

let openaiClient: OpenAI | null = null;

function getOpenAiClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

export async function generateToddlerAudioDataUrl(
  text: string,
  language: LanguageCode,
): Promise<string | null> {
  const client = getOpenAiClient();
  if (!client) {
    return null;
  }

  const configuredSpeed = Number.parseFloat(
    process.env.OPENAI_TTS_SPEED ?? "0.82",
  );
  const safeSpeed = Number.isFinite(configuredSpeed)
    ? Math.min(Math.max(configuredSpeed, 0.6), 1.1)
    : 0.82;

  const response = await client.audio.speech.create({
    model: process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
    voice: process.env.OPENAI_TTS_VOICE ?? "shimmer",
    response_format: "mp3",
    input: text,
    instructions: createToddlerTtsInstruction(language),
    speed: safeSpeed,
  });

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:audio/mpeg;base64,${base64}`;
}
