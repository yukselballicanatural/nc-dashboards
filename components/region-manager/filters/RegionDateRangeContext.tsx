"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLang } from "@/components/i18n/LanguageProvider";
import { computeRegionPeriod } from "@/lib/mock/region-compute";
import type { RegionPeriodData } from "@/lib/types/region-data";
import { MOCK_NOW, DAY, HOUR } from "@/lib/mock/lead-engine";
import { useActiveRegionRecords } from "@/lib/data/data-source";

/**
 * Bölge Müdürü tarih aralığı context'i — Agent/Takım panelindekiyle aynı
 * davranış; `data` alanı `computeRegionPeriod` ile TÜM bölge için hesaplanır.
 */

export type RangeKey = "today" | "7d" | "30d" | "90d" | "custom";

const TZ_OFFSET = 3 * HOUR;
const MONTHS_TR = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
] as const;
const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

function startOfDay(ts: number): number {
  const local = ts + TZ_OFFSET;
  return local - (local % DAY) - TZ_OFFSET;
}
function longDate(ts: number, lang: "tr" | "en"): string {
  const iso = new Date(ts + TZ_OFFSET).toISOString();
  const months = lang === "en" ? MONTHS_EN : MONTHS_TR;
  return `${Number(iso.slice(8, 10))} ${months[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}
function inputValue(ts: number): string {
  return new Date(ts + TZ_OFFSET).toISOString().slice(0, 10);
}

interface RegionDateRangeValue {
  rangeKey: RangeKey;
  startMs: number;
  endMs: number;
  label: string;
  customStart: string;
  customEnd: string;
  setPreset: (key: Exclude<RangeKey, "custom">) => void;
  setCustom: (startISO: string, endISO: string) => void;
  data: RegionPeriodData;
}

const RegionDateRangeContext = createContext<RegionDateRangeValue | null>(null);

const PRESET_DAYS: Record<Exclude<RangeKey, "custom">, number> = {
  today: 0, "7d": 7, "30d": 30, "90d": 90,
};

export function RegionDateRangeProvider({ children }: { children: ReactNode }) {
  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
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

  const records = useActiveRegionRecords();
  const { lang } = useLang();
  const data = useMemo(
    () => computeRegionPeriod(startMs, endMs, records, lang),
    [startMs, endMs, records, lang],
  );
  const label = useMemo(() => `${longDate(startMs, lang)} – ${longDate(endMs, lang)}`, [startMs, endMs, lang]);

  const value: RegionDateRangeValue = {
    rangeKey, startMs, endMs, label, customStart, customEnd,
    setPreset: (key) => setRangeKey(key),
    setCustom: (s, e) => {
      setCustomStart(s);
      setCustomEnd(e);
      setRangeKey("custom");
    },
    data,
  };

  return (
    <RegionDateRangeContext.Provider value={value}>
      {children}
    </RegionDateRangeContext.Provider>
  );
}

export function useRegionDateRange(): RegionDateRangeValue {
  const ctx = useContext(RegionDateRangeContext);
  if (!ctx) {
    throw new Error("useRegionDateRange, RegionDateRangeProvider içinde kullanılmalıdır.");
  }
  return ctx;
}
