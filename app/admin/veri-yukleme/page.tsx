import type { Metadata } from "next";
import { Info } from "lucide-react";
import { T } from "@/components/i18n/T";
import { ExcelUploadCenter } from "@/components/admin/upload/ExcelUploadCenter";
import { COLUMNS } from "@/lib/data/excel-schema";

export const metadata: Metadata = {
  title: "Natural Clinic — Veri Yükleme",
};

/**
 * Veri Yükleme — Admin Excel yükler, sistem okur/doğrular/dağıtır.
 */
export default function AdminUploadPage() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-fg"><T tr="Veri Yükleme" en="Data Upload" /></h1>
        <p className="font-body text-[13px] text-fg-secondary">
          <T
            tr="Excel yükle; sistem verileri okuyup organizasyon yapısını kurar ve tüm panellere dağıtır."
            en="Upload an Excel file; the system reads the data, builds the organization structure and distributes it to all panels."
          />
        </p>
      </div>

      <ExcelUploadCenter />

      {/* Şema açıklaması */}
      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <Info size={15} className="text-indigo" aria-hidden />
          <h2 className="font-display text-[14px] font-semibold text-fg"><T tr="Beklenen Excel Kolonları" en="Expected Excel Columns" /></h2>
        </div>
        <p className="font-body text-[12px] leading-relaxed text-fg-secondary">
          <T
            tr="Şablonu indirip doldurmanız yeterli. Zorunlu kolonlar dolu olmalı; diğerleri boş bırakılabilir. Kolon başlıkları büyük/küçük harf ve boşluk duyarsız eşlenir."
            en="Just download the template and fill it in. Required columns must be filled; the rest can be left blank. Column headers are matched case- and space-insensitively."
          />
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2.5 py-2 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted"><T tr="Kolon" en="Column" /></th>
                <th className="px-2.5 py-2 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted"><T tr="Zorunlu" en="Required" /></th>
                <th className="px-2.5 py-2 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted"><T tr="Örnek" en="Example" /></th>
                <th className="px-2.5 py-2 text-left font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted"><T tr="Açıklama" en="Description" /></th>
              </tr>
            </thead>
            <tbody>
              {COLUMNS.map((c) => (
                <tr key={c.key} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-2.5 py-2 font-body text-[12px] font-medium text-fg">{c.header}</td>
                  <td className="px-2.5 py-2">
                    {c.required ? (
                      <span className="rounded-pill bg-critical/12 px-1.5 py-0.5 font-body text-[10px] font-semibold text-critical"><T tr="Zorunlu" en="Required" /></span>
                    ) : (
                      <span className="font-body text-[11px] text-fg-muted"><T tr="Opsiyonel" en="Optional" /></span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2 font-mono text-[11px] text-fg-secondary">{c.example || "—"}</td>
                  <td className="px-2.5 py-2 font-body text-[11.5px] text-fg-secondary">{c.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
