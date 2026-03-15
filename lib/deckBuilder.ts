import { VOCABULARY_BY_THEME } from "@/data/vocabulary";
import {
  CustomWordInput,
  FlashcardDeck,
  FlashcardWord,
  GenerateSetRequest,
  LanguageCode,
} from "@/types/flashcard";

const DECK_SIZE = 9;

export function buildDeckFromRequest(request: GenerateSetRequest): FlashcardDeck {
  const languages = normalizeLanguages(request.languages);
  const sourceWords =
    request.themeId === "custom"
      ? buildCustomWords(request.customWords ?? [])
      : [...(VOCABULARY_BY_THEME[request.themeId] ?? [])];

  if (sourceWords.length === 0) {
    throw new Error("No words available for selected theme.");
  }

  const selectionSeed = buildSelectionSeed(request, sourceWords, languages);
  const cards = pickWords(sourceWords, DECK_SIZE, selectionSeed);
  return {
    id: `deck-${Date.now()}`,
    themeId: request.themeId,
    customThemeName: request.customThemeName,
    languages,
    cards,
    source: "generated",
    createdAt: new Date().toISOString(),
  };
}

function buildCustomWords(words: CustomWordInput[]): FlashcardWord[] {
  return words
    .map((word, index) => {
      const english = word.en?.trim();
      if (!english) {
        return null;
      }
      return {
        id: `custom-${index}-${english.toLowerCase().replace(/\s+/g, "-")}`,
        themeId: "custom",
        translations: {
          en: english,
          hi: word.hi?.trim() || english,
          zh: word.zh?.trim() || english,
          ar: word.ar?.trim() || english,
        },
      } satisfies FlashcardWord;
    })
    .filter((word): word is FlashcardWord => Boolean(word));
}

function pickWords(words: FlashcardWord[], count: number, seed: number): FlashcardWord[] {
  const bag = deterministicShuffle(words, seed);

  if (bag.length >= count) {
    return bag.slice(0, count);
  }

  const repeated: FlashcardWord[] = [];
  for (let i = 0; i < count; i += 1) {
    const source = bag[i % bag.length];
    repeated.push({
      ...source,
      id: `${source.id}-${Math.floor(i / bag.length)}`,
    });
  }
  return repeated;
}

function deterministicShuffle<T>(items: T[], seed: number): T[] {
  const array = [...items];
  const random = createSeededRandom(seed);
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function normalizeLanguages(languages: LanguageCode[]): LanguageCode[] {
  const deduped = Array.from(new Set(languages));
  if (deduped.length > 0) {
    return deduped;
  }
  return ["en", "hi"];
}

function buildSelectionSeed(
  request: GenerateSetRequest,
  words: FlashcardWord[],
  languages: LanguageCode[],
): number {
  const seedInput = JSON.stringify({
    themeId: request.themeId,
    customThemeName: request.customThemeName ?? "",
    customWords: request.customWords ?? [],
    wordIds: words.map((word) => word.id),
    languages: [...languages].sort(),
  });
  return hashString(seedInput);
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
