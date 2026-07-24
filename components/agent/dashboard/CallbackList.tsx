import { Phone, CalendarClock } from "lucide-react";
import { CALLBACKS } from "@/lib/mock/mock-data";
import { T } from "@/components/i18n/T";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { formatShortDateTime } from "@/lib/utils/format";

/**
 * Callback listesi — CLAUDE.md 4.4.
 * Tablo değil, taranabilir kart-liste: isim + telefon + planlanan zaman.
 */

export function CallbackList() {
  return (
    <Card className="flex h-full flex-col gap-4">
      <SectionTitle>
        <T tr="Callback Listesi" en="Callback List" />
      </SectionTitle>

      {CALLBACKS.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {CALLBACKS.map((callback) => (
            <li
              key={callback.id}
              className="flex items-center gap-3 rounded-control px-2.5 py-2.5 transition-colors hover:bg-elevated"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-indigo/12 text-indigo">
                <Phone size={14} aria-hidden />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-body text-[13px] font-medium text-fg">
                  {callback.name}
                </span>
                <span className="font-mono text-[11px] text-fg-muted">
                  {callback.phone}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 text-fg-secondary">
                <CalendarClock size={13} aria-hidden />
                <span className="font-mono text-[11.5px]">
                  {formatShortDateTime(callback.scheduledAtISO)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex flex-1 items-center justify-center font-body text-sm text-fg-muted">
          <T
            tr="Planlanmış callback yok — yeni bir tane eklendiğinde burada görünecek."
            en="No scheduled callbacks — a new one will appear here when added."
          />
        </p>
      )}
    </Card>
  );
}
