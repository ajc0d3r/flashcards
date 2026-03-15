import { LanguageCode } from "@/types/flashcard";
import { STYLE_VERSION } from "@/lib/safetyPrompt";

export function normalizeForKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function buildImageKey(themeId: string, englishWord: string): string {
  return `img:${STYLE_VERSION}:${normalizeForKey(themeId)}:${normalizeForKey(englishWord)}`;
}

export function buildAudioKey(englishWord: string, language: LanguageCode): string {
  return `aud:${STYLE_VERSION}:${normalizeForKey(englishWord)}:${language}`;
}

export function buildDeckKey(
  themeId: string,
  languages: LanguageCode[],
  customFingerprint: string,
): string {
  const langKey = [...languages].sort().join("-");
  return `deck:${STYLE_VERSION}:${normalizeForKey(themeId)}:${langKey}:${normalizeForKey(customFingerprint)}`;
}
