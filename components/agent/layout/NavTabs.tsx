"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PhoneCall,
  ListChecks,
  Medal,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/components/i18n/LanguageProvider";
import { cn } from "@/lib/utils/cn";

/**
 * Ana menü — dashboard + 3 sayfa (kullanıcı kararı: 7 sekme yerine
 * "detaylı dashboard + 2-3 menü"). Sol kenar çubuğu içinde dikey liste
 * (CRM tarzı); `collapsed` true olduğunda yalnızca ikonlar + tooltip.
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
  { href: "/agent/pdks", label: "Mesai & PDKS", labelEn: "Attendance & Hours", icon: Clock },
];

export function NavTabs({ collapsed = false }: { collapsed?: boolean } = {}) {
  const pathname = usePathname();
  const { t } = useLang();

  return (
    <nav aria-label={t("Agent paneli menüsü", "Agent panel menu")} className="w-full">
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
