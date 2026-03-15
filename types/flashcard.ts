export type LanguageCode = "en" | "hi" | "zh" | "ar";

export interface WordTranslations {
  en: string;
  hi: string;
  zh: string;
  ar: string;
}

export interface FlashcardWord {
  id: string;
  themeId: string;
  translations: WordTranslations;
}

export interface FlashcardCard extends FlashcardWord {
  imageUrl?: string;
  audioUrls?: Partial<Record<LanguageCode, string>>;
}

export interface FlashcardDeck {
  id: string;
  themeId: string;
  customThemeName?: string;
  languages: LanguageCode[];
  cards: FlashcardCard[];
  source?: "seeded" | "generated";
  createdAt: string;
}

export interface ThemeOption {
  id: string;
  label: string;
  description: string;
}

export interface CustomWordInput {
  en: string;
  hi?: string;
  zh?: string;
  ar?: string;
}

export interface GenerateSetRequest {
  themeId: string;
  languages: LanguageCode[];
  customThemeName?: string;
  customWords?: CustomWordInput[];
}

export interface GenerateSetResponse {
  deck: FlashcardDeck;
}

export interface GenerateImageRequest {
  themeId: string;
  word: WordTranslations;
}

export interface GenerateImageResponse {
  imageUrl: string;
  provider: "fal" | "fallback";
}

export interface GenerateAudioRequest {
  englishWord: string;
  text: string;
  language: LanguageCode;
}

export interface GenerateAudioResponse {
  audioDataUrl?: string;
  provider: "google" | "fallback";
  error?: string;
}
