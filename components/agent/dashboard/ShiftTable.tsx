import { SHIFT_WEEK } from "@/lib/mock/mock-data";
import { formatNumber } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils/cn";

/**
 * Vardiya tablosu — v2 4.6: son 7 gün.
 * Geç kalma >5 dk olan satırlar kırmızı/kalın vurgulanır.
 */
export function ShiftTable() {
  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle hint="Planlanan vardiyan 09:00-18:00. 5 dakikadan fazla geç başlayan günler kırmızı işaretlenir.">
        Son 7 Gün Vardiya
      </SectionTitle>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {["Tarih", "Plan Giriş", "Giriş", "Plan Çıkış", "Çıkış", "Geç Kalma", "Mola", "Çalışma"].map(
                (header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-2.5 py-2 text-left font-body text-[10.5px] font-semibold uppercase tracking-wide text-fg-muted"
                  >
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {SHIFT_WEEK.map((day) => {
              const isLate = day.lateMinutes > 5;
              return (
                <tr
                  key={day.date}
                  className="border-b border-border transition-colors last:border-0 hover:bg-elevated"
                >
                  <td className="px-2.5 py-2.5 font-mono text-[11.5px] text-fg">{day.date}</td>
                  <td className="px-2.5 py-2.5 font-mono text-[11.5px] text-fg-muted">{day.plannedIn}</td>
                  <td
                    className={cn(
                      "px-2.5 py-2.5 font-mono text-[11.5px]",
                      isLate ? "font-bold text-critical" : "text-fg",
                    )}
                  >
                    {day.actualIn}
                  </td>
                  <td className="px-2.5 py-2.5 font-mono text-[11.5px] text-fg-muted">{day.plannedOut}</td>
                  <td className="px-2.5 py-2.5 font-mono text-[11.5px] text-fg">{day.actualOut}</td>
                  <td
                    className={cn(
                      "px-2.5 py-2.5 font-mono text-[11.5px]",
                      isLate ? "font-bold text-critical" : "text-fg-secondary",
                    )}
                  >
                    {day.lateMinutes > 0 ? `${day.lateMinutes} dk` : "—"}
                  </td>
                  <td className="px-2.5 py-2.5 font-mono text-[11.5px] text-fg-secondary">
                    {day.breakMinutes} dk
                  </td>
                  <td className="px-2.5 py-2.5 font-mono text-[11.5px] text-fg">
                    {formatNumber(day.workedHours, 1)} sa
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
