import type { ReactNode } from "react";
import { AGENT_PROFILE } from "@/lib/mock/mock-data";
import { T } from "@/components/i18n/T";

/**
 * Sayfa başlığı — selamlama + açıklama.
 * Dönem bilgisi global FilterBar'da (üstte) gösterilir.
 */
export function DashboardHeader({
  title,
  subtitle,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
}) {
  const firstName = AGENT_PROFILE.name.split(" ")[0];

  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-display text-2xl font-bold tracking-tight text-fg">
        {title ?? <T tr={`Merhaba, ${firstName}`} en={`Hello, ${firstName}`} />}
      </h1>
      <p className="font-body text-[13px] text-fg-secondary">
        {subtitle ?? (
          <T
            tr="Bugünün fotoğrafı burada — kırmızı gördüğün yerden başla."
            en="Here's today's snapshot — start wherever you see red."
          />
        )}
      </p>
    </div>
  );
}
