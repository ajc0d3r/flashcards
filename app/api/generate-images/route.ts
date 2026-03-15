import { NextRequest, NextResponse } from "next/server";
import { PLACEHOLDER_IMAGE_SQUARE } from "@/lib/imagePlaceholders";
import { generateToddlerImage } from "@/lib/services/falClient";
import { getCachedImageFile, cacheImageFile } from "@/lib/services/localCache";
import { GenerateImageRequest } from "@/types/flashcard";

function createFallbackImage(): string {
  return PLACEHOLDER_IMAGE_SQUARE;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as GenerateImageRequest;
    if (!payload?.themeId || !payload?.word?.en) {
      return NextResponse.json(
        { error: "themeId and word are required." },
        { status: 400 },
      );
    }

    // Check local file cache first
    const cached = getCachedImageFile(payload.themeId, payload.word.en);
    if (cached) {
      return NextResponse.json({ imageUrl: cached, provider: "fal" });
    }

    const imageUrl = await generateToddlerImage(payload.themeId, payload.word);
    if (imageUrl) {
      // Save to local disk in background
      void cacheImageFile(payload.themeId, payload.word.en, imageUrl);
      return NextResponse.json({ imageUrl, provider: "fal" });
    }

    return NextResponse.json({
      imageUrl: createFallbackImage(),
      provider: "fallback",
    });
  } catch (error) {
    console.error("[generate-images] Error:", error);
    return NextResponse.json(
      { imageUrl: createFallbackImage(), provider: "fallback" },
      { status: 200 },
    );
  }
}
