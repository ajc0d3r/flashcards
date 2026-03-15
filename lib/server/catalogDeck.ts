import "server-only";
import { getCardsForTheme, hasThemeCatalog } from "@/lib/server/catalogDb";
import { FlashcardDeck, LanguageCode } from "@/types/flashcard";

export function loadSeededDeckForTheme(
  themeId: string,
  languages: LanguageCode[],
): FlashcardDeck | null {
  if (!hasThemeCatalog(themeId, 9)) {
    return null;
  }

  const cards = getCardsForTheme(themeId).slice(0, 9);
  if (cards.length < 9) {
    return null;
  }

  return {
    id: `seeded-${themeId}-${Date.now()}`,
    themeId,
    languages,
    cards,
    source: "seeded",
    createdAt: new Date().toISOString(),
  };
}
