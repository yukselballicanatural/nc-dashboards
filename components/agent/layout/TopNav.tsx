"use client";

import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { ProfileChip } from "./ProfileChip";
import { NavTabs } from "./NavTabs";
import { NotificationBell } from "./NotificationBell";
import { BrandLogo } from "@/components/ui/BrandLogo";

/**
 * Üst navigasyon — v2 düzeni (kullanıcı kararı: dashboard + 3 menü sayfası).
 * Sol: marka rozeti · Orta: menü · Sağ: bildirim + tema toggle + profil çipi.
 * Alt kenarda ince marka gradient hattı (görsel imza).
 */
export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Marka rozeti — gerçek logo, saydam zeminde (koyu temada beyaz versiyon) */}
        <div className="flex shrink-0 items-center">
          <BrandLogo height={40} />
        </div>

        {/* Menü */}
        <NavTabs />

        {/* Sağ: bildirim + tema + profil */}
        <div className="flex shrink-0 items-center gap-2">
          <NotificationBell />
          <LanguageToggle />
          <ThemeToggle />
          <ProfileChip />
        </div>
      </div>

      {/* Alt marka gradient hattı */}
      <div
        aria-hidden
        className="h-px w-full"
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent 0%, var(--brand) 30%, var(--violet) 70%, transparent 100%)",
          opacity: 0.5,
        }}
      />
    </header>
  );
}
