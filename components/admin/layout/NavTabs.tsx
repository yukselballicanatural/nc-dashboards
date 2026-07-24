"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UploadCloud, UsersRound, ScrollText, type LucideIcon } from "lucide-react";
import { T } from "@/components/i18n/T";
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

export function NavTabs() {
  const pathname = usePathname();
  const { t } = useLang();

  return (
    <nav aria-label={t("Admin paneli menüsü", "Admin panel menu")} className="-mx-1 overflow-x-auto py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="flex w-full items-center justify-center gap-1.5 px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-2 rounded-control px-3.5 py-2 font-body text-[13px] font-medium transition-colors",
                  isActive ? "bg-brand/10 text-brand" : "text-fg-secondary hover:bg-surface hover:text-fg",
                )}
              >
                <Icon size={15} strokeWidth={2} />
                <span className="hidden sm:inline"><T tr={item.labelTr} en={item.labelEn} /></span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
