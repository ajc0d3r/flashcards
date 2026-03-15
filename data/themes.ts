import { ThemeOption } from "@/types/flashcard";

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "animals",
    label: "Animals",
    description: "Friendly animals toddlers can recognize quickly.",
  },
  {
    id: "transport",
    label: "Transport",
    description: "Common vehicles from daily life.",
  },
  {
    id: "house-items",
    label: "House Items",
    description: "Safe household objects children see often.",
  },
  {
    id: "fruits",
    label: "Fruits",
    description: "Soft and colorful fruits for beginner learning.",
  },
  {
    id: "colors",
    label: "Colors",
    description: "Core colors with simple visual examples.",
  },
  {
    id: "custom",
    label: "Custom Theme",
    description: "Bring your own toddler-safe words.",
  },
];

export const BUILT_IN_THEME_IDS = THEME_OPTIONS.filter(
  (theme) => theme.id !== "custom",
).map((theme) => theme.id);
