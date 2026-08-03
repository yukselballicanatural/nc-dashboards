"use client";

import { motion } from "framer-motion";
import { Zap, TurtleIcon } from "lucide-react";
import { useTeamDateRange } from "@/components/team-leader/filters/TeamDateRangeContext";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import type { StatusLevel } from "@/lib/types/agent-data";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { DURATION, EASING, STAGGER } from "@/lib/motion";
import { formatNumber } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * "Yanıt hızı" — Zoho: Lead Yanıt & Agent Perf. (Waiting Time Distribution +
 * Best/Worst 10 by Waiting Time). Sade hali: yeni lead'e ne kadar sürede
 * dönülmüş — bant dağılımı + medyan + en hızlı/en yavaş yanıt verenler.
 */

const BAR: Record<StatusLevel, string> = {
  success: "bg-success",
  warning: "bg-warning",
  risk: "bg-risk",
  critical: "bg-critical",
  neutral: "bg-neutral",
};

function humanMin(min: number, lang: "tr" | "en"): string {
  if (lang === "en") {
    if (min < 60) return `${min} min`;
    if (min < 1440) return `${Math.round(min / 60)} hr`;
    return `${Math.round(min / 1440)} d`;
  }
  if (min < 60) return `${min} dk`;
  if (min < 1440) return `${Math.round(min / 60)} sa`;
  return `${Math.round(min / 1440)} gün`;
}

export function ResponseSpeedCard() {
  const { data } = useTeamDateRange();
  const { t, lang } = useLang();
  const reduced = usePrefersReducedMotion();
  const rs = data.responseSpeed;
  const max = Math.max(1, ...rs.buckets.map((b) => b.count));

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle hint={t("Yeni lead oluştuktan sonra ilk aramaya kadar geçen süre. 15 dakika içinde dönülenler SLA'ya uygun sayılır. Ne kadar hızlı, o kadar yüksek dönüşüm.", "Time elapsed from a new lead being created to the first call. Leads called within 15 minutes count as SLA compliant. The faster, the higher the conversion.")}>
        <T tr="Yanıt Hızı — İlk Aramaya Kadar Geçen Süre" en="Response Speed — Time to First Call" />
      </SectionTitle>

      {/* Özet rakamlar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t("Medyan süre", "Median time"), value: humanMin(rs.medianMin, lang) },
          { label: t("Ortalama süre", "Average time"), value: humanMin(rs.avgMin, lang) },
          { label: t("15 dk uyumu", "15-min compliance"), value: `%${rs.slaCompliantPct}` },
        ].map((s) => (
          <div key={s.label} className="rounded-control border border-border bg-bg px-3 py-2.5">
            <p className="font-mono text-[18px] font-semibold text-fg">{s.value}</p>
            <p className="font-body text-[10.5px] text-fg-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bant dağılımı */}
      <ul className="flex flex-col gap-2">
        {rs.buckets.map((b, index) => (
          <li key={b.key} className="flex items-center gap-3">
            <span className="w-28 shrink-0 font-body text-[11.5px] text-fg-secondary">{b.label}</span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-[6px] bg-elevated">
              <motion.div
                className={cn("flex h-full items-center rounded-[6px] pl-2", BAR[b.tone])}
                initial={{ width: reduced ? `${(b.count / max) * 100}%` : "0%" }}
                animate={{ width: `${(b.count / max) * 100}%` }}
                transition={reduced ? { duration: 0 } : { duration: DURATION.chart, ease: EASING.out, delay: index * STAGGER.children }}
                style={{ minWidth: "2.2rem" }}
              >
                <span className="font-mono text-[10px] font-semibold text-white">{formatNumber(b.count)}</span>
              </motion.div>
            </div>
          </li>
        ))}
      </ul>

      {/* En hızlı / en yavaş */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-control border border-success/30 bg-success/5 p-3">
          <span className="flex items-center gap-1.5 font-display text-[12px] font-semibold text-success">
            <Zap size={13} /> <T tr="En Hızlı Yanıt Verenler" en="Fastest Responders" />
          </span>
          {rs.fastest.map((f) => (
            <div key={f.agentId} className="flex items-center justify-between font-body text-[11.5px] text-fg-secondary">
              <span className="truncate">{f.name}</span>
              <span className="font-mono text-fg">{humanMin(f.avgMin, lang)}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 rounded-control border border-critical/30 bg-critical/5 p-3">
          <span className="flex items-center gap-1.5 font-display text-[12px] font-semibold text-critical">
            <TurtleIcon size={13} /> <T tr="En Yavaş Yanıt Verenler" en="Slowest Responders" />
          </span>
          {rs.slowest.map((f) => (
            <div key={f.agentId} className="flex items-center justify-between font-body text-[11.5px] text-fg-secondary">
              <span className="truncate">{f.name}</span>
              <span className="font-mono text-fg">{humanMin(f.avgMin, lang)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
