"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserRound,
  Filter,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useLang } from "@/components/i18n/LanguageProvider";

/** Bölge Müdürü ana menüsü — 5 sekme. */

interface NavItem {
  href: string;
  labelTr: string;
  labelEn: string;
  icon: LucideIcon;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/region-manager", labelTr: "Bölge Özeti", labelEn: "Region Overview", icon: LayoutDashboard, exact: true },
  { href: "/region-manager/takimlar", labelTr: "Takım Karşılaştırması", labelEn: "Team Comparison", icon: Users },
  { href: "/region-manager/agentlar", labelTr: "Agent Sıralaması", labelEn: "Agent Ranking", icon: UserRound },
  { href: "/region-manager/funnel", labelTr: "Funnel & Dönüşüm", labelEn: "Funnel & Conversion", icon: Filter },
  { href: "/region-manager/aksiyon-risk", labelTr: "Aksiyon & Risk", labelEn: "Action & Risk", icon: ShieldAlert },
];

export function NavTabs({ collapsed = false }: { collapsed?: boolean } = {}) {
  const pathname = usePathname();
  const { t } = useLang();

  return (
    <nav aria-label={t("Bölge Müdürü paneli menüsü", "Region Manager panel menu")} className="w-full">
      <ul className="flex w-full flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          const label = t(item.labelTr, item.labelEn);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                title={collapsed ? label : undefined}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-control px-3 py-2.5 font-body text-[13px] font-medium transition-colors",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-brand/10 text-brand"
                    : "text-fg-secondary hover:bg-elevated hover:text-fg",
                )}
              >
                <Icon size={16} strokeWidth={2} className="shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
