/**
 * PDKS (Personel Devam Kontrol Sistemi) MOTORU — turnike bazlı mesai takibi.
 *
 * İŞ KURALI (kullanıcı tanımı): Binada birden fazla turnike kapısı var
 * (Satış Giriş 1, Satış Giriş 2, İdari Giriş). Agent'ın turnike İÇİNDE
 * kesintisiz `DAILY_TARGET_MINUTES` (7 saat 30 dakika) kalması beklenir.
 *
 * Bu yüzden "çalışılan süre" = ilk giriş ile son çıkış arasındaki brüt süre
 * DEĞİL; gün içinde turnikeden çıkıp dışarıda geçirilen süreler düşülerek
 * bulunan NET turnike-içi süredir. Öğle yemeğine dışarı çıkılırsa o süre
 * sayılmaz; masada/kantinde geçirilen mola turnike içinde olduğu için sayılır.
 *
 * VERİ TUTARLILIĞI: Serinin SON 7 GÜNÜ mevcut vardiya verisinden
 * (`SHIFT_WEEK_TIMESTAMPED`) türetilir — ilk giriş / son çıkış saatleri
 * Dashboard'daki "Son 7 Gün Vardiya" tablosuyla birebir aynıdır. Ondan
 * önceki günler kendi tohumuyla üretilir.
 *
 * HAFTA SONU / TATİL: Hedef 0 dakikadır. O günlerde turnike hareketi varsa
 * tamamı FAZLA MESAİ sayılır ve aylık "eksik mesai" bakiyesine karıştırılmaz
 * (bkz. `PdksSummary.workdayBalanceMinutes` vs `extraShiftMinutes`) — yoksa
 * hafta sonu çalışması iş günü eksiklerini gizlerdi.
 */

import type { Lang } from "@/lib/i18n/core";
import { pick } from "@/lib/i18n/core";
import { DAY, HOUR, MINUTE, MOCK_NOW } from "./lead-engine";
import { Rng } from "./seeded-random";
import { SHIFT_WEEK_TIMESTAMPED } from "./datasets";
import { TEAM_SHIFT_QUALITY } from "./team-shift-quality";
import { AGENT_PROFILE } from "./mock-data";
import { TEAM_NAME } from "./team-roster";

const TZ_OFFSET = 3 * HOUR;

/** Turnike içinde kalınması gereken günlük net süre — 7 sa 30 dk. */
export const DAILY_TARGET_MINUTES = 7 * 60 + 30;

/** PDKS penceresi (gün) — son 30 gün. */
const WINDOW_DAYS = 30;

/** Planlanan vardiya (bilgi amaçlı; hedef süre turnike-içi dakikadır). */
export const PLANNED_SHIFT = { inHour: 9, outHour: 18 } as const;

/**
 * Mola hakkının turnike İÇİNDE sayılan kısmı (dk). Son 7 günün kayıtlı mola
 * süresini turnike-içi / turnike-dışı olarak ikiye bölmek için kullanılır:
 * bu eşiğe kadarki mola masada/kantinde varsayılır, aşan kısım dışarıda.
 */
const BREAK_COUNTED_INSIDE_MINUTES = 15;

/* ------------------------------------------------------------------ */
/* Yardımcılar                                                         */
/* ------------------------------------------------------------------ */

function startOfDay(ts: number): number {
  const local = ts + TZ_OFFSET;
  return local - (local % DAY) - TZ_OFFSET;
}

/** Epoch → "HH:MM" (İstanbul). */
function clock(ts: number): string {
  return new Date(ts + TZ_OFFSET).toISOString().slice(11, 16);
}

/** Epoch → yerel hafta günü indeksi (0 = Pazar). */
function weekdayIndex(ts: number): number {
  return new Date(ts + TZ_OFFSET).getUTCDay();
}

