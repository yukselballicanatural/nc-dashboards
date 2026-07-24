"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLang } from "@/components/i18n/LanguageProvider";
import { computeTeamPeriod } from "@/lib/mock/team-compute";
import type { TeamPeriodData } from "@/lib/types/team-data";
import { MOCK_NOW, DAY, HOUR } from "@/lib/mock/lead-engine";

/**
 * Takım Lideri'nin tarih aralığı context'i — Agent panelindeki
 * `DateRangeContext` ile birebir aynı davranış/arayüz, tek fark: `data` alanı
 * `computeTeamPeriod` ile TÜM takım için hesaplanır (tek agent değil).
 */

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
function longDate(ts: number): string {
  const iso = new Date(ts + TZ_OFFSET).toISOString();
  return `${Number(iso.slice(8, 10))} ${MONTHS_TR[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}
function inputValue(ts: number): string {
  return new Date(ts + TZ_OFFSET).toISOString().slice(0, 10);
}

interface TeamDateRangeValue {
  rangeKey: RangeKey;
  startMs: number;
  endMs: number;
  label: string;
  customStart: string;
  customEnd: string;
  setPreset: (key: Exclude<RangeKey, "custom">) => void;
  setCustom: (startISO: string, endISO: string) => void;
  data: TeamPeriodData;
}

const TeamDateRangeContext = createContext<TeamDateRangeValue | null>(null);

const PRESET_DAYS: Record<Exclude<RangeKey, "custom">, number> = {
  today: 0,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function TeamDateRangeProvider({ children }: { children: ReactNode }) {
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

  const { lang } = useLang();
  const data = useMemo(
    () => computeTeamPeriod(startMs, endMs, lang),
    [startMs, endMs, lang],
  );

  const label = useMemo(
    () => `${longDate(startMs)} – ${longDate(endMs)}`,
    [startMs, endMs],
  );

  const value: TeamDateRangeValue = {
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
    <TeamDateRangeContext.Provider value={value}>
      {children}
    </TeamDateRangeContext.Provider>
  );
}

export function useTeamDateRange(): TeamDateRangeValue {
  const ctx = useContext(TeamDateRangeContext);
  if (!ctx) {
    throw new Error("useTeamDateRange, TeamDateRangeProvider içinde kullanılmalıdır.");
  }
  return ctx;
}
