import { fal } from "@fal-ai/client";
import { createToddlerImagePrompt } from "@/lib/safetyPrompt";
import { WordTranslations } from "@/types/flashcard";

let falConfigured = false;

function ensureFalConfigured() {
  if (falConfigured) {
    return;
  }
  const credentials = process.env.FAL_KEY;
  if (!credentials) {
    return;
  }
  fal.config({ credentials });
  falConfigured = true;
}

export async function generateToddlerImage(
  themeId: string,
  word: WordTranslations,
): Promise<string | null> {
  if (!process.env.FAL_KEY) {
    return null;
  }

  ensureFalConfigured();
  const model = process.env.FAL_IMAGE_MODEL ?? "fal-ai/nano-banana-2";

  try {
    const result = await fal.subscribe(model, {
      input: {
        prompt: createToddlerImagePrompt(themeId, word),
        aspect_ratio: "1:1",
        num_images: 1,
      },
    });

    const data = result.data as {
      images?: Array<{ url?: string }>;
      image?: { url?: string };
    };
    const imageUrl = data?.images?.[0]?.url ?? data?.image?.url ?? null;
    if (!imageUrl) {
      console.error("[falClient] No image URL in response:", JSON.stringify(data));
    }
    return imageUrl;
  } catch (error) {
    console.error("[falClient] Image generation failed:", error);
    return null;
  }
}
