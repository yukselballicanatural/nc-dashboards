"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLang } from "@/components/i18n/LanguageProvider";
import { computePeriod, type PeriodData } from "@/lib/mock/compute";
import { MOCK_NOW, DAY, HOUR } from "@/lib/mock/lead-engine";
import { LEADS } from "@/lib/mock/datasets";

export type RangeKey = "today" | "7d" | "30d" | "90d" | "custom";

const TZ_OFFSET = 3 * HOUR;
const MONTHS_TR = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
] as const;

function startOfDay(ts: number): number {
  const local = ts + TZ_OFFSET;
  return local - (local % DAY) - TZ_OFFSET;
}
/** "14 Tem 2026" */
function longDate(ts: number): string {
  const iso = new Date(ts + TZ_OFFSET).toISOString();
  return `${Number(iso.slice(8, 10))} ${MONTHS_TR[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}
/** "2026-07-14" (date input değeri) */
function inputValue(ts: number): string {
  return new Date(ts + TZ_OFFSET).toISOString().slice(0, 10);
}

interface DateRangeValue {
  rangeKey: RangeKey;
  startMs: number;
  endMs: number;
  /** İnsan-okur aralık etiketi. */
  label: string;
  /** Özel aralık için date-input değerleri. */
  customStart: string;
  customEnd: string;
  setPreset: (key: Exclude<RangeKey, "custom">) => void;
  setCustom: (startISO: string, endISO: string) => void;
  /** Seçili aralığa göre türetilmiş tüm dönem verisi. */
  data: PeriodData;
}

const DateRangeContext = createContext<DateRangeValue | null>(null);

const PRESET_DAYS: Record<Exclude<RangeKey, "custom">, number> = {
  today: 0,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  // Varsayılan özel aralık: son 30 gün.
  const [customStart, setCustomStart] = useState(inputValue(MOCK_NOW - 30 * DAY));
  const [customEnd, setCustomEnd] = useState(inputValue(MOCK_NOW));

  const { startMs, endMs } = useMemo(() => {
    if (rangeKey === "custom") {
      const s = Date.parse(`${customStart}T00:00:00+03:00`);
      const e = Date.parse(`${customEnd}T23:59:59+03:00`);
      return {
        startMs: Number.isNaN(s) ? MOCK_NOW - 30 * DAY : s,
        endMs: Number.isNaN(e) ? MOCK_NOW : Math.min(e, MOCK_NOW),
      };
    }
    const days = PRESET_DAYS[rangeKey];
    return {
      startMs: days === 0 ? startOfDay(MOCK_NOW) : MOCK_NOW - days * DAY,
      endMs: MOCK_NOW,
    };
  }, [rangeKey, customStart, customEnd]);

  const { lang } = useLang();
  const data = useMemo(
    () => computePeriod(LEADS, startMs, endMs, lang),
    [startMs, endMs, lang],
  );

  const label = useMemo(
    () => `${longDate(startMs)} – ${longDate(endMs)}`,
    [startMs, endMs],
  );

  const value: DateRangeValue = {
    rangeKey,
    startMs,
    endMs,
    label,
    customStart,
    customEnd,
    setPreset: (key) => setRangeKey(key),
    setCustom: (s, e) => {
      setCustomStart(s);
      setCustomEnd(e);
      setRangeKey("custom");
    },
    data,
  };

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange(): DateRangeValue {
  const ctx = useContext(DateRangeContext);
  if (!ctx) {
    throw new Error("useDateRange, DateRangeProvider içinde kullanılmalıdır.");
  }
  return ctx;
}
