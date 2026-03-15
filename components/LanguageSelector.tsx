import { DEFAULT_LANGUAGES, LANGUAGE_OPTIONS } from "@/lib/languages";
import { LanguageCode } from "@/types/flashcard";

interface LanguageSelectorProps {
  selectedLanguages: LanguageCode[];
  onChange: (languages: LanguageCode[]) => void;
}

export function LanguageSelector({
  selectedLanguages,
  onChange,
}: LanguageSelectorProps) {
  function toggleLanguage(code: LanguageCode) {
    const exists = selectedLanguages.includes(code);
    const next = exists
      ? selectedLanguages.filter((language) => language !== code)
      : [...selectedLanguages, code];

    onChange(next.length > 0 ? next : DEFAULT_LANGUAGES);
  }

  return (
    <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100">
      <h2 className="text-2xl font-bold text-violet-900">2) Choose Languages</h2>
      <div className="flex flex-wrap gap-3">
        {LANGUAGE_OPTIONS.map((language) => (
          <button
            key={language.code}
            type="button"
            onClick={() => toggleLanguage(language.code)}
            className={`rounded-full border px-4 py-2 text-base font-semibold transition ${
              selectedLanguages.includes(language.code)
                ? "border-violet-500 bg-violet-600 text-white"
                : "border-violet-200 bg-white text-violet-900 hover:border-violet-400"
            }`}
            aria-pressed={selectedLanguages.includes(language.code)}
          >
            {language.label}
          </button>
        ))}
      </div>
    </section>
  );
}
