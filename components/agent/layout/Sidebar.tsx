"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useSidebar } from "@/components/layout/SidebarProvider";
import { useLang } from "@/components/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "./ThemeToggle";
import { ProfileChip } from "./ProfileChip";
import { NotificationBell } from "./NotificationBell";
import { NavTabs } from "./NavTabs";
import { cn } from "@/lib/utils/cn";

/**
 * Sol kenar çubuğu — v3 düzeni (kullanıcı kararı: üst header yerine CRM
 * tarzı açılır/kapanır sol menü). Eski TopNav'daki tüm içerik (marka, menü,
 * bildirim, dil, tema, profil) burada dikey olarak toplanır.
 * Genişlik `--sidebar-w` CSS değişkenine yazılır; layout.tsx bu değişkeni
 * ana içerik sütununun sol boşluğu için okur (server component kalabilsin).
 *
 * MOBİL/TABLET (`lg` altı): çubuk çekmece olarak davranır — varsayılan kapalı,
 * MobileTopBar'daki hamburger ile açılır, arka plan karartması veya Esc ile
 * kapanır. Sayfa değişince otomatik kapanır. Bu kırılımda "daraltılmış"
 * (76px) mod uygulanmaz; çekmece tam genişlikte açılır.
 */
export function Sidebar() {
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { t } = useLang();
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "76px" : "256px");
  }, [collapsed]);

  // Sayfa değiştiğinde çekmeceyi kapat — mobilde menüden bir sekmeye
  // gidildiğinde çubuk açık kalmamalı.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Esc ile kapatma (klavye erişilebilirliği — CLAUDE.md 7).
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, setMobileOpen]);

  /**
   * İÇERİK daraltması, GENİŞLİK daraltmasından ayrıdır: mobil çekmece tam
   * genişlikte açıldığı için orada etiketler görünmeli. Masaüstünde
   * `mobileOpen` her zaman false olduğundan davranış değişmez.
   */
  const contentCollapsed = collapsed && !mobileOpen;

  const toggleLabel = collapsed
    ? t("Menüyü genişlet", "Expand menu")
    : t("Menüyü daralt", "Collapse menu");

  return (
    <>
    {/* Arka plan karartması — yalnızca mobil çekmece açıkken */}
    {mobileOpen && (
      <button
        type="button"
        aria-label={t("Menüyü kapat", "Close menu")}
        onClick={() => setMobileOpen(false)}
        className="fixed inset-0 z-30 bg-black/45 backdrop-blur-[2px] lg:hidden"
      />
    )}

    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-surface/95 backdrop-blur-xl shadow-soft transition-[width,transform] duration-200 ease-out",
        // Mobilde daraltılmış mod yok: çekmece tam genişlikte açılır.
        collapsed ? "w-64 lg:w-[76px]" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      {/* Çekmeceyi kapatma butonu — yalnızca mobilde */}
      <button
        type="button"
        onClick={() => setMobileOpen(false)}
        aria-label={t("Menüyü kapat", "Close menu")}
        className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-control border border-border text-fg-secondary transition-colors hover:text-brand lg:hidden"
      >
        <X size={15} aria-hidden />
      </button>

      <div
        className={cn(
          "flex items-center border-b border-border/60 px-4 py-4",
          contentCollapsed && "justify-center px-0",
        )}
      >
        <BrandLogo height={contentCollapsed ? 26 : 34} />
      </div>

      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={toggleLabel}
        title={toggleLabel}
        className="absolute -right-3 top-14 hidden h-6 w-6 items-center justify-center rounded-pill border border-border bg-surface text-fg-secondary shadow-soft transition-colors hover:text-brand lg:flex"
      >
        {collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
      </button>

      <div className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <NavTabs collapsed={contentCollapsed} />
      </div>

      <div
        className={cn(
          "flex flex-col gap-3 border-t border-border/60 px-3 py-3",
          contentCollapsed && "items-center px-2",
        )}
      >
        <div className={cn("flex items-center gap-1.5", contentCollapsed ? "flex-col" : "justify-center")}>
          <NotificationBell />
          <LanguageToggle compact={contentCollapsed} />
          <ThemeToggle />
        </div>
        <ProfileChip collapsed={contentCollapsed} />
      </div>

      {/* İmza öğe — ince marka gradient hattı (CLAUDE.md Bölüm 6), sağ kenarda dikey */}
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
    </>
  );
}
