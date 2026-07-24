"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useLang } from "@/components/i18n/LanguageProvider";

/**
 * Güneş/ay tema toggle'ı — CLAUDE.md 4.1.
 * Dekoratif animasyon yok; yalnızca tema geçişinin kendisi (280ms crossfade,
 * ThemeProvider yönetir) ve standart hover durumu.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLang();
  const isLight = theme === "light";
  const themeLabel = isLight
    ? t("Koyu temaya geç", "Switch to dark theme")
    : t("Açık temaya geç", "Switch to light theme");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={themeLabel}
      title={themeLabel}
      className="flex h-10 w-10 items-center justify-center rounded-control border border-border bg-surface text-fg-secondary shadow-soft transition-colors hover:text-fg"
    >
      {isLight ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}
