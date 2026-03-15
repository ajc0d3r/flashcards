import { NextRequest, NextResponse } from "next/server";
import { generateToddlerAudioDataUrl } from "@/lib/services/googleTtsClient";
import { getCachedAudioFile, cacheAudioFile } from "@/lib/services/localCache";
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

    // Check local file cache first
    const cached = getCachedAudioFile(payload.englishWord, payload.language);
    if (cached) {
      return NextResponse.json({ audioDataUrl: cached, provider: "google" });
    }

    const audioDataUrl = await generateToddlerAudioDataUrl(
      payload.text,
      payload.language,
    );

    if (audioDataUrl) {
      // Save to local disk
      cacheAudioFile(payload.englishWord, payload.language, audioDataUrl);
      return NextResponse.json({ audioDataUrl, provider: "google" });
    }

    return NextResponse.json({
      provider: "fallback",
      error: "Google TTS key not configured.",
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
