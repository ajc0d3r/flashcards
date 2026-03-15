import fs from "node:fs";
import path from "node:path";
import { THEME_OPTIONS } from "../data/themes";
import { VOCABULARY_BY_THEME } from "../data/vocabulary";
import { generateToddlerImage } from "../lib/services/falClient";
import { generateToddlerAudioDataUrl } from "../lib/services/googleTtsClient";
import {
  upsertCard,
  upsertCardAudio,
  upsertTheme,
} from "../lib/server/catalogDb";
import { LanguageCode } from "../types/flashcard";

const BUILTIN_THEME_IDS = ["animals", "transport", "house-items", "fruits", "colors"];
const LANGUAGES: LanguageCode[] = ["en", "hi", "zh", "ar"];
const CARDS_PER_THEME = 9;

const fromFilesOnly = process.argv.includes("--from-files-only");

async function run() {
  for (const themeId of BUILTIN_THEME_IDS) {
    const theme = THEME_OPTIONS.find((item) => item.id === themeId);
    if (!theme) {
      continue;
    }

    upsertTheme(themeId, theme.label, true);
    const words = (VOCABULARY_BY_THEME[themeId] ?? []).slice(0, CARDS_PER_THEME);

    if (words.length < CARDS_PER_THEME) {
      throw new Error(
        `Theme "${themeId}" has ${words.length} words. At least ${CARDS_PER_THEME} required.`,
      );
    }

    for (let index = 0; index < words.length; index += 1) {
      const word = words[index];
      const imageUrl = await ensureCardImage(themeId, word.id, word.translations);
      if (!imageUrl) {
        throw new Error(`Missing image for ${word.id}`);
      }

      upsertCard({
        id: word.id,
        themeId,
        sortOrder: index,
        translations: word.translations,
        imageUrl,
      });

      for (const language of LANGUAGES) {
        const audioUrl = await ensureCardAudio(themeId, word.id, language, word.translations[language]);
        if (!audioUrl) {
          throw new Error(`Missing audio for ${word.id} (${language})`);
        }
        upsertCardAudio(word.id, language, audioUrl);
      }
    }
  }

  process.stdout.write("Built-in catalog seeded successfully.\n");
}

async function ensureCardImage(
  themeId: string,
  cardId: string,
  translations: { en: string; hi: string; zh: string; ar: string },
): Promise<string | undefined> {
  const imageDir = path.join(process.cwd(), "public", "seed", "images", themeId);
  fs.mkdirSync(imageDir, { recursive: true });

  const existingImage = findExistingAsset(imageDir, cardId, [".png", ".jpg", ".jpeg", ".webp"]);
  if (existingImage) {
    return `/seed/images/${themeId}/${existingImage}`;
  }
  if (fromFilesOnly) {
    return undefined;
  }

  const remoteImageUrl = await generateToddlerImage(themeId, translations);
  if (!remoteImageUrl) {
    return undefined;
  }

  const response = await fetch(remoteImageUrl);
  if (!response.ok) {
    return undefined;
  }
  const contentType = response.headers.get("content-type") ?? "image/png";
  const extension = toImageExtension(contentType);
  const fileName = `${cardId}${extension}`;
  const filePath = path.join(imageDir, fileName);
  const data = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, data);
  return `/seed/images/${themeId}/${fileName}`;
}

async function ensureCardAudio(
  themeId: string,
  cardId: string,
  language: LanguageCode,
  text: string,
): Promise<string | undefined> {
  const audioDir = path.join(process.cwd(), "public", "seed", "audio", themeId);
  fs.mkdirSync(audioDir, { recursive: true });

  const fileName = `${cardId}-${language}.mp3`;
  const filePath = path.join(audioDir, fileName);
  if (fs.existsSync(filePath)) {
    return `/seed/audio/${themeId}/${fileName}`;
  }
  if (fromFilesOnly) {
    return undefined;
  }

  const audioDataUrl = await generateToddlerAudioDataUrl(text, language);
  if (!audioDataUrl) {
    return undefined;
  }

  const base64 = audioDataUrl.split(",")[1];
  if (!base64) {
    return undefined;
  }
  fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
  return `/seed/audio/${themeId}/${fileName}`;
}

function findExistingAsset(
  directory: string,
  baseName: string,
  extensions: string[],
): string | undefined {
  for (const extension of extensions) {
    const fileName = `${baseName}${extension}`;
    if (fs.existsSync(path.join(directory, fileName))) {
      return fileName;
    }
  }
  return undefined;
}

function toImageExtension(contentType: string): ".png" | ".jpg" | ".webp" {
  if (contentType.includes("webp")) {
    return ".webp";
  }
  if (contentType.includes("jpeg") || contentType.includes("jpg")) {
    return ".jpg";
  }
  return ".png";
}

void run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
