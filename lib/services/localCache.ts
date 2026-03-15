import fs from "node:fs";
import path from "node:path";

const CACHE_DIR = path.join(process.cwd(), "generated");

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ── Images ──

function imagePath(themeId: string, englishWord: string): string {
  const dir = path.join(CACHE_DIR, "images", sanitize(themeId));
  ensureDir(dir);
  return path.join(dir, `${sanitize(englishWord)}.png`);
}

export function getCachedImageFile(
  themeId: string,
  englishWord: string,
): string | null {
  const filePath = imagePath(themeId, englishWord);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const base64 = fs.readFileSync(filePath).toString("base64");
  return `data:image/png;base64,${base64}`;
}

export async function cacheImageFile(
  themeId: string,
  englishWord: string,
  imageUrl: string,
): Promise<void> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(imagePath(themeId, englishWord), buffer);
  } catch {
    // Non-critical — skip if download fails
  }
}

// ── Audio ──

function audioPath(englishWord: string, language: string): string {
  const dir = path.join(CACHE_DIR, "audio");
  ensureDir(dir);
  return path.join(dir, `${sanitize(englishWord)}-${language}.mp3`);
}

export function getCachedAudioFile(
  englishWord: string,
  language: string,
): string | null {
  const filePath = audioPath(englishWord, language);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const base64 = fs.readFileSync(filePath).toString("base64");
  return `data:audio/mpeg;base64,${base64}`;
}

export function cacheAudioFile(
  englishWord: string,
  language: string,
  audioDataUrl: string,
): void {
  try {
    const base64 = audioDataUrl.split(",")[1];
    if (!base64) {
      return;
    }
    fs.writeFileSync(audioPath(englishWord, language), Buffer.from(base64, "base64"));
  } catch {
    // Non-critical — skip if write fails
  }
}
