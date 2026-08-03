"use client";

import { useEffect } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSidebar } from "@/components/layout/SidebarProvider";
import { useLang } from "@/components/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/agent/layout/ThemeToggle";
import { ProfileChip } from "@/components/agent/layout/ProfileChip";
import { NotificationBell } from "@/components/agent/layout/NotificationBell";
import { TEAM_LEADER_PROFILE } from "@/lib/mock/team-leader-profile";
import { NavTabs } from "./NavTabs";
import { cn } from "@/lib/utils/cn";

/** Takım Lideri sol kenar çubuğu — agent Sidebar'ıyla aynı iskelet. */
export function Sidebar() {
  const { collapsed, toggleCollapsed } = useSidebar();
  const { t } = useLang();

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "76px" : "256px");
  }, [collapsed]);

  const toggleLabel = collapsed
    ? t("Menüyü genişlet", "Expand menu")
    : t("Menüyü daralt", "Collapse menu");

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-surface/95 backdrop-blur-xl shadow-soft transition-[width] duration-200 ease-out",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-border/60 px-4 py-4",
          collapsed && "justify-center px-0",
        )}
      >
        <BrandLogo height={collapsed ? 26 : 34} />
      </div>

      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={toggleLabel}
        title={toggleLabel}
        className="absolute -right-3 top-14 flex h-6 w-6 items-center justify-center rounded-pill border border-border bg-surface text-fg-secondary shadow-soft transition-colors hover:text-brand"
      >
        {collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
      </button>

      <div className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <NavTabs collapsed={collapsed} />
      </div>

      <div
        className={cn(
          "flex flex-col gap-3 border-t border-border/60 px-3 py-3",
          collapsed && "items-center px-2",
        )}
      >
        <div className={cn("flex items-center gap-1.5", collapsed ? "flex-col" : "justify-center")}>
          <NotificationBell />
          <LanguageToggle compact={collapsed} />
          <ThemeToggle />
        </div>
        <ProfileChip profile={TEAM_LEADER_PROFILE} collapsed={collapsed} />
      </div>

      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-px"
        style={{
          backgroundImage:
            "linear-gradient(180deg, transparent 0%, var(--brand) 30%, var(--violet) 70%, transparent 100%)",
          opacity: 0.5,
        }}
      />
    </aside>
  );
}
