import { THEME_OPTIONS } from "@/data/themes";

interface ThemeSelectorProps {
  selectedThemeId: string;
  customThemeName: string;
  customWordsText: string;
  onThemeChange: (themeId: string) => void;
  onCustomThemeNameChange: (value: string) => void;
  onCustomWordsTextChange: (value: string) => void;
}

export function ThemeSelector({
  selectedThemeId,
  customThemeName,
  customWordsText,
  onThemeChange,
  onCustomThemeNameChange,
  onCustomWordsTextChange,
}: ThemeSelectorProps) {
  return (
    <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100">
      <h2 className="text-2xl font-bold text-violet-900">1) Choose Theme</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {THEME_OPTIONS.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => onThemeChange(theme.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              selectedThemeId === theme.id
                ? "border-violet-500 bg-violet-50 shadow-sm"
                : "border-violet-100 bg-white hover:border-violet-300"
            }`}
          >
            <p className="text-lg font-semibold text-violet-900">{theme.label}</p>
            <p className="mt-1 text-sm text-violet-700">{theme.description}</p>
          </button>
        ))}
      </div>

      {selectedThemeId === "custom" ? (
        <div className="space-y-3 rounded-2xl bg-violet-50 p-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-violet-900">
              Custom Theme Name
            </span>
            <input
              value={customThemeName}
              onChange={(event) => onCustomThemeNameChange(event.target.value)}
              placeholder="My Family Words"
              className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-violet-900 outline-none focus:border-violet-500"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-violet-900">
              Custom Words
            </span>
            <textarea
              value={customWordsText}
              onChange={(event) => onCustomWordsTextChange(event.target.value)}
              placeholder="cat|बिल्ली|猫|قطة, moon|चाँद|月亮|قمر"
              className="min-h-24 rounded-xl border border-violet-200 bg-white px-3 py-2 text-violet-900 outline-none focus:border-violet-500"
            />
            <span className="text-xs text-violet-700">
              Use comma-separated items. Format per item:
              {" "}
              <code>en|hi|zh|ar</code>
              {" "}
              (missing translations fall back to English).
            </span>
          </label>
        </div>
      ) : null}
    </section>
  );
}
