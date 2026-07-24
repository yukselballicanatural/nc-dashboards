import type { StatusLevel } from "@/lib/types/agent-data";
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

const STATUS_LABEL: Record<StatusLevel, string> = {
  success: "Başarılı / Hedefte",
  warning: "Takip edilmeli",
  risk: "Riskli",
  critical: "Kritik",
  neutral: "Veri yok / Pasif",
};

export function StatusDot({
  status,
  className,
}: {
  status: StatusLevel;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={STATUS_LABEL[status]}
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-pill",
        STATUS_BG[status],
        className,
      )}
    />
  );
}
