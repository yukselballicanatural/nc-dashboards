"use client";

import { ArrowRight } from "lucide-react";
import { Fragment } from "react";
import { useDateRange } from "@/components/agent/filters/DateRangeContext";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { formatNumber } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { HoverTip } from "@/components/ui/HoverTip";

/**
 * Mini funnel şeridi — seçili döneme göre (context): Lead → Contact → Offer
 * → Deal → Ödeme. Büyük mono rakamlar + oklar; detaylı funnel "Aramalar &
 * Funnel" sayfasında.
 */

function StageValue({ count }: { count: number }) {
  const animated = useCountUp(count);
  return (
    <span className="font-mono text-[28px] font-semibold leading-none text-fg transition-colors group-hover:text-brand">
      {formatNumber(Math.round(animated))}
    </span>
  );
}

export function MiniFunnelStrip() {
  const { data } = useDateRange();
  const { t } = useLang();
  const funnel = data.miniFunnel;
  const hasData = funnel.some((stage) => stage.count > 0);

  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle
        hint={t(
          "Seçili dönemin akışı: kaç lead geldi, kaçı görüşmeye, teklife, satışa ve ödemeye döndü.",
          "The selected period's flow: how many leads came in, how many turned into consultations, offers, sales and payments.",
        )}
      >
        Funnel
      </SectionTitle>

      {hasData ? (
        <div className="flex flex-1 items-center justify-between gap-1.5 px-1">
          {funnel.map((stage, index) => {
            const prev = index > 0 ? funnel[index - 1] : null;
            const conv =
              prev && prev.count > 0
                ? Math.round((stage.count / prev.count) * 100)
                : null;
            return (
              <Fragment key={stage.key}>
                {index > 0 && (
                  <ArrowRight size={15} aria-hidden className="shrink-0 text-fg-muted" />
                )}
                <div className="group relative flex cursor-default flex-col items-center gap-1.5 rounded-control px-3 py-2 transition-colors hover:bg-elevated">
                  <StageValue count={stage.count} />
                  <span className="font-body text-[11.5px] font-medium text-fg-secondary">
                    {stage.label}
                  </span>
                  <HoverTip>
                    <p className="font-mono text-[11.5px] text-fg">
                      <span className="text-brand">{formatNumber(stage.count)}</span>{" "}
                      {stage.label.toLocaleLowerCase("tr-TR")}
                    </p>
                    {conv !== null && (
                      <p className="font-body text-[10.5px] text-fg-muted">
                        <T
                          tr={`Önceki aşamadan %${conv} geçiş`}
                          en={`${conv}% conversion from previous stage`}
                        />
                      </p>
                    )}
                  </HoverTip>
                </div>
              </Fragment>
            );
          })}
        </div>
      ) : (
        <p className="flex flex-1 items-center justify-center font-body text-sm text-fg-muted">
          <T tr="Bu aralıkta henüz funnel verisi yok." en="No funnel data for this range yet." />
        </p>
      )}
    </Card>
  );
}