/** 450 → "7sa 30dk", -20 → "20dk" (işaret çağıran tarafta gösterilir). */
export function formatDuration(minutes: number, lang: Lang = "tr"): string {
  const total = Math.abs(Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  const hourUnit = pick(lang, "sa", "h");
  const minUnit = pick(lang, "dk", "m");
  if (h === 0) return `${m}${minUnit}`;
  if (m === 0) return `${h}${hourUnit}`;
  return `${h}${hourUnit} ${m}${minUnit}`;
}

/* ------------------------------------------------------------------ */
/* Tipler                                                              */
/* ------------------------------------------------------------------ */

export type GateId = "sales-1" | "sales-2" | "admin";

export function gateLabel(gate: GateId, lang: Lang = "tr"): string {
  switch (gate) {
    case "sales-1":
      return pick(lang, "Satış Giriş 1", "Sales Gate 1");
    case "sales-2":
      return pick(lang, "Satış Giriş 2", "Sales Gate 2");
    case "admin":
      return pick(lang, "İdari Giriş", "Admin Gate");
  }
}

export const GATE_IDS: readonly GateId[] = ["sales-1", "sales-2", "admin"];

export interface TurnstileEvent {
  /** "HH:MM" */
  time: string;
  direction: "in" | "out";
  gate: GateId;
}

export type PdksDayType = "workday" | "weekend" | "holiday" | "leave" | "absent";

export function dayTypeLabel(type: PdksDayType, lang: Lang = "tr"): string {
  switch (type) {
    case "workday":
      return pick(lang, "İş günü", "Workday");
    case "weekend":
      return pick(lang, "Hafta sonu", "Weekend");
    case "holiday":
      return pick(lang, "Resmi tatil", "Public holiday");
    case "leave":
      return pick(lang, "İzinli", "On leave");
    case "absent":
      return pick(lang, "Devamsız", "Absent");
  }
}

export interface PdksDay {
  ts: number;
  /** "4 Ağu" */
  dateLabel: string;
  /** "Sal" */
  weekdayLabel: string;
  type: PdksDayType;
  /** Bugün mü (mock "şimdi"ye göre). */
  isToday: boolean;
  events: TurnstileEvent[];
  firstIn: string | null;
  lastOut: string | null;
  /** Turnike içinde geçirilen NET dakika. */
  insideMinutes: number;
  /** Gün içinde turnikeden çıkıp dönme sayısı. */
  exitCount: number;
  /** Gün içinde turnike dışında geçirilen dakika. */
  outsideMinutes: number;
  /** Bu gün için beklenen turnike-içi dakika (iş günü 450, diğerleri 0). */
  targetMinutes: number;
  /** inside − target. Negatif = eksik mesai. */
  balanceMinutes: number;
  /** Planlanan 09:00'a göre geç giriş (dk). */
  lateMinutes: number;
  /** İş gününde hedefi tuttu mu (hafta sonu/tatil/izin: true sayılır). */
  compliant: boolean;
}

export interface PdksSummary {
  /** Penceredeki tüm günler, eskiden yeniye. */
  days: PdksDay[];
  /** Bugünün satırı (pencerenin son günü). */
  today: PdksDay;
  /** İş günü sayısı (izin/devamsız dahil — hedefi olan günler). */
  workdayCount: number;
  /** Toplam beklenen turnike-içi dakika. */
  totalTargetMinutes: number;
  /** İş günlerinde turnike içinde geçirilen toplam dakika. */
  totalInsideWorkdayMinutes: number;
  /** İŞ GÜNÜ bakiyesi (negatif = eksik mesai) — sayfanın manşet rakamı. */
  workdayBalanceMinutes: number;
  /** Hafta sonu / resmi tatilde çalışılan dakika (fazla mesai). */
  extraShiftMinutes: number;
  /** workdayBalance + extraShift. */
  netBalanceMinutes: number;
  /** Hedefin altında kalınan iş günü sayısı. */
  deficitDayCount: number;
  /** Hedefi tutan iş günü sayısı. */
  compliantDayCount: number;
  /** Hedefi tutan iş günü oranı (%). */
  compliancePct: number;
  absentDayCount: number;
  leaveDayCount: number;
  holidayDayCount: number;
  /** Toplam geç giriş dakikası. */
  totalLateMinutes: number;
  /** İş günü başına ortalama turnike-içi dakika. */
  avgInsideMinutes: number;
  /** En çok eksik kalınan iş günleri (en kötü 3). */
  worstDays: PdksDay[];
  /** Kapı kullanım dağılımı (giriş yönlü hareket sayısı). */
  gateUsage: Array<{ gate: GateId; count: number }>;
  /** Yayan bakiye — grafik için (iş günü bakiyesinin kümülatifi). */
  cumulative: Array<{ dateLabel: string; balanceMinutes: number; cumulativeMinutes: number }>;
}

/* ------------------------------------------------------------------ */
/* Takvim — gün tipleri                                                */
/* ------------------------------------------------------------------ */

/**
 * Pencere içindeki resmi tatiller (İstanbul). MOCK_NOW = 4 Ağu 2026 olduğu
 * için pencere 6 Tem – 4 Ağu 2026: 15 Temmuz Demokrasi ve Milli Birlik Günü
 * bu aralığa düşer.
 */
const HOLIDAY_KEYS = new Set(["2026-07-15"]);

/**
 * KİŞİYE ÖZEL TAKVİM. Resmi tatil tüm şirkete ortaktır, ama izin ve
 * devamsızlık kişiseldir — bu yüzden gün kümeleri parametre olarak gelir.
 * Ortak (statik) küme kullanılsa takımın 12 danışmanı da aynı gün devamsız
 * görünürdü.
 */
export interface PdksPersonalCalendar {
  /** Planlı yıllık izin günleri ("YYYY-MM-DD"). */
  leaveKeys: ReadonlySet<string>;
  /** Mazeretsiz devamsız günler ("YYYY-MM-DD"). */
  absentKeys: ReadonlySet<string>;
}

/** Agent panelinin referans profili (Callum) — mevcut davranış korunur. */
const AGENT_CALENDAR: PdksPersonalCalendar = {
  leaveKeys: new Set(["2026-07-20"]),
  absentKeys: new Set(["2026-07-28"]),
};

export function dayKey(ts: number): string {
  return new Date(ts + TZ_OFFSET).toISOString().slice(0, 10);
}

function resolveDayType(ts: number, calendar: PdksPersonalCalendar): PdksDayType {
  const wd = weekdayIndex(ts);
  if (wd === 0 || wd === 6) return "weekend";
  const key = dayKey(ts);
  if (HOLIDAY_KEYS.has(key)) return "holiday";
  if (calendar.leaveKeys.has(key)) return "leave";
  if (calendar.absentKeys.has(key)) return "absent";
  return "workday";
}

/* ------------------------------------------------------------------ */
/* Turnike hareketlerinden net süre                                    */
/* ------------------------------------------------------------------ */

interface Movement {
  inTs: number;
  outTs: number;
  inGate: GateId;
  outGate: GateId;
}

/** Eşleşmiş giriş-çıkış bloklarından olay listesi + net süre üretir. */
function buildFromMovements(blocks: Movement[]): {
  events: TurnstileEvent[];
  insideMinutes: number;
  outsideMinutes: number;
  exitCount: number;
  firstIn: string | null;
  lastOut: string | null;
} {
  if (blocks.length === 0) {
    return {
      events: [],
      insideMinutes: 0,
      outsideMinutes: 0,
      exitCount: 0,
      firstIn: null,
      lastOut: null,
    };
  }

  const events: TurnstileEvent[] = [];
  let insideMs = 0;
  for (const block of blocks) {
    events.push({ time: clock(block.inTs), direction: "in", gate: block.inGate });
    events.push({ time: clock(block.outTs), direction: "out", gate: block.outGate });
    insideMs += block.outTs - block.inTs;
  }

  const grossMs = blocks[blocks.length - 1].outTs - blocks[0].inTs;

  return {
    events,
    insideMinutes: Math.round(insideMs / MINUTE),
    outsideMinutes: Math.round((grossMs - insideMs) / MINUTE),
    // Son çıkış "eve gidiş"tir; ara çıkışlar = blok sayısı − 1.
    exitCount: blocks.length - 1,
    firstIn: clock(blocks[0].inTs),
    lastOut: clock(blocks[blocks.length - 1].outTs),
  };
}

/* ------------------------------------------------------------------ */
/* Gün üretimi                                                         */
/* ------------------------------------------------------------------ */

const MONTHS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS_TR = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Ham gün — dile bağımlı etiketler `pdksSummary(lang)` içinde eklenir. */
export interface RawDay {
  ts: number;
  type: PdksDayType;
  events: TurnstileEvent[];
  firstIn: string | null;
  lastOut: string | null;
  insideMinutes: number;
  outsideMinutes: number;
  exitCount: number;
  lateMinutes: number;
}

/** Girişte/çıkışta kullanılan kapıyı seçer — çoğunlukla satış kapıları. */
function pickGate(rng: Rng): GateId {
  return rng.weighted<GateId>([
    ["sales-1", 62],
    ["sales-2", 28],
    ["admin", 10],
  ]);
}

/**
 * Bir iş günü için turnike hareketleri üretir (pencerenin ilk 23 günü).
 *
 * Dağılım bilinçli olarak GERÇEKÇİ ŞEKİLDE DEĞİŞKEN: 09:00–18:00 penceresi
 * 7,5 saatlik hedefin üstünde 1,5 saat pay bıraktığı için, eksik mesai ancak
 * geç giriş + uzun öğle arası + erken çıkış birleştiğinde oluşur. Sadece
 * "temiz" günler üretilirse sayfa hiç eksik göstermez ve anlamsızlaşır;
 * bu yüzden ayda birkaç problemli gün (geç kalma, uzun yemek, erken çıkış)
 * üretilir.
 */
function generateWorkday(dayStart: number, rng: Rng): RawDay {
  const late = rng.chance(0.42) ? rng.int(3, 48) : 0;
  const inTs = dayStart + PLANNED_SHIFT.inHour * HOUR + late * MINUTE;
  // Çıkış sapması: çoğu gün normal/az fazla mesai, bazı günler erken çıkış.
  const outDeviation = rng.chance(0.3) ? rng.int(-80, -20) : rng.int(-8, 26);
  const outTs = dayStart + PLANNED_SHIFT.outHour * HOUR + outDeviation * MINUTE;

  const blocks: Movement[] = [];
  let cursor = inTs;
  let cursorGate = pickGate(rng);

  // Öğle arası — %82 olasılıkla turnikeden ÇIKARAK (dışarıda yemek).
  // Süre çoğunlukla normal, bazı günler uzuyor.
  if (rng.chance(0.82)) {
    const lunchOut = dayStart + 12 * HOUR + rng.int(10, 80) * MINUTE;
    const lunchLength = rng.chance(0.25) ? rng.int(75, 110) : rng.int(30, 60);
    const lunchBack = lunchOut + lunchLength * MINUTE;
    if (lunchOut > cursor && lunchBack < outTs) {
      const outGate = pickGate(rng);
      blocks.push({ inTs: cursor, outTs: lunchOut, inGate: cursorGate, outGate });
      cursor = lunchBack;
      cursorGate = pickGate(rng);
    }
  }

  // Kısa ikinci çıkış (kargo/banka/sigara) — %32.
  if (rng.chance(0.32)) {
    const shortOut = dayStart + rng.int(15, 16) * HOUR + rng.int(0, 55) * MINUTE;
    const shortBack = shortOut + rng.int(8, 28) * MINUTE;
    if (shortOut > cursor && shortBack < outTs) {
      const outGate = pickGate(rng);
      blocks.push({ inTs: cursor, outTs: shortOut, inGate: cursorGate, outGate });
      cursor = shortBack;
      cursorGate = pickGate(rng);
    }
  }

  blocks.push({ inTs: cursor, outTs, inGate: cursorGate, outGate: pickGate(rng) });

  const built = buildFromMovements(blocks);
  return { ts: dayStart, type: "workday", lateMinutes: late, ...built };
}

/**
 * Son 7 günün bir gününü MEVCUT vardiya kaydından türetir. İlk giriş / son
 * çıkış saatleri birebir korunur; kayıtlı mola süresinin
 * `BREAK_COUNTED_INSIDE_MINUTES` üstündeki kısmı turnike DIŞI sayılır.
 */
function deriveFromShiftRecord(
  record: ShiftSeedRecord,
  type: PdksDayType,
  rng: Rng,
): RawDay {
  const dayStart = startOfDay(record.ts);
  const [inH, inM] = record.actualIn.split(":").map(Number);
  const [outH, outM] = record.actualOut.split(":").map(Number);
  const inTs = dayStart + inH * HOUR + inM * MINUTE;
  const outTs = dayStart + outH * HOUR + outM * MINUTE;

  const outsideMin = Math.max(0, record.breakMinutes - BREAK_COUNTED_INSIDE_MINUTES);

  const blocks: Movement[] = [];
  if (outsideMin > 0) {
    // Öğle arası ortalarda; dışarıda geçen süre kadar turnike dışında.
    const lunchOut = dayStart + 12 * HOUR + rng.int(15, 70) * MINUTE;
    const lunchBack = lunchOut + outsideMin * MINUTE;
    if (lunchOut > inTs && lunchBack < outTs) {
      blocks.push({ inTs, outTs: lunchOut, inGate: pickGate(rng), outGate: pickGate(rng) });
      blocks.push({ inTs: lunchBack, outTs, inGate: pickGate(rng), outGate: pickGate(rng) });
    }
  }
  if (blocks.length === 0) {
    blocks.push({ inTs, outTs, inGate: pickGate(rng), outGate: pickGate(rng) });
  }

  const built = buildFromMovements(blocks);
  return { ts: dayStart, type, lateMinutes: record.lateMinutes, ...built };
}

/** Hareketsiz gün (izin / devamsız / çalışılmayan hafta sonu-tatil). */
function emptyDay(dayStart: number, type: PdksDayType): RawDay {
  return {
    ts: dayStart,
    type,
    events: [],
    firstIn: null,
    lastOut: null,
    insideMinutes: 0,
    outsideMinutes: 0,
    exitCount: 0,
    lateMinutes: 0,
  };
}

/* ------------------------------------------------------------------ */
/* Ham seri — modül yüklenirken BİR KEZ                                */
/* ------------------------------------------------------------------ */

export const TODAY_START = startOfDay(MOCK_NOW);

/** `deriveFromShiftRecord` için gereken asgari vardiya alanları. */
export interface ShiftSeedRecord {
  ts: number;
  actualIn: string;
  actualOut: string;
  lateMinutes: number;
  breakMinutes: number;
}

/**
 * 30 günlük ham PDKS serisi üretir. Son 7 gün, verilen vardiya kayıtlarından
 * türetilir (giriş/çıkış saatleri birebir korunur → panelin geri kalanıyla
 * çelişmez); öncesi verilen tohumla üretilir.
 *
 * Takım Lideri panelindeki her agent için de bu fonksiyon kullanılır — tek
 * kural motoru, tek doğruluk kaynağı (bkz. lib/mock/team-pdks.ts).
 */
export function buildRawDays(
  seed: number,
  shiftRecords: readonly ShiftSeedRecord[],
  calendar: PdksPersonalCalendar = AGENT_CALENDAR,
): RawDay[] {
  const rng = new Rng(seed);
  const days: RawDay[] = [];

  /** Son 7 günün tarih damgası → mevcut vardiya kaydı. */
  const shiftByDay = new Map<number, ShiftSeedRecord>();
  for (const record of shiftRecords) {
    shiftByDay.set(startOfDay(record.ts), record);
  }

  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    const dayStart = TODAY_START - i * DAY;
    const type = resolveDayType(dayStart, calendar);
    const record = shiftByDay.get(dayStart);

    if (record) {
      // Son 7 gün — mevcut kayıttan türet (hafta sonu olsa bile hareket varsa
      // gösterilir; hedefi 0 olduğu için fazla mesai sayılır).
      days.push(deriveFromShiftRecord(record, type, rng));
      continue;
    }

    if (type === "workday") {
      days.push(generateWorkday(dayStart, rng));
    } else {
      days.push(emptyDay(dayStart, type));
    }
  }

  return days;
}

