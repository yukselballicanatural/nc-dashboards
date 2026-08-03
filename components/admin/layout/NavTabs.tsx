"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UploadCloud, UsersRound, ScrollText, type LucideIcon } from "lucide-react";
import { useLang } from "@/components/i18n/LanguageProvider";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  labelTr: string;
  labelEn: string;
  icon: LucideIcon;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", labelTr: "Genel Bakış", labelEn: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/veri-yukleme", labelTr: "Veri Yükleme", labelEn: "Data Upload", icon: UploadCloud },
  { href: "/admin/kullanicilar", labelTr: "Kullanıcılar", labelEn: "Users", icon: UsersRound },
  { href: "/admin/loglar", labelTr: "Loglar", labelEn: "Logs", icon: ScrollText },
];

export function NavTabs({ collapsed = false }: { collapsed?: boolean } = {}) {
  const pathname = usePathname();
  const { t } = useLang();

  return (
    <nav aria-label={t("Admin paneli menüsü", "Admin panel menu")} className="w-full">
      <ul className="flex w-full flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
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
                  isActive ? "bg-brand/10 text-brand" : "text-fg-secondary hover:bg-elevated hover:text-fg",
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
