"use client";

import { useLang } from "@/components/i18n/LanguageProvider";
import { cn } from "@/lib/utils/cn";

/**
 * TR/EN dil geçişi — tema toggle'ının yanında segmentli buton.
 * Aktif dil vurgulu; diğerine tıklayınca anında geçer.
 * `compact`: kenar çubuğu daraltılmışken segmentli pill yerine tek kare
 * buton — tıklayınca diğer dile geçer (mevcut dili kısaltma olarak gösterir).
 */
export function LanguageToggle({ compact = false }: { compact?: boolean } = {}) {
  const { lang, setLang } = useLang();

  if (compact) {
    const other = lang === "tr" ? "en" : "tr";
    const label =
      lang === "tr" ? "Dili İngilizce yap" : "Switch language to Turkish";
    return (
      <button
        type="button"
        onClick={() => setLang(other)}
        aria-label={label}
        title={label}
        className="flex h-10 w-10 items-center justify-center rounded-control border border-border bg-surface font-body text-[12px] font-semibold uppercase tracking-wide text-fg-secondary shadow-soft transition-colors hover:text-brand"
      >
        {lang}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={lang === "tr" ? "Dil seçimi" : "Language selection"}
      className="flex h-10 items-center rounded-control border border-border bg-surface p-0.5 shadow-soft"
    >
      {(["tr", "en"] as const).map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={active}
            className={cn(
              "flex h-full min-w-9 items-center justify-center rounded-[8px] px-2 font-body text-[12px] font-semibold uppercase tracking-wide transition-colors",
              active ? "bg-brand/12 text-brand" : "text-fg-muted hover:text-fg",
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
