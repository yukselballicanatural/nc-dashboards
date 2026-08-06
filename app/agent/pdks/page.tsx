"use client";

import { Info } from "lucide-react";
import {
  DAILY_TARGET_MINUTES,
  formatDuration,
  pdksSummary,
  pdksTeamComparison,
} from "@/lib/mock/pdks";
import { formatNumber } from "@/lib/utils/format";
import { useLang } from "@/components/i18n/LanguageProvider";
import { T } from "@/components/i18n/T";
import { DashboardHeader } from "@/components/agent/dashboard/DashboardHeader";
import { PdksBalanceCard } from "@/components/agent/pdks/PdksBalanceCard";
import { PdksTodayCard } from "@/components/agent/pdks/PdksTodayCard";
import { PdksTeamCard } from "@/components/agent/pdks/PdksTeamCard";
import { PdksDayTable } from "@/components/agent/pdks/PdksDayTable";

/**
 * Mesai & PDKS — turnike bazlı mesai takibi (kullanıcı talebi).
 * Dashboard'daki 7 günlük özet vardiya tablosunun derinlemesine hâli:
 * 30 gün, turnike hareketleri, eksik/fazla mesai bakiyesi.
 */
export default function PdksPage() {
  const { t, lang } = useLang();
  const summary = pdksSummary(lang);
  const comparison = pdksTeamComparison();

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <DashboardHeader
        title={<T tr="Mesai & PDKS" en="Attendance & Hours" />}
        subtitle={
          <T
            tr={`Turnike kayıtlarına göre mesai takibin — her iş günü turnike içinde ${formatDuration(DAILY_TARGET_MINUTES, "tr")} kalman bekleniyor.`}
            en={`Your attendance based on turnstile records — you are expected to stay inside for ${formatDuration(DAILY_TARGET_MINUTES, "en")} on every workday.`}
          />
        }
      />

      <PdksBalanceCard summary={summary} />

      <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <PdksTodayCard day={summary.today} />
        </div>
        <div className="lg:col-span-5">
          <PdksTeamCard comparison={comparison} />
        </div>
      </div>

      <PdksDayTable summary={summary} />

      {/* Kural notu — hesabın nasıl yapıldığı şeffaf olsun */}
      <div className="flex items-start gap-2.5 rounded-card border border-border bg-surface px-4 py-3">
        <Info size={15} aria-hidden className="mt-0.5 shrink-0 text-indigo" />
        <p className="font-body text-[12px] leading-relaxed text-fg-secondary">
          <span className="font-semibold text-fg">
            <T
              tr={`Mesai, turnike İÇİNDE geçirilen net süreye göre hesaplanır (hedef: günlük ${formatDuration(DAILY_TARGET_MINUTES, "tr")}).`}
              en={`Hours are calculated from net time spent INSIDE the turnstile (target: ${formatDuration(DAILY_TARGET_MINUTES, "en")} per day).`}
            />
          </span>{" "}
          <T
            tr="İlk giriş ile son çıkış arasında turnikeden çıkıp dışarıda geçirdiğin süreler düşülür; masada/kantinde geçen mola turnike içinde olduğu için sayılır. Hafta sonu, resmi tatil ve izin günlerinde hedef yoktur — o günlerdeki çalışma fazla mesai olarak ayrı gösterilir."
            en="Any time spent outside the turnstile between your first entry and last exit is deducted; breaks taken at your desk or in the canteen count because you remain inside. Weekends, public holidays and leave days carry no target — work on those days is shown separately as overtime."
          />{" "}
          <span className="text-fg-muted">
            <T
              tr={`Bu dönemde ${formatNumber(summary.workdayCount)} iş günü, ${formatNumber(summary.leaveDayCount)} izin, ${formatNumber(summary.holidayDayCount)} resmi tatil, ${formatNumber(summary.absentDayCount)} devamsız gün var.`}
              en={`This period has ${formatNumber(summary.workdayCount)} workdays, ${formatNumber(summary.leaveDayCount)} leave day(s), ${formatNumber(summary.holidayDayCount)} public holiday(s) and ${formatNumber(summary.absentDayCount)} absent day(s).`}
            />
          </span>
        </p>
      </div>
    </div>
  );
}