const RAW_DAYS: RawDay[] = buildRawDays(414_207, SHIFT_WEEK_TIMESTAMPED);

/* ------------------------------------------------------------------ */
/* Özet — dile göre etiketlenmiş                                       */
/* ------------------------------------------------------------------ */

/** Bir günün hedefi: yalnızca iş günlerinde (izin/devamsız dahil) beklenir. */
function targetFor(type: PdksDayType): number {
  return type === "workday" || type === "absent" ? DAILY_TARGET_MINUTES : 0;
}

/** Ham günleri dile göre etiketleyip özetler — agent ve takım için ortak. */
export function summarizeRawDays(rawDays: readonly RawDay[], lang: Lang = "tr"): PdksSummary {
  const months = lang === "en" ? MONTHS_EN : MONTHS_TR;
  const weekdays = lang === "en" ? WEEKDAYS_EN : WEEKDAYS_TR;

  const days: PdksDay[] = rawDays.map((raw) => {
    const iso = new Date(raw.ts + TZ_OFFSET).toISOString();
    const targetMinutes = targetFor(raw.type);
    const balanceMinutes = raw.insideMinutes - targetMinutes;
    return {
      ts: raw.ts,
      dateLabel: `${Number(iso.slice(8, 10))} ${months[Number(iso.slice(5, 7)) - 1]}`,
      weekdayLabel: weekdays[weekdayIndex(raw.ts)],
      type: raw.type,
      isToday: raw.ts === TODAY_START,
      events: raw.events,
      firstIn: raw.firstIn,
      lastOut: raw.lastOut,
      insideMinutes: raw.insideMinutes,
      exitCount: raw.exitCount,
      outsideMinutes: raw.outsideMinutes,
      targetMinutes,
      balanceMinutes,
      lateMinutes: raw.lateMinutes,
      compliant: targetMinutes === 0 ? true : balanceMinutes >= 0,
    };
  });

  const targetDays = days.filter((d) => d.targetMinutes > 0);
  const nonTargetDays = days.filter((d) => d.targetMinutes === 0);

  const totalTargetMinutes = targetDays.reduce((s, d) => s + d.targetMinutes, 0);
  const totalInsideWorkdayMinutes = targetDays.reduce((s, d) => s + d.insideMinutes, 0);
  const workdayBalanceMinutes = totalInsideWorkdayMinutes - totalTargetMinutes;
  const extraShiftMinutes = nonTargetDays.reduce((s, d) => s + d.insideMinutes, 0);

  const compliantDayCount = targetDays.filter((d) => d.compliant).length;

  // Yayan bakiye — yalnızca hedefi olan günler birikime katılır.
  let running = 0;
  const cumulative = days.map((d) => {
    if (d.targetMinutes > 0) running += d.balanceMinutes;
    return {
      dateLabel: d.dateLabel,
      balanceMinutes: d.targetMinutes > 0 ? d.balanceMinutes : 0,
      cumulativeMinutes: running,
    };
  });

  const gateUsage = GATE_IDS.map((gate) => ({
    gate,
    count: days.reduce(
      (s, d) => s + d.events.filter((e) => e.gate === gate && e.direction === "in").length,
      0,
    ),
  })).sort((a, b) => b.count - a.count);

  return {
    days,
    today: days[days.length - 1],
    workdayCount: targetDays.length,
    totalTargetMinutes,
    totalInsideWorkdayMinutes,
    workdayBalanceMinutes,
    extraShiftMinutes,
    netBalanceMinutes: workdayBalanceMinutes + extraShiftMinutes,
    deficitDayCount: targetDays.filter((d) => d.balanceMinutes < 0).length,
    compliantDayCount,
    compliancePct:
      targetDays.length > 0
        ? Math.round((compliantDayCount / targetDays.length) * 1000) / 10
        : 0,
    absentDayCount: days.filter((d) => d.type === "absent").length,
    leaveDayCount: days.filter((d) => d.type === "leave").length,
    holidayDayCount: days.filter((d) => d.type === "holiday").length,
    totalLateMinutes: days.reduce((s, d) => s + d.lateMinutes, 0),
    avgInsideMinutes:
      targetDays.length > 0 ? Math.round(totalInsideWorkdayMinutes / targetDays.length) : 0,
    worstDays: [...targetDays]
      .filter((d) => d.balanceMinutes < 0)
      .sort((a, b) => a.balanceMinutes - b.balanceMinutes)
      .slice(0, 3),
    gateUsage,
    cumulative,
  };
}

