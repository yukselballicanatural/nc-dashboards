/**
 * TAKIM PDKS MOTORU — agent PDKS motorunun (pdks.ts) takım geneli hali.
 *
 * Kural aynıdır ve tek yerde tanımlıdır: her iş günü turnike İÇİNDE
 * `DAILY_TARGET_MINUTES` (7 sa 30 dk) kalınması beklenir; dışarıda geçen süre
 * düşülür. Bu dosya yalnızca o motoru takımın her üyesi için çalıştırır —
 * kural mantığı burada TEKRAR EDİLMEZ (`buildRawDays` + `summarizeRawDays`).
 *
 * VERİ TUTARLILIĞI: Her agent'ın son 7 günü, Takım Lideri panelinin zaten
 * kullandığı `TEAM_SHIFT_QUALITY` vardiya kayıtlarından türetilir. Callum'un
 * satırı agent panelindeki PDKS sayfasıyla birebir aynı tohumu kullanır
 * (`AGENT_PDKS_SEED`), böylece iki panel asla çelişmez.
 *
 * `TEAM_SHIFT_QUALITY.shiftWeek` dizisinde tarih damgası yoktur; üretim
 * döngüsü (bkz. team-shift-quality.ts — `buildShiftWeek`) i = 6..0 sırasıyla
 * ürettiği için indeks → gün eşlemesi sabittir: indeks 0 = 6 gün önce,
 * son indeks = bugün.
 */

import type { Lang } from "@/lib/i18n/core";
import { DAY } from "./lead-engine";
import {
  buildRawDays,
  dayKey,
  summarizeRawDays,
  TODAY_START,
  type PdksPersonalCalendar,
  type PdksSummary,
  type ShiftSeedRecord,
} from "./pdks";
import { Rng } from "./seeded-random";
import { TEAM_SHIFT_QUALITY } from "./team-shift-quality";
import { AGENT_PROFILE } from "./mock-data";
import { TEAM_NAME } from "./team-roster";

/** Agent panelindeki PDKS serisiyle birebir aynı olması gereken tohum. */
const AGENT_PDKS_SEED = 414_207;

/**
 * KİŞİSEL İZİN / DEVAMSIZLIK ÜRETİMİ.
 *
 * İzin ve devamsızlık kişiseldir — ortak takvim kullanılsa 12 danışman da aynı
 * gün devamsız görünürdü (ilk sürümdeki hata). Günler yalnızca pencerenin
 * ESKİ 23 GÜNÜNDEN seçilir: son 7 gün mevcut vardiya kaydından türetiliyor ve
 * o günlerde gerçek turnike hareketi var; o günü "izinli" işaretlemek veriyle
 * çelişirdi.
 *
 * Devamsızlık nadirdir ve profille tutarlıdır: geç kalma eğilimi yüksek
 * (Junior/gelişmeli) danışmanlarda daha olası.
 */
const WINDOW_DAYS = 30;
const PERSONAL_WINDOW_START = 7; // 7 gün öncesinden daha eski günler

function buildPersonalCalendar(seed: number, absentChance: number): PdksPersonalCalendar {
  const rng = new Rng(seed);
  const leaveKeys = new Set<string>();
  const absentKeys = new Set<string>();

  /** Hafta içi bir gün seçer (hafta sonu/tatil zaten hedefsiz). */
  const pickWeekday = (): string | null => {
    for (let attempt = 0; attempt < 12; attempt++) {
      const offset = rng.int(PERSONAL_WINDOW_START + 1, WINDOW_DAYS - 1);
      const ts = TODAY_START - offset * DAY;
      const wd = new Date(ts + 3 * 60 * 60 * 1000).getUTCDay();
      if (wd === 0 || wd === 6) continue;
      const key = dayKey(ts);
      if (leaveKeys.has(key) || absentKeys.has(key)) continue;
      return key;
    }
    return null;
  };

  // 0-2 gün planlı izin.
  const leaveDays = rng.weighted<number>([
    [0, 45],
    [1, 35],
    [2, 20],
  ]);
  for (let i = 0; i < leaveDays; i++) {
    const key = pickWeekday();
    if (key) leaveKeys.add(key);
  }

  // Devamsızlık: profil bazlı olasılıkla en fazla 1 gün.
  if (rng.chance(absentChance)) {
    const key = pickWeekday();
    if (key) absentKeys.add(key);
  }

  return { leaveKeys, absentKeys };
}

export interface TeamPdksRow {
  agentId: string;
  name: string;
  role: "Senior" | "Junior";
  /** Agent panelinin sahibi (Callum) — vurgulu gösterim için. */
  isSelf: boolean;
  summary: PdksSummary;
}

