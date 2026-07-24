"use client";

import { motion } from "framer-motion";
import type { StatusLevel } from "@/lib/types/agent-data";
import { useRegionDateRange } from "@/components/region-manager/filters/RegionDateRangeContext";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { DURATION, EASING, STAGGER } from "@/lib/motion";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusDot } from "@/components/ui/StatusDot";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";

const BAR: Record<StatusLevel, string> = {
  success: "bg-success",
  warning: "bg-warning",
  risk: "bg-risk",
  critical: "bg-critical",
  neutral: "bg-neutral",
};

const TIERS: Array<{ key: StatusLevel; labelTr: string; labelEn: string; min: number }> = [
  { key: "success", labelTr: "Güçlü (≥85)", labelEn: "Strong (≥85)", min: 85 },
  { key: "warning", labelTr: "İyi (65-84)", labelEn: "Good (65-84)", min: 65 },
  { key: "risk", labelTr: "Gelişmeli (45-64)", labelEn: "Developing (45-64)", min: 45 },
  { key: "critical", labelTr: "Kritik (<45)", labelEn: "Critical (<45)", min: 0 },
];

/**
 * Bölge yetenek dağılımı — 120+ danışmanın Genel Başarı puanına göre dağılımı.
 * Bölge Müdürü "yetenek havuzunun sağlığı" — kütle yeşile mi, kırmızıya mı
 * toplanmış — tek bakışta görür.
 */
export function RegionTalentDistribution() {
  const reduced = usePrefersReducedMotion();
  const { data } = useRegionDateRange();
  const { t } = useLang();
  const total = data.agents.length || 1;

  const dist = TIERS.map((tier, idx) => {
    const upper = idx === 0 ? Infinity : TIERS[idx - 1].min;
    const count = data.agents.filter((a) => a.score >= tier.min && a.score < upper).length;
    return { ...tier, count };
  });

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint={t(
          "Bölgedeki tüm danışmanların Genel Başarı puanına göre dağılımı — yetenek havuzunun sağlık fotoğrafı.",
          "Distribution of all agents in the region by Overall Score — a health snapshot of the talent pool.",
        )}
      >
        <T tr="Bölge Yetenek Dağılımı" en="Region Talent Distribution" />
      </SectionTitle>
      <ul className="flex flex-1 flex-col justify-center gap-3">
        {dist.map((tier, index) => {
          const pct = (tier.count / total) * 100;
          return (
            <li key={tier.key} className="flex items-center gap-3">
              <StatusDot status={tier.key} />
              <span className="w-28 shrink-0 font-body text-[11.5px] text-fg-secondary">{t(tier.labelTr, tier.labelEn)}</span>
              <div className="relative h-5 flex-1">
                <motion.div
                  className={`flex h-full items-center rounded-[6px] ${BAR[tier.key]} pl-2 transition-[filter] duration-150`}
                  initial={{ width: reduced ? `${pct}%` : "0%" }}
                  animate={{ width: `${Math.max(pct, tier.count > 0 ? 6 : 0)}%` }}
                  transition={reduced ? { duration: 0 } : { duration: DURATION.chart, ease: EASING.out, delay: index * STAGGER.children }}
                >
                  {tier.count > 0 && <span className="font-mono text-[10.5px] font-semibold text-white">{tier.count}</span>}
                </motion.div>
              </div>
              <span className="w-10 shrink-0 text-right font-mono text-[11px] text-fg-muted">
                %{Math.round(pct)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
