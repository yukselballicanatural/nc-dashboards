"use client";

import type { StatusLevel } from "@/lib/types/agent-data";
import { useLang } from "@/components/i18n/LanguageProvider";
import { cn } from "@/lib/utils/cn";

/**
 * Semantik durum noktası — CLAUDE.md 3.1 durum renkleri (🟢🟡🟠🔴⚪).
 * Renk sınıfları statik map'te tutulur (Tailwind dinamik sınıf üretemez).
 */
const STATUS_BG: Record<StatusLevel, string> = {
  success: "bg-success",
  warning: "bg-warning",
  risk: "bg-risk",
  critical: "bg-critical",
  neutral: "bg-neutral",
};

const STATUS_LABEL: Record<StatusLevel, { tr: string; en: string }> = {
  success: { tr: "Başarılı / Hedefte", en: "Successful / On target" },
  warning: { tr: "Takip edilmeli", en: "Needs follow-up" },
  risk: { tr: "Riskli", en: "At risk" },
  critical: { tr: "Kritik", en: "Critical" },
  neutral: { tr: "Veri yok / Pasif", en: "No data / Inactive" },
};

export function StatusDot({
  status,
  className,
}: {
  status: StatusLevel;
  className?: string;
}) {
  const { t } = useLang();
  const label = STATUS_LABEL[status];
  return (
    <span
      role="img"
      aria-label={t(label.tr, label.en)}
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-pill",
        STATUS_BG[status],
        className,
      )}
    />
  );
}
