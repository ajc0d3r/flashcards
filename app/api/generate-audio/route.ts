import { NextRequest, NextResponse } from "next/server";
import { generateToddlerAudioDataUrl } from "@/lib/services/openaiClient";
import { GenerateAudioRequest, LanguageCode } from "@/types/flashcard";

const ALLOWED_LANGUAGES: LanguageCode[] = ["en", "hi", "zh", "ar"];

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as GenerateAudioRequest;
    if (!payload?.text || !payload?.englishWord || !payload?.language) {
      return NextResponse.json(
        { error: "englishWord, text, and language are required." },
        { status: 400 },
      );
    }
    if (!ALLOWED_LANGUAGES.includes(payload.language)) {
      return NextResponse.json({ error: "Unsupported language." }, { status: 400 });
    }

    const audioDataUrl = await generateToddlerAudioDataUrl(
      payload.text,
      payload.language,
    );

    if (audioDataUrl) {
      return NextResponse.json({ audioDataUrl, provider: "openai" });
    }

    return NextResponse.json({
      provider: "fallback",
      error: "OpenAI key not configured.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate audio.";
    return NextResponse.json(
      { provider: "fallback", error: message },
      { status: 200 },
    );
  }
}
