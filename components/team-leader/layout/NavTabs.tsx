"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Activity,
  Filter,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useLang } from "@/components/i18n/LanguageProvider";

/**
 * Takım Lideri ana menüsü — CLAUDE.md Bölüm 9'da kararlaştırılan 5 sekme.
 */

interface NavItem {
  href: string;
  label: string;
  labelEn: string;
  icon: LucideIcon;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/team-leader", label: "Takım Özeti", labelEn: "Team Overview", icon: LayoutDashboard, exact: true },
  { href: "/team-leader/karsilastirma", label: "Agent Karşılaştırması", labelEn: "Agent Comparison", icon: Users },
  { href: "/team-leader/saatlik-aktivite", label: "Saatlik Aktivite", labelEn: "Hourly Activity", icon: Activity },
  { href: "/team-leader/funnel-backlog", label: "Funnel & Backlog", labelEn: "Funnel & Backlog", icon: Filter },
  { href: "/team-leader/aksiyon-merkezi", label: "Aksiyon Merkezi", labelEn: "Action Center", icon: ListChecks },
];

export function NavTabs({ collapsed = false }: { collapsed?: boolean } = {}) {
  const pathname = usePathname();
  const { t } = useLang();

  return (
    <nav aria-label={t("Takım Lideri paneli menüsü", "Team Leader panel menu")} className="w-full">
      <ul className="flex w-full flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          const label = t(item.label, item.labelEn);
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
