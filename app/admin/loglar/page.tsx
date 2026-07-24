import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { ActivityLog } from "@/components/admin/logs/ActivityLog";

export const metadata: Metadata = {
  title: "Natural Clinic — Sistem Logları",
};

/**
 * Loglar — Admin sistemde yapılan kritik işlemlerin kaydını görür.
 */
export default function AdminLogsPage() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-fg"><T tr="Sistem Logları" en="System Logs" /></h1>
        <p className="font-body text-[13px] text-fg-secondary">
          <T
            tr="Veri yükleme, kullanıcı ekleme/silme ve sıfırlama işlemlerinin zaman damgalı kaydı."
            en="A timestamped record of data uploads, user additions/removals and resets."
          />
        </p>
      </div>
      <ActivityLog />
    </div>
  );
}
