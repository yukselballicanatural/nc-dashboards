/**
 * Takım geneli vardiya + kalite üretimi — datasets.ts'teki Callum'a özel
 * SHIFT_WEEK/QUALITY_TREND üretim mantığının (v2 5.4) her agent için
 * parametrik hali. Callum'un satırı BİREBİR AYNI seed/parametrelerle üretilir
 * (555_111 / 987_654, lateness 0.25, kalite tabanı 84) — bu yüzden onun
 * Performansım sayfasındaki sayılarla Takım Lideri panelindeki sayıları
 * asla çelişmez.
 */

import type { ShiftDay } from "@/lib/types/agent-data";
import { Rng } from "./seeded-random";
import { DAY, HOUR, MINUTE, MOCK_NOW } from "./lead-engine";
import { TEAM_ROSTER } from "./team-roster";

const TZ_OFFSET = 3 * HOUR;
const MONTHS_TR = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
] as const;

function toLocalISO(ts: number): string {
  return new Date(ts + TZ_OFFSET).toISOString().slice(0, 19);
}
function startOfDay(ts: number): number {
  const local = ts + TZ_OFFSET;
  return local - (local % DAY) - TZ_OFFSET;
}
function shortDate(ts: number): string {
  const iso = toLocalISO(ts);
  return `${Number(iso.slice(8, 10))} ${MONTHS_TR[Number(iso.slice(5, 7)) - 1]}`;
}

const TODAY_START = startOfDay(MOCK_NOW);

export interface AgentQualityPoint {
  day: string;
  score: number;
}

export interface AgentShiftQuality {
  agentId: string;
  name: string;
  role: "Senior" | "Junior";
  shiftWeek: ShiftDay[];
  qualityTrend: AgentQualityPoint[];
}

interface ShiftQualityParams {
  agentId: string;
  shiftSeed: number;
  qualitySeed: number;
  /** Bir günde 5dk+ geç kalma olasılığı. */
  latenessChance: number;
  /** 30 gün önceki kalite puanı başlangıcı (65-98 bandında yürüyüş). */
  qualityBase: number;
  /** Günlük rastgele yürüyüş adım aralığı (± dk cinsinden değil, puan). */
  qualityStepMin: number;
  qualityStepMax: number;
}

/**
 * Her agent için ayarlanmış üretim parametreleri — takım rosterindeki
 * güçlü/ortalama/gelişmeli profille TUTARLI (güçlü agent'lar daha az geç
 * kalır, kalite puanı daha yüksek başlar).
 */
const PARAMS: ShiftQualityParams[] = [
  { agentId: "agent-callum-ashford", shiftSeed: 555_111, qualitySeed: 987_654, latenessChance: 0.25, qualityBase: 84, qualityStepMin: -3.5, qualityStepMax: 3.8 },

  { agentId: "agent-elif-demirtas", shiftSeed: 555_201, qualitySeed: 987_701, latenessChance: 0.1, qualityBase: 92, qualityStepMin: -2.2, qualityStepMax: 2.4 },
  { agentId: "agent-marco-ferretti", shiftSeed: 555_202, qualitySeed: 987_702, latenessChance: 0.12, qualityBase: 90, qualityStepMin: -2.4, qualityStepMax: 2.5 },
  { agentId: "agent-priya-nair", shiftSeed: 555_203, qualitySeed: 987_703, latenessChance: 0.08, qualityBase: 93, qualityStepMin: -2.0, qualityStepMax: 2.2 },

  { agentId: "agent-tobias-reinholt", shiftSeed: 555_211, qualitySeed: 987_711, latenessChance: 0.2, qualityBase: 82, qualityStepMin: -3.0, qualityStepMax: 3.2 },
  { agentId: "agent-fatima-zahra", shiftSeed: 555_212, qualitySeed: 987_712, latenessChance: 0.24, qualityBase: 78, qualityStepMin: -3.2, qualityStepMax: 3.4 },
  { agentId: "agent-lukas-beranek", shiftSeed: 555_213, qualitySeed: 987_713, latenessChance: 0.18, qualityBase: 83, qualityStepMin: -2.8, qualityStepMax: 3.0 },
  { agentId: "agent-noora-salminen", shiftSeed: 555_214, qualitySeed: 987_714, latenessChance: 0.26, qualityBase: 77, qualityStepMin: -3.3, qualityStepMax: 3.5 },

  { agentId: "agent-diego-alcantara", shiftSeed: 555_221, qualitySeed: 987_721, latenessChance: 0.38, qualityBase: 70, qualityStepMin: -4.0, qualityStepMax: 4.2 },
  { agentId: "agent-yara-khoury", shiftSeed: 555_222, qualitySeed: 987_722, latenessChance: 0.44, qualityBase: 67, qualityStepMin: -4.2, qualityStepMax: 4.5 },
  { agentId: "agent-milan-kovac", shiftSeed: 555_223, qualitySeed: 987_723, latenessChance: 0.36, qualityBase: 71, qualityStepMin: -3.8, qualityStepMax: 4.0 },
  { agentId: "agent-grace-okafor", shiftSeed: 555_224, qualitySeed: 987_724, latenessChance: 0.48, qualityBase: 65, qualityStepMin: -4.4, qualityStepMax: 4.6 },
];

function buildShiftWeek(seed: number, latenessChance: number): ShiftDay[] {
  const rng = new Rng(seed);
  const days: ShiftDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayTs = TODAY_START - i * DAY;
    const late = rng.chance(latenessChance) ? rng.int(1, 22) : 0;
    const breakMin = rng.int(35, 65);
    const outExtra = rng.int(-10, 25);
    const inTs = dayTs + 9 * HOUR + late * MINUTE;
    const outTs = dayTs + 18 * HOUR + outExtra * MINUTE;
    days.push({
      date: shortDate(dayTs),
      plannedIn: "09:00",
      actualIn: toLocalISO(inTs).slice(11, 16),
      plannedOut: "18:00",
      actualOut: toLocalISO(outTs).slice(11, 16),
      lateMinutes: late,
      breakMinutes: breakMin,
      workedHours: Math.round(((outTs - inTs) / HOUR - breakMin / 60) * 10) / 10,
    });
  }
  return days;
}

function buildQualityTrend(
  seed: number,
  base: number,
  stepMin: number,
  stepMax: number,
): AgentQualityPoint[] {
  const rng = new Rng(seed);
  const points: AgentQualityPoint[] = [];
  let score = base;
  for (let i = 29; i >= 0; i--) {
    score = Math.min(98, Math.max(60, score + rng.range(stepMin, stepMax)));
    points.push({ day: shortDate(MOCK_NOW - i * DAY), score: Math.round(score * 10) / 10 });
  }
  return points;
}

export const TEAM_SHIFT_QUALITY: AgentShiftQuality[] = TEAM_ROSTER.map((entry) => {
  const params = PARAMS.find((p) => p.agentId === entry.id);
  if (!params) {
    throw new Error(`team-shift-quality: "${entry.id}" için parametre tanımlı değil.`);
  }
  return {
    agentId: entry.id,
    name: entry.name,
    role: entry.role,
    shiftWeek: buildShiftWeek(params.shiftSeed, params.latenessChance),
    qualityTrend: buildQualityTrend(
      params.qualitySeed,
      params.qualityBase,
      params.qualityStepMin,
      params.qualityStepMax,
    ),
  };
});