/** Agent panelinin (Callum) PDKS özeti. */
export function pdksSummary(lang: Lang = "tr"): PdksSummary {
  return summarizeRawDays(RAW_DAYS, lang);
}

/* ------------------------------------------------------------------ */
/* Takım kıyası — mevcut 7 günlük takım vardiya verisinden              */
/* ------------------------------------------------------------------ */

export interface PdksTeamComparison {
  teamName: string;
  teamSize: number;
  /** Agent'ın 7 günlük ortalama geç giriş dakikası. */
  selfAvgLateMinutes: number;
  /** Takımın 7 günlük ortalama geç giriş dakikası (agent dahil). */
  teamAvgLateMinutes: number;
  /** Agent'ın ≤5 dk gecikmeyle başladığı gün oranı (%). */
  selfPunctualPct: number;
  /** Takım ortalaması (%). */
  teamPunctualPct: number;
  /** Geç kalma sıralaması (1 = en az geç kalan). */
  selfLateRank: number;
}

/**
 * NOT: Takım verisi (TEAM_SHIFT_QUALITY) yalnızca 7 günlüktür ve turnike
 * hareketi içermez; bu yüzden kıyas TURNİKE SÜRESİ değil, ortak alan olan
 * GEÇ GİRİŞ / DAKİKLİK üzerinden yapılır. Takım için de turnike verisi
 * üretildiğinde bu kıyas turnike-içi süreye taşınabilir.
 */