export interface TeamPdksOverview {
  teamName: string;
  teamSize: number;
  rows: TeamPdksRow[];
  /** Takımın toplam iş günü bakiyesi (negatif = toplam eksik mesai). */
  totalWorkdayBalanceMinutes: number;
  /** Yalnızca eksikte olan agent'ların bakiye toplamı (negatif). */
  totalDeficitMinutes: number;
  /** Bakiyesi negatif olan agent sayısı. */
  agentsInDeficit: number;
  /** Takım geneli hedef tutma oranı (%). */
  compliancePct: number;
  /**
   * Takım genelinde hedefin ALTINDA kalınan gün sayısı ve toplam iş günü.
   * Aylık bakiye artıda olsa bile günlük disiplin bozuk olabilir; manşet
   * rakamın gizlediği sinyal budur.
   */
  totalDeficitDays: number;
  totalWorkdayCount: number;
  /** Takımın hafta sonu / tatilde çalıştığı toplam dakika. */
  totalExtraShiftMinutes: number;
  /** Toplam devamsız gün. */
  totalAbsentDays: number;
  /** İş günü başına ortalama turnike-içi dakika (takım). */
  avgInsideMinutes: number;
  /** En çok eksiği olan 3 agent. */
  worstAgents: TeamPdksRow[];
  /** Hedefi en iyi tutan 3 agent. */
  bestAgents: TeamPdksRow[];
}

/** Bir agent'ın 7 günlük vardiya kaydını PDKS motorunun beklediği şekle çevirir. */
function toShiftSeedRecords(shiftWeek: (typeof TEAM_SHIFT_QUALITY)[number]["shiftWeek"]): ShiftSeedRecord[] {
  const lastIndex = shiftWeek.length - 1;
  return shiftWeek.map((day, index) => ({
    ts: TODAY_START - (lastIndex - index) * DAY,
    actualIn: day.actualIn,
    actualOut: day.actualOut,
    lateMinutes: day.lateMinutes,
    breakMinutes: day.breakMinutes,
  }));
}

/**
 * Ham seriler — modül yüklenirken BİR KEZ (dile bağımlı olmayan kısım).
 *
 * Callum için tohum ve takvim agent panelindekiyle AYNIDIR (takvim parametresi
 * verilmez → motorun kendi varsayılanı kullanılır), böylece iki panel çelişmez.
 */
const RAW_BY_AGENT = TEAM_SHIFT_QUALITY.map((agent, index) => {
  const isSelf = agent.agentId === AGENT_PROFILE.id;
  const seed = isSelf ? AGENT_PDKS_SEED : AGENT_PDKS_SEED + (index + 1) * 1_013;
  const records = toShiftSeedRecords(agent.shiftWeek);
  return {
    agentId: agent.agentId,
    name: agent.name,
    role: agent.role,
    isSelf,
    rawDays: isSelf
      ? buildRawDays(seed, records)
      : buildRawDays(
          seed,
          records,
          buildPersonalCalendar(seed + 5_077, agent.role === "Junior" ? 0.35 : 0.18),
        ),
  };
});

export function teamPdksOverview(lang: Lang = "tr"): TeamPdksOverview {
  const rows: TeamPdksRow[] = RAW_BY_AGENT.map((agent) => ({
    agentId: agent.agentId,
    name: agent.name,
    role: agent.role,
    isSelf: agent.isSelf,
    summary: summarizeRawDays(agent.rawDays, lang),
  }));

  // Sıralama: en çok eksiği olan üstte — TL'nin aksiyon alacağı satır o.
  const ordered = [...rows].sort(
    (a, b) =>
      a.summary.workdayBalanceMinutes - b.summary.workdayBalanceMinutes ||
      a.name.localeCompare(b.name, "tr"),
  );

  const totalWorkdayBalanceMinutes = rows.reduce(
    (s, r) => s + r.summary.workdayBalanceMinutes,
    0,
  );
  const totalDeficitMinutes = rows
    .filter((r) => r.summary.workdayBalanceMinutes < 0)
    .reduce((s, r) => s + r.summary.workdayBalanceMinutes, 0);

  const totalWorkdays = rows.reduce((s, r) => s + r.summary.workdayCount, 0);
  const totalCompliant = rows.reduce((s, r) => s + r.summary.compliantDayCount, 0);
  const totalInside = rows.reduce((s, r) => s + r.summary.totalInsideWorkdayMinutes, 0);

  return {
    teamName: TEAM_NAME,
    teamSize: rows.length,
    rows: ordered,
    totalWorkdayBalanceMinutes,
    totalDeficitMinutes,
    agentsInDeficit: rows.filter((r) => r.summary.workdayBalanceMinutes < 0).length,
    compliancePct:
      totalWorkdays > 0 ? Math.round((totalCompliant / totalWorkdays) * 1000) / 10 : 0,
    totalDeficitDays: rows.reduce((s, r) => s + r.summary.deficitDayCount, 0),
    totalWorkdayCount: totalWorkdays,
    totalExtraShiftMinutes: rows.reduce((s, r) => s + r.summary.extraShiftMinutes, 0),
    totalAbsentDays: rows.reduce((s, r) => s + r.summary.absentDayCount, 0),
    avgInsideMinutes: totalWorkdays > 0 ? Math.round(totalInside / totalWorkdays) : 0,
    worstAgents: ordered.slice(0, 3),
    bestAgents: [...ordered].reverse().slice(0, 3),
  };
}
