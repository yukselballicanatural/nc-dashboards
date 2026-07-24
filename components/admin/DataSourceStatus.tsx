"use client";

import Link from "next/link";
import { Database, FileSpreadsheet, ArrowRight } from "lucide-react";
import { useDatasetMeta } from "@/lib/data/data-source";
import { formatNumber } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { cn } from "@/lib/utils/cn";

/** Aktif veri kaynağı durumu — Excel mi seed mi, sayımlar, son yükleme. */
export function DataSourceStatus() {
  const { t } = useLang();
  const meta = useDatasetMeta();
  const isExcel = meta.source === "excel";

  const uploadedLabel = meta.uploadedAt
    ? new Date(meta.uploadedAt).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })
    : null;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-control",
              isExcel ? "bg-success/12 text-success" : "bg-neutral/16 text-fg-secondary",
            )}
          >
            {isExcel ? <FileSpreadsheet size={20} /> : <Database size={20} />}
          </span>
          <div className="flex flex-col">
            <span className="font-display text-[15px] font-semibold text-fg">
              <T tr="Aktif Veri Kaynağı:" en="Active Data Source:" />{" "}
              <span className={isExcel ? "text-success" : "text-fg-secondary"}>
                {isExcel ? t("Yüklenen Excel", "Uploaded Excel") : t("Örnek Veri (Seed)", "Sample Data (Seed)")}
              </span>
            </span>
            <span className="font-body text-[12px] text-fg-secondary">
              {isExcel
                ? `${meta.fileName ?? t("dosya", "file")} · ${uploadedLabel ?? ""}`
                : t("Henüz Excel yüklenmedi — paneller örnek veriyi gösteriyor.", "No Excel uploaded yet — panels are showing sample data.")}
            </span>
          </div>
        </div>
        <Link
          href="/admin/veri-yukleme"
          className="flex items-center gap-1.5 rounded-control bg-brand px-3.5 py-2 font-body text-[12.5px] font-semibold text-white shadow-card transition-[filter] hover:brightness-110"
        >
          <T tr="Excel Yükle" en="Upload Excel" />
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-border pt-3">
        <div className="flex flex-col">
          <span className="font-mono text-[22px] font-semibold text-fg">{formatNumber(meta.stats.teams)}</span>
          <span className="font-body text-[11px] text-fg-muted"><T tr="Takım" en="Team" /></span>
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-[22px] font-semibold text-fg">{formatNumber(meta.stats.agents)}</span>
          <span className="font-body text-[11px] text-fg-muted"><T tr="Danışman" en="Agent" /></span>
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-[22px] font-semibold text-fg">{formatNumber(meta.stats.leads)}</span>
          <span className="font-body text-[11px] text-fg-muted"><T tr="Lead kaydı" en="Lead records" /></span>
        </div>
      </div>
    </Card>
  );
}
