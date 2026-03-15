import { describe, expect, it } from "vitest";
import { buildDeckFromRequest } from "@/lib/deckBuilder";
import { buildDeckKey } from "@/lib/storage/cacheKeys";

describe("flashcard deck generation", () => {
  it("creates exactly 9 cards for a built-in theme", () => {
    const deck = buildDeckFromRequest({
      themeId: "animals",
      languages: ["en", "hi", "zh", "ar"],
    });

    expect(deck.cards).toHaveLength(9);
    expect(deck.languages).toEqual(["en", "hi", "zh", "ar"]);
  });

  it("repeats safely when custom words are fewer than 9", () => {
    const deck = buildDeckFromRequest({
      themeId: "custom",
      customThemeName: "My Words",
      languages: ["en", "ar"],
      customWords: [
        { en: "moon", ar: "قمر" },
        { en: "star", ar: "نجمة" },
      ],
    });

    expect(deck.cards).toHaveLength(9);
    expect(deck.cards.every((card) => Boolean(card.translations.en))).toBe(true);
  });

  it("builds stable deck cache key for same inputs", () => {
    const first = buildDeckKey("animals", ["hi", "en"], "built-in");
    const second = buildDeckKey("animals", ["en", "hi"], "built-in");
    expect(first).toBe(second);
  });

  it("selects cards deterministically for same request", () => {
    const request = {
      themeId: "fruits",
      languages: ["en", "hi", "zh", "ar"] as const,
    };
    const firstDeck = buildDeckFromRequest(request);
    const secondDeck = buildDeckFromRequest(request);

    expect(firstDeck.cards.map((card) => card.id)).toEqual(
      secondDeck.cards.map((card) => card.id),
    );
  });
});
