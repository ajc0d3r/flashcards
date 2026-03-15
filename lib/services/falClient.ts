import { fal } from "@fal-ai/client";
import OpenAI from "openai";
import { createToddlerImagePrompt } from "@/lib/safetyPrompt";
import { WordTranslations } from "@/types/flashcard";

let falConfigured = false;
let openaiClient: OpenAI | null = null;

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

function getOpenAiClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
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
  const maxAttempts = Number.parseInt(process.env.FAL_IMAGE_MAX_ATTEMPTS ?? "3", 10);
  const attempts = Number.isFinite(maxAttempts) ? Math.min(Math.max(maxAttempts, 1), 5) : 3;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const result = await fal.subscribe(model, {
        input: {
          prompt: withAttemptPrompt(createToddlerImagePrompt(themeId, word), attempt),
          aspect_ratio: "1:1",
          num_images: 1,
        },
      });

      const data = result.data as {
        images?: Array<{ url?: string }>;
        image?: { url?: string };
      };
      const candidateUrl = data?.images?.[0]?.url ?? data?.image?.url ?? null;
      if (!candidateUrl) {
        console.error(`[falClient] Attempt ${attempt + 1}: no image URL in response`);
        continue;
      }

      const hasText = await hasVisibleText(candidateUrl);
      if (hasText === false) {
        return candidateUrl;
      }
      if (hasText === null) {
        // If text guard is unavailable, return candidate to avoid blocking UX.
        return candidateUrl;
      }
      console.error(`[falClient] Attempt ${attempt + 1}: text detected in image, retrying`);
    } catch (error) {
      console.error(`[falClient] Attempt ${attempt + 1} failed:`, error);
    }
  }

  // If all attempts appear to contain text, fall back to no-text placeholder upstream.
  return null;
}

function withAttemptPrompt(basePrompt: string, attempt: number): string {
  if (attempt === 0) {
    return basePrompt;
  }
  if (attempt === 1) {
    return `${basePrompt} Hard rule: the output must contain zero writing.`;
  }
  return `${basePrompt} Strict compliance: if any text would appear, replace it with blank decorative shapes.`;
}

async function hasVisibleText(imageUrl: string): Promise<boolean | null> {
  const client = getOpenAiClient();
  if (!client) {
    return null;
  }

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_IMAGE_GUARD_MODEL ?? "gpt-4o-mini",
      temperature: 0,
      max_tokens: 5,
      messages: [
        {
          role: "system",
          content:
            "You are a strict OCR guard. Reply with exactly YES or NO only.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Does this image contain any visible text, letters, numbers, labels, captions, logos, watermarks, or writing-like symbols?",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
    });

    const answer = response.choices[0]?.message?.content?.trim().toUpperCase() ?? "";
    if (answer.startsWith("YES")) {
      return true;
    }
    if (answer.startsWith("NO")) {
      return false;
    }
    return null;
  } catch {
    return null;
  }
}
