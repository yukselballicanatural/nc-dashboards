"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PhoneCall,
  ListChecks,
  Medal,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/components/i18n/LanguageProvider";
import { cn } from "@/lib/utils/cn";

/**
 * Ana menü — dashboard + 3 sayfa (kullanıcı kararı: 7 sekme yerine
 * "detaylı dashboard + 2-3 menü"). Dar ekranda yatay kaydırmalı.
 */

interface NavItem {
  href: string;
  label: string;
  labelEn: string;
  icon: LucideIcon;
  /** true → yalnızca birebir eşleşmede aktif (kök dashboard için). */
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/agent", label: "Dashboard", labelEn: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/agent/aramalar", label: "Aramalar & Funnel", labelEn: "Calls & Funnel", icon: PhoneCall },
  { href: "/agent/follow-up", label: "Follow-up", labelEn: "Follow-up", icon: ListChecks },
  { href: "/agent/performans", label: "Performansım", labelEn: "My Performance", icon: Medal },
];

export function NavTabs() {
  const pathname = usePathname();
  const { t } = useLang();

  return (
    <nav
      aria-label={t("Agent paneli menüsü", "Agent panel menu")}
      className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex items-center justify-center gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-2 rounded-control px-3.5 py-2 font-body text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-brand/10 text-brand"
                    : "text-fg-secondary hover:bg-surface hover:text-fg",
                )}
              >
                <Icon size={15} strokeWidth={2} />
                <span className="hidden sm:inline">{t(item.label, item.labelEn)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
