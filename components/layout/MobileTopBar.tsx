"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "@/components/layout/SidebarProvider";
import { useLang } from "@/components/i18n/LanguageProvider";
import { BrandLogo } from "@/components/ui/BrandLogo";

/**
 * MOBİL/TABLET ÜST BARI — yalnızca `lg` altında görünür.
 *
 * Masaüstünde sol kenar çubuğu sabit ve her zaman açıktır; dar ekranlarda ise
 * 256px'lik sabit çubuk içeriğin üzerine biniyordu (kullanılamaz hâle
 * getiriyordu). Bu barın hamburger butonu çubuğu çekmece olarak açar, içerik
 * tam genişlikte kalır.
 *
 * Dört rolün layout'u da bu tek bileşeni kullanır.
 */
export function MobileTopBar() {
  const { toggleMobile, mobileOpen } = useSidebar();
  const { t } = useLang();

  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface/90 px-4 py-2.5 backdrop-blur-xl lg:hidden">
      <button
        type="button"
        onClick={toggleMobile}
        aria-label={t("Menüyü aç", "Open menu")}
        aria-expanded={mobileOpen}
        className="flex h-9 w-9 items-center justify-center rounded-control border border-border text-fg-secondary transition-colors hover:border-brand/40 hover:text-brand"
      >
        <Menu size={17} aria-hidden />
      </button>
      <BrandLogo height={26} />
    </div>
  );
}
