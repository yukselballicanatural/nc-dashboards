"use client";

import { useCallback, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { COLUMNS, parseRows, type ParseResult } from "@/lib/data/excel-schema";
import { setDataset, clearDataset } from "@/lib/data/dataset-store";
import { addLog } from "@/lib/data/log-store";
import { useDatasetMeta } from "@/lib/data/data-source";
import { formatNumber } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { cn } from "@/lib/utils/cn";

/**
 * Excel Yükleme Merkezi — dosyayı okur, ANLAR, doğrular, önizler ve yayınlar.
 * Yayınlanınca veri tarayıcı deposuna yazılır ve tüm paneller (bölge/admin)
 * bu veriyi kullanmaya başlar (seed yerine).
 */

interface Preview {
  fileName: string;
  result: ParseResult;
  sampleRows: Record<string, unknown>[];
}

export function ExcelUploadCenter() {
  const { t } = useLang();
  const meta = useDatasetMeta();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [published, setPublished] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setBusy(true);
    setFatalError(null);
    setPublished(false);
    setPreview(null);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) throw new Error(t("Excel dosyasında sayfa bulunamadı.", "No sheet found in the Excel file."));
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const result = parseRows(rows);
      setPreview({ fileName: file.name, result, sampleRows: rows.slice(0, 8) });
    } catch (err) {
      console.error("Excel okuma hatası:", err);
      setFatalError(err instanceof Error ? err.message : t("Dosya okunamadı. Geçerli bir .xlsx dosyası olduğundan emin olun.", "Could not read the file. Make sure it is a valid .xlsx file."));
    } finally {
      setBusy(false);
    }
  }, [t]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const publish = () => {
    if (!preview?.result.ok) return;
    try {
      setDataset({
        uploadedAt: Date.now(),
        fileName: preview.fileName,
        stats: preview.result.stats,
        teams: preview.result.teams,
      });
      const { teams, agents, leads } = preview.result.stats;
      addLog(
        "upload",
        t(
          `Excel yayınlandı: ${preview.fileName} — ${formatNumber(teams)} takım, ${formatNumber(agents)} danışman, ${formatNumber(leads)} lead dağıtıldı.`,
          `Excel published: ${preview.fileName} — ${formatNumber(teams)} teams, ${formatNumber(agents)} agents, ${formatNumber(leads)} leads distributed.`,
        ),
      );
      setPublished(true);
    } catch (err) {
      setFatalError(err instanceof Error ? err.message : t("Yayınlama başarısız.", "Publishing failed."));
    }
  };

  const resetToSeed = () => {
    clearDataset();
    addLog("reset", t("Veri kaynağı örnek (seed) veriye sıfırlandı — yüklenen Excel kaldırıldı.", "Data source reset to sample (seed) data — the uploaded Excel was removed."));
    setPreview(null);
    setPublished(false);
  };

  const downloadTemplate = () => {
    try {
      const header = COLUMNS.map((c) => c.header);
      const example = COLUMNS.map((c) => c.example);
      const example2 = COLUMNS.map((c) =>
        c.key === "team" ? "Aamir Ali Team" :
        c.key === "teamLeader" ? "Aamir Ali" :
        c.key === "agent" ? "Elif Demirtaş" :
        c.key === "name" ? "Sofia Bianchi" :
        c.key === "createdAt" ? "2026-07-15 09:20" :
        c.key === "firstCallAt" ? "2026-07-15 09:25" :
        c.key === "attempts" ? "2" :
        c.key === "reached" ? "E" :
        c.key === "contact" ? "H" :
        c.key === "country" ? "İtalya" :
        c.key === "language" ? "Italian" :
        c.key === "source" ? "Google Ads" :
        c.key === "role" ? "Senior" : "",
      );
      const ws = XLSX.utils.aoa_to_sheet([header, example, example2]);
      ws["!cols"] = header.map(() => ({ wch: 18 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Veri");
      XLSX.writeFile(wb, "natural-clinic-veri-sablonu.xlsx");
    } catch (err) {
      console.error("Şablon oluşturulamadı:", err);
      setFatalError(t("Şablon indirilemedi.", "Could not download the template."));
    }
  };

  const result = preview?.result;

  return (
    <div className="flex flex-col gap-5">
      {/* Yükleme kutusu */}
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionTitle hint={t("Şablona uygun .xlsx dosyasını sürükle-bırak ya da seç. Dosya okunur, doğrulanır ve önizlenir; onayınca tüm panellere dağıtılır.", "Drag & drop or select an .xlsx file matching the template. The file is read, validated and previewed; once you confirm, it is distributed to all panels.")}>
            <T tr="Excel Yükle" en="Upload Excel" />
          </SectionTitle>
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 rounded-control border border-border bg-surface px-3 py-2 font-body text-[12px] font-medium text-fg-secondary transition-colors hover:border-brand/40 hover:text-brand"
          >
            <Download size={14} />
            <T tr="Şablonu İndir" en="Download Template" />
          </button>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragging ? "border-brand bg-brand/8" : "border-border bg-bg hover:border-brand/40",
          )}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-pill bg-brand/12 text-brand">
            {busy ? <Loader2 size={24} className="animate-spin" /> : <UploadCloud size={24} />}
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="font-body text-[13.5px] font-medium text-fg">
              {busy ? t("Dosya okunuyor...", "Reading file...") : t("Dosyayı buraya sürükle ya da tıkla", "Drag the file here or click")}
            </p>
            <p className="font-body text-[11.5px] text-fg-muted"><T tr=".xlsx / .xls — ilk sayfa okunur" en=".xlsx / .xls — the first sheet is read" /></p>
          </div>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onInputChange} />
        </div>

        {fatalError && (
          <p role="alert" className="flex items-center gap-2 rounded-control border border-critical/25 bg-critical/8 px-3 py-2 font-body text-[12px] font-medium text-critical">
            <AlertTriangle size={14} />
            {fatalError}
          </p>
        )}
      </Card>

      {/* Önizleme + doğrulama */}
      {result && (
        <Card className="flex flex-col gap-4">
          <SectionTitle><T tr="Önizleme & Doğrulama" en="Preview & Validation" /></SectionTitle>

          {published ? (
            <div className="flex items-center gap-2 rounded-control border border-success/30 bg-success/10 px-3.5 py-2.5 font-body text-[12.5px] font-medium text-success">
              <CheckCircle2 size={16} />
              <T tr="Veri yayınlandı — tüm paneller artık bu Excel verisini kullanıyor." en="Data published — all panels are now using this Excel data." />
            </div>
          ) : result.ok ? (
            <div className="flex items-center gap-2 rounded-control border border-brand/25 bg-brand/8 px-3.5 py-2.5 font-body text-[12.5px] text-fg-secondary">
              <FileSpreadsheet size={16} className="text-brand" />
              <span className="font-medium text-fg">{preview?.fileName}</span> <T tr="okundu ve doğrulandı." en="read and validated." />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-control border border-critical/25 bg-critical/8 px-3.5 py-2.5 font-body text-[12.5px] font-medium text-critical">
              <X size={16} />
              <T tr="Dosya işlenemedi — aşağıdaki hataları düzeltip tekrar yükleyin." en="The file could not be processed — fix the errors below and upload again." />
            </div>
          )}

          {/* İstatistik */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "teams", labelTr: "Takım", labelEn: "Team", value: result.stats.teams },
              { key: "agents", labelTr: "Danışman", labelEn: "Agent", value: result.stats.agents },
              { key: "leads", labelTr: "Lead kaydı", labelEn: "Lead records", value: result.stats.leads },
            ].map((s) => (
              <div key={s.key} className="rounded-control border border-border bg-bg px-3 py-2.5">
                <p className="font-mono text-[20px] font-semibold text-fg">{formatNumber(s.value)}</p>
                <p className="font-body text-[11px] text-fg-muted"><T tr={s.labelTr} en={s.labelEn} /></p>
              </div>
            ))}
          </div>

          {/* Uyarılar */}
          {result.errors.length > 0 && (
            <div className="flex flex-col gap-1 rounded-control border border-warning/25 bg-warning/8 p-3">
              <p className="flex items-center gap-1.5 font-body text-[12px] font-semibold text-warning">
                <AlertTriangle size={13} />
                {result.errors.length} {t("uyarı", "warning(s)")}
              </p>
              <ul className="flex flex-col gap-0.5">
                {result.errors.slice(0, 8).map((e, i) => (
                  <li key={i} className="font-body text-[11.5px] text-fg-secondary">• {e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Örnek satırlar */}
          {preview && preview.sampleRows.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                {t("İlk", "First")} {preview.sampleRows.length} {t("satır önizleme", "row preview")}
              </p>
              <div className="overflow-x-auto rounded-control border border-border">
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-border bg-elevated">
                      {Object.keys(preview.sampleRows[0]).slice(0, 8).map((h) => (
                        <th key={h} className="whitespace-nowrap px-2.5 py-1.5 text-left font-body font-semibold text-fg-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sampleRows.map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        {Object.keys(preview.sampleRows[0]).slice(0, 8).map((h) => (
                          <td key={h} className="whitespace-nowrap px-2.5 py-1.5 font-mono text-fg-secondary">
                            {String((row[h] instanceof Date ? (row[h] as Date).toLocaleDateString("tr-TR") : row[h]) ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Aksiyonlar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={publish}
              disabled={!result.ok || published}
              className="flex h-11 items-center justify-center gap-2 rounded-control bg-brand px-5 font-body text-[13px] font-semibold text-white shadow-card transition-[filter,opacity] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCircle2 size={15} />
              {published ? t("Yayınlandı", "Published") : t("Yayınla ve Dağıt", "Publish & Distribute")}
            </button>
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setPublished(false);
              }}
              className="flex h-11 items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 font-body text-[13px] font-medium text-fg-secondary transition-colors hover:text-fg"
            >
              <X size={15} />
              <T tr="İptal" en="Cancel" />
            </button>
          </div>
        </Card>
      )}

      {/* Seed'e dön */}
      {meta.source === "excel" && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <p className="font-body text-[13px] font-medium text-fg"><T tr="Örnek veriye geri dön" en="Revert to sample data" /></p>
            <p className="font-body text-[11.5px] text-fg-muted">
              <T tr="Yüklenen Excel silinir, tüm paneller yeniden örnek (seed) veriyi gösterir." en="The uploaded Excel is removed and all panels show the sample (seed) data again." />
            </p>
          </div>
          <button
            type="button"
            onClick={resetToSeed}
            className="flex items-center gap-1.5 rounded-control border border-critical/30 bg-critical/8 px-3.5 py-2 font-body text-[12.5px] font-medium text-critical transition-colors hover:bg-critical/14"
          >
            <RotateCcw size={14} />
            <T tr="Seed'e Sıfırla" en="Reset to Seed" />
          </button>
        </Card>
      )}
    </div>
  );
}
