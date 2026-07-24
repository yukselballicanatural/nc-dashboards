"use client";

import { motion } from "framer-motion";
import { useDateRange } from "@/components/agent/filters/DateRangeContext";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import type { StatusLevel } from "@/lib/types/agent-data";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { DURATION, EASING, STAGGER } from "@/lib/motion";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { HoverTip } from "@/components/ui/HoverTip";
import { cn } from "@/lib/utils/cn";

/**
 * Speed-to-Lead dağılımı — v2 4.2: yeni lead'e İLK aramayı ne kadar hızlı
 * yaptığının 7 kovalı dağılımı. 15dk SLA eşiğinden farklı/tamamlayıcı:
 * burada amaç dağılımın tamamını görmek. Kritikleştikçe sıcak renk (3.1).
 */

const STATUS_BG: Record<StatusLevel, string> = {
  success: "bg-success",
  warning: "bg-warning",
  risk: "bg-risk",
  critical: "bg-critical",
  neutral: "bg-neutral",
};

export function SpeedToLeadChart() {
  const reduced = usePrefersReducedMotion();
  const { data } = useDateRange();
  const { t } = useLang();
  const SPEED_TO_LEAD = data.speedToLead;
  const total = SPEED_TO_LEAD.reduce((s, b) => s + b.count, 0);
  const max = Math.max(...SPEED_TO_LEAD.map((b) => b.count), 1);

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint={t(
          "Lead geldikten sonra ilk aramayı ne kadar hızlı yaptın? İlk 15 dakika altın penceredir — sıcak renkler kaçan fırsattır.",
          "How fast did you make the first call after a lead came in? The first 15 minutes are the golden window — warm colors are missed opportunities.",
        )}
      >
        <T tr="Speed-to-Lead Dağılımı" en="Speed-to-Lead Distribution" />
      </SectionTitle>

      {total > 0 ? (
        <ul className="flex flex-1 flex-col justify-center gap-2.5">
          {SPEED_TO_LEAD.map((bucket, index) => {
            const widthPct = (bucket.count / max) * 100;
            const sharePct = (bucket.count / total) * 100;
            return (
              <li
                key={bucket.key}
                className="group flex items-center gap-3 rounded-[8px] px-1 py-1 transition-colors hover:bg-elevated"
              >
                <span className="w-24 shrink-0 font-body text-[11.5px] text-fg-secondary transition-colors group-hover:text-fg">
                  {bucket.label}
                </span>
                <div className="relative h-3.5 flex-1 rounded-pill bg-elevated">
                  <div className="h-full overflow-hidden rounded-pill">
                    <motion.div
                      className={cn(
                        "h-full rounded-pill transition-[filter] duration-150 group-hover:brightness-110",
                        STATUS_BG[bucket.status],
                      )}
                      initial={{ width: reduced ? `${widthPct}%` : "0%" }}
                      animate={{ width: `${widthPct}%` }}
                      transition={
                        reduced
                          ? { duration: 0 }
                          : {
                              duration: DURATION.chart,
                              ease: EASING.out,
                              delay: index * STAGGER.children,
                            }
                      }
                    />
                  </div>

                  {/* Hover detay balonu */}
                  <HoverTip align="right">
                    <p className="mb-0.5 font-display text-[12px] font-semibold text-fg">
                      {bucket.label}
                    </p>
                    <p className="font-mono text-[11.5px] text-fg-secondary">
                      {formatNumber(bucket.count)} lead · %{Math.round(sharePct)}
                    </p>
                    <p className="font-body text-[10.5px] text-fg-muted">
                      <T
                        tr="İlk aramaya kadar geçen süre bu aralıkta"
                        en="Time until first call is in this range"
                      />
                    </p>
                  </HoverTip>
                </div>
                <span className="w-8 shrink-0 text-right font-mono text-[12px] font-semibold text-fg">
                  {formatNumber(bucket.count)}
                </span>
                <span className="w-12 shrink-0 text-right font-mono text-[11px] text-fg-muted">
                  {formatPercent(sharePct, 0)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="flex flex-1 items-center justify-center font-body text-sm text-fg-muted">
          <T tr="Henüz ilk arama verisi yok." en="No first-call data yet." />
        </p>
      )}
    </Card>
  );
}
