"use client";

import { useMemo, useState } from "react";
import {
  UploadCloud,
  RotateCcw,
  UserPlus,
  UserMinus,
  LogIn,
  ShieldAlert,
  Trash2,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { useLogs, clearLogs, type LogType, type LogEntry } from "@/lib/data/log-store";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { T } from "@/components/i18n/T";
import { useLang } from "@/components/i18n/LanguageProvider";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const TYPE_META: Record<LogType, { labelTr: string; labelEn: string; icon: LucideIcon; tone: string }> = {
  upload: { labelTr: "Excel Yükleme", labelEn: "Excel Upload", icon: UploadCloud, tone: "bg-success/12 text-success" },
  reset: { labelTr: "Sıfırlama", labelEn: "Reset", icon: RotateCcw, tone: "bg-amber/14 text-amber" },
  "user-add": { labelTr: "Kullanıcı Ekleme", labelEn: "User Added", icon: UserPlus, tone: "bg-brand/12 text-brand" },
  "user-remove": { labelTr: "Kullanıcı Silme", labelEn: "User Removed", icon: UserMinus, tone: "bg-critical/12 text-critical" },
  login: { labelTr: "Giriş", labelEn: "Login", icon: LogIn, tone: "bg-indigo/12 text-indigo" },
  "auth-fail": { labelTr: "Başarısız Giriş", labelEn: "Failed Login", icon: ShieldAlert, tone: "bg-critical/12 text-critical" },
};

type Filter = "all" | LogType;

const FILTERS: Array<{ key: Filter; labelTr: string; labelEn: string }> = [
  { key: "all", labelTr: "Tümü", labelEn: "All" },
  { key: "upload", labelTr: "Yükleme", labelEn: "Upload" },
  { key: "user-add", labelTr: "Kullanıcı", labelEn: "User" },
  { key: "reset", labelTr: "Sıfırlama", labelEn: "Reset" },
];

function formatTs(ts: number): string {
  return new Date(ts).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

export function ActivityLog() {
  const { t } = useLang();
  const logs = useLogs();
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo<LogEntry[]>(() => {
    if (filter === "all") return logs;
    if (filter === "user-add") return logs.filter((l) => l.type === "user-add" || l.type === "user-remove");
    return logs.filter((l) => l.type === filter);
  }, [logs, filter]);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <SectionTitle hint={t("Sistemde yapılan kritik işlemlerin kaydı — Excel yayınlama, kullanıcı ekleme/silme ve sıfırlama. En yeni kayıt en üstte.", "A record of critical actions in the system — publishing Excel, adding/removing users and resets. Newest entry on top.")}>
          <T tr="Sistem Aktivite Kaydı" en="System Activity Log" />
        </SectionTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={cn(
                  "rounded-pill px-2.5 py-1 font-body text-[11px] font-medium transition-colors",
                  filter === f.key ? "bg-brand/12 text-brand" : "text-fg-secondary hover:bg-elevated hover:text-fg",
                )}
              >
                <T tr={f.labelTr} en={f.labelEn} />
              </button>
            ))}
          </div>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={() => clearLogs()}
              className="inline-flex items-center gap-1.5 rounded-control border border-border px-2.5 py-1 font-body text-[11px] font-medium text-fg-secondary transition-colors hover:border-critical/40 hover:bg-critical/10 hover:text-critical"
            >
              <Trash2 size={13} />
              <T tr="Kaydı Temizle" en="Clear Log" />
            </button>
          )}
        </div>
      </div>

      <p className="font-mono text-[11px] text-fg-muted">{formatNumber(rows.length)} {t("kayıt", "records")}</p>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-control border border-dashed border-border py-12 text-center">
          <ScrollText size={22} className="text-fg-muted" />
          <p className="font-body text-[13px] font-medium text-fg-secondary"><T tr="Henüz kayıt yok" en="No records yet" /></p>
          <p className="font-body text-[11.5px] text-fg-muted"><T tr="Excel yayınladığında veya kullanıcı eklediğinde burada görünecek." en="Once you publish Excel or add a user, it will appear here." /></p>
        </div>
      ) : (
        <ol className="flex flex-col">
          {rows.map((entry, idx) => {
            const meta = TYPE_META[entry.type];
            const Icon = meta.icon;
            return (
              <li key={entry.id} className="flex gap-3 py-2.5">
                {/* Zaman çizelgesi noktası + çizgi */}
                <div className="flex flex-col items-center">
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", meta.tone)}>
                    <Icon size={15} />
                  </span>
                  {idx < rows.length - 1 && <span className="mt-1 w-px flex-1 bg-border" aria-hidden />}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-pill px-1.5 py-0.5 font-body text-[10px] font-semibold", meta.tone)}>
                      <T tr={meta.labelTr} en={meta.labelEn} />
                    </span>
                    <span className="font-mono text-[10.5px] text-fg-muted">{formatTs(entry.ts)}</span>
                  </div>
                  <p className="font-body text-[12.5px] leading-relaxed text-fg">{entry.message}</p>
                  <span className="font-body text-[10.5px] text-fg-muted">{entry.actor}</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
