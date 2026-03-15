import { FlashcardCard, LanguageCode } from "@/types/flashcard";
import { Flashcard } from "@/components/Flashcard";

interface CardGridProps {
  cards: FlashcardCard[];
  selectedLanguages: LanguageCode[];
  loadingAudioKey: string | null;
  onPlayAudio: (card: FlashcardCard, language: LanguageCode) => Promise<void>;
}

export function CardGrid({
  cards,
  selectedLanguages,
  loadingAudioKey,
  onPlayAudio,
}: CardGridProps) {
  return (
    <div className="grid h-full min-h-0 grid-cols-3 gap-2 md:gap-3">
      {cards.map((card) => (
        <Flashcard
          key={card.id}
          card={card}
          selectedLanguages={selectedLanguages}
          isAudioLoading={Boolean(loadingAudioKey?.startsWith(`${card.id}:`))}
          onPlayAudio={onPlayAudio}
        />
      ))}
    </div>
  );
}