export function pdksTeamComparison(): PdksTeamComparison {
  const rows = TEAM_SHIFT_QUALITY.map((agent) => {
    const total = agent.shiftWeek.length;
    const lateSum = agent.shiftWeek.reduce((s, d) => s + d.lateMinutes, 0);
    const punctual = agent.shiftWeek.filter((d) => d.lateMinutes <= 5).length;
    return {
      agentId: agent.agentId,
      avgLate: total > 0 ? lateSum / total : 0,
      punctualPct: total > 0 ? (punctual / total) * 100 : 0,
    };
  });

  const self = rows.find((r) => r.agentId === AGENT_PROFILE.id) ?? rows[0];
  const round1 = (n: number) => Math.round(n * 10) / 10;

  return {
    teamName: TEAM_NAME,
    teamSize: rows.length,
    selfAvgLateMinutes: round1(self.avgLate),
    teamAvgLateMinutes: round1(rows.reduce((s, r) => s + r.avgLate, 0) / rows.length),
    selfPunctualPct: round1(self.punctualPct),
    teamPunctualPct: round1(rows.reduce((s, r) => s + r.punctualPct, 0) / rows.length),
    selfLateRank:
      [...rows].sort((a, b) => a.avgLate - b.avgLate).findIndex((r) => r.agentId === self.agentId) + 1,
  };
}
