"use client";

import { ThemeToggle } from "@/components/agent/layout/ThemeToggle";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { ProfileChip } from "@/components/agent/layout/ProfileChip";
import { NotificationBell } from "@/components/agent/layout/NotificationBell";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ADMIN_PROFILE } from "@/lib/mock/admin-profile";
import { NavTabs } from "./NavTabs";

/** Admin üst navigasyonu — iki satırlı. */
export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-2.5">
          <div className="flex shrink-0 items-center">
            <BrandLogo height={38} />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell />
            <LanguageToggle />
            <ThemeToggle />
            <ProfileChip profile={ADMIN_PROFILE} />
          </div>
        </div>

        <div className="border-t border-border/60">
          <NavTabs />
        </div>
      </div>

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
