/**
 * Türetilmiş veri setleri — CLAUDE.md v2 Bölüm 5.4-5.6.
 * Tüm sayfalar Lead listesi üzerinden hesaplanır; hiçbir istatistik elle
 * yazılmaz. Sabit seed + MOCK_NOW sayesinde SSR/CSR/yenileme tutarlıdır.
 */

import type {
  ActionItem,
  CallbackItem,
  ConversionRow,
  DailyTrendPoint,
  FollowUpRow,
  FunnelStageFull,
  GaugeMetric,
  HourlyCallPoint,
  HourlyRatePoint,
  Kpi,
  Lead,
  StatusLevel,
  PacePoint,
  QualityPoint,
  ShiftDay,
  SpeedToLeadBucket,
} from "@/lib/types/agent-data";
import { DAY, HOUR, MINUTE, MOCK_NOW, SLA_MS, generateLeads } from "./lead-engine";
import {
  PRIORITY_ORDER,
  SPEED_BUCKETS,
  leadPriority,
  nextAction,
  speedToLeadGroup,
} from "./derived";
import { Rng } from "./seeded-random";

/* ------------------------------------------------------------------ */
/* Zaman yardımcıları — İstanbul (+03) sabit ofsetli, deterministik     */
/* ------------------------------------------------------------------ */

const TZ_OFFSET = 3 * HOUR;

/** Epoch → yerel ISO string (İstanbul saati, string tabanlı). */
function toLocalISO(ts: number): string {
  return new Date(ts + TZ_OFFSET).toISOString().slice(0, 19);
}

/** Günün başlangıcı (İstanbul, epoch ms). */
function startOfDay(ts: number): number {
  const local = ts + TZ_OFFSET;
  return local - (local % DAY) - TZ_OFFSET;
}

/** Yerel saat (0-23). */
function hourOf(ts: number): number {
  return new Date(ts + TZ_OFFSET).getUTCHours();
}

const TODAY_START = startOfDay(MOCK_NOW);
const MONTH_START = Date.parse("2026-07-01T00:00:00+03:00");
const DAYS_IN_MONTH = 31;
const DAY_OF_MONTH = 14;

const MONTHS_TR = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
] as const;

function shortDate(ts: number): string {
  const iso = toLocalISO(ts);
  return `${Number(iso.slice(8, 10))} ${MONTHS_TR[Number(iso.slice(5, 7)) - 1]}`;
}

/* ------------------------------------------------------------------ */
/* Ana veri: Lead listesi (tek sefer üretilir)                          */
/* ------------------------------------------------------------------ */

export const LEADS: Lead[] = generateLeads();

const ALL_CALLS = LEADS.flatMap((lead) =>
  lead.calls.map((call) => ({ ...call, lead })),
);

/* ------------------------------------------------------------------ */
/* GÜNLÜK İSTATİSTİKLER — v2 5.6 (hepsi türetilir)                      */
/* ------------------------------------------------------------------ */

const leadsToday = LEADS.filter((l) => l.createdAt >= TODAY_START);
const callsToday = ALL_CALLS.filter((c) => c.time >= TODAY_START);
const answeredToday = callsToday.filter((c) => c.answered);
const neverCalled = LEADS.filter((l) => l.attemptCount === 0);
const slaViolationsToday = leadsToday.filter((l) => {
  const first = l.calls[0];
  if (!first) return MOCK_NOW - l.createdAt > SLA_MS;
  return first.time - l.createdAt > SLA_MS;
});
const contactsToday = LEADS.filter(
  (l) => l.contactAt !== null && l.contactAt >= TODAY_START,
);
const offersToday = LEADS.filter(
  (l) => l.offerCreatedAt !== null && l.offerCreatedAt >= TODAY_START,
);
const dealsToday = LEADS.filter(
  (l) => l.dealAt !== null && l.dealAt >= TODAY_START,
);
const paymentsToday = LEADS.filter(
  (l) => l.paymentAt !== null && l.paymentAt >= TODAY_START,
);

/* Kalite trendi — v2 5.4: 65-98 aralığında yumuşak rastgele yürüyüş. */
export const QUALITY_TREND: QualityPoint[] = (() => {
  const rng = new Rng(987_654);
  const points: QualityPoint[] = [];
  let agent = 84;
  let team = 80;
  for (let i = 29; i >= 0; i--) {
    agent = Math.min(98, Math.max(65, agent + rng.range(-3.5, 3.8)));
    team = Math.min(98, Math.max(65, team + rng.range(-2.5, 2.7)));
    points.push({
      day: shortDate(MOCK_NOW - i * DAY),
      agent: Math.round(agent * 10) / 10,
      team: Math.round(team * 10) / 10,
    });
  }
  return points;
})();

const currentQuality = QUALITY_TREND[QUALITY_TREND.length - 1].agent;
const avgQuality30 =
  Math.round(
    (QUALITY_TREND.reduce((s, p) => s + p.agent, 0) / QUALITY_TREND.length) * 10,
  ) / 10;

/* Vardiya haftası — v2 5.4: %25 olasılıkla 1-22 dk geç, 35-65 dk mola. */
export const SHIFT_WEEK: ShiftDay[] = (() => {
  const rng = new Rng(555_111);
  const days: ShiftDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayTs = TODAY_START - i * DAY;
    const late = rng.chance(0.25) ? rng.int(1, 22) : 0;
    const breakMin = rng.int(35, 65);
    const outExtra = rng.int(-10, 25); // çıkışta küçük sapma
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
      workedHours:
        Math.round(((outTs - inTs) / HOUR - breakMin / 60) * 10) / 10,
    });
  }
  return days;
})();

const shiftCompliancePct =
  (SHIFT_WEEK.filter((d) => d.lateMinutes <= 5).length / SHIFT_WEEK.length) * 100;
const totalLateMinutes = SHIFT_WEEK.reduce((s, d) => s + d.lateMinutes, 0);
const avgBreakMinutes = Math.round(
  SHIFT_WEEK.reduce((s, d) => s + d.breakMinutes, 0) / SHIFT_WEEK.length,
);

/* ------------------------------------------------------------------ */
/* 4.1 GÜNLÜK ÇALIŞMA EKRANI                                            */
/* ------------------------------------------------------------------ */

const reachRateToday =
  callsToday.length > 0 ? (answeredToday.length / callsToday.length) * 100 : 0;

export const DAILY_KPIS: Kpi[] = [
  { id: "leads", label: "Bugünkü Yeni Lead", format: "number", value: leadsToday.length, accent: "brand", icon: "user-plus", hint: "Bugün sana atanan lead" },
  { id: "never-called", label: "Henüz Aranmayan", format: "number", value: neverCalled.length, accent: "brand-secondary", status: neverCalled.length > 0 ? "critical" : "success", icon: "phone-missed", hint: "hiç arama yapılmadı — önce bunlar" },
  { id: "sla", label: "15 dk SLA İhlali", format: "number", value: slaViolationsToday.length, accent: "brand-secondary", status: slaViolationsToday.length > 0 ? "risk" : "success", icon: "timer", hint: "ilk arama 15 dk'yı aştı" },
  { id: "calls", label: "Bugünkü Arama", format: "number", value: callsToday.length, accent: "indigo", icon: "phone-call", hint: "yaptığın toplam çağrı" },
  { id: "answered", label: "Cevaplanan", format: "ratio", value: answeredToday.length, denominator: callsToday.length, accent: "indigo", icon: "phone-incoming", hint: `%${reachRateToday.toFixed(0)} ulaşım — açılan telefonlar` },
  { id: "contacts", label: "Bugünkü Contact", format: "number", value: contactsToday.length, accent: "violet", icon: "user-check", hint: "görüşmeye dönüşen lead" },
  { id: "offers", label: "Bugünkü Offer", format: "number", value: offersToday.length, accent: "violet", icon: "file-text", hint: "oluşturulan teklif" },
  { id: "deals", label: "Bugünkü Deal", format: "number", value: dealsToday.length, accent: "brand", icon: "handshake", hint: "kapanan satış" },
  { id: "payments", label: "Bugünkü Ödeme", format: "number", value: paymentsToday.length, accent: "brand", icon: "banknote", hint: "ödemesi alınan deal" },
  { id: "quality", label: "Kalite Puanı", format: "number", value: currentQuality, accent: "violet", icon: "star", hint: "son değerlendirme (0-100)" },
  { id: "shift", label: "Shift Uyum (7g)", format: "percent", value: Math.round(shiftCompliancePct * 10) / 10, accent: "indigo", icon: "clock", hint: "vardiyaya zamanında başlama" },
];

/** Saatlik arama (bugün 09-18): toplam vs cevaplanan — v2 4.1. */
export const HOURLY_TODAY: HourlyCallPoint[] = Array.from({ length: 10 }, (_, i) => {
  const hour = 9 + i;
  const inHour = callsToday.filter((c) => hourOf(c.time) === hour);
  return {
    hour: String(hour).padStart(2, "0"),
    total: inHour.length,
    answered: inHour.filter((c) => c.answered).length,
  };
});

/** Günlük mini funnel: Lead → Contact → Offer → Deal → Ödeme (bugün). */
export const MINI_FUNNEL = [
  { key: "lead", label: "Lead", count: leadsToday.length },
  { key: "contact", label: "Contact", count: contactsToday.length },
  { key: "offer", label: "Offer", count: offersToday.length },
  { key: "deal", label: "Deal", count: dealsToday.length },
  { key: "paid", label: "Ödeme", count: paymentsToday.length },
];

/** Aksiyon Merkezi — istatistiklerden türetilir. */
export const ACTION_CENTER: ActionItem[] = (() => {
  const items: ActionItem[] = [];
  if (neverCalled.length > 0)
    items.push({ id: "uncalled", label: `${neverCalled.length} lead henüz aranmadı`, status: "critical", href: "/agent/follow-up" });
  if (slaViolationsToday.length > 0)
    items.push({ id: "sla", label: `${slaViolationsToday.length} lead'de 15 dk SLA ihlali var`, status: "risk", href: "/agent/follow-up" });
  const unsharedOffers = LEADS.filter((l) => l.offerStatus === "Offer Created").length;
  if (unsharedOffers > 0)
    items.push({ id: "offers", label: `${unsharedOffers} offer paylaşılmayı bekliyor`, status: "warning", href: "/agent/follow-up" });
  const unpaidWon = LEADS.filter((l) => l.dealStatus === "Won" && !l.paymentReceived).length;
  if (unpaidWon > 0)
    items.push({ id: "payments", label: `${unpaidWon} deal için ödeme henüz alınmadı`, status: "risk", href: "/agent/performans" });
  const callbacksToday = LEADS.filter(
    (l) => l.callbackDate !== null && startOfDay(l.callbackDate) === TODAY_START,
  ).length;
  if (callbacksToday > 0)
    items.push({ id: "callbacks", label: `${callbacksToday} callback bugün için planlandı`, status: "warning", href: "/agent/aramalar" });
  return items;
})();

/* ------------------------------------------------------------------ */
/* 4.2 ARAMA VE ULAŞIM (son 30 gün)                                     */
/* ------------------------------------------------------------------ */

const answeredAll = ALL_CALLS.filter((c) => c.answered);
const calledLeads = LEADS.filter((l) => l.attemptCount > 0);
const reachedLeads = LEADS.filter((l) => l.reached);
const answerRatePct = ALL_CALLS.length > 0 ? (answeredAll.length / ALL_CALLS.length) * 100 : 0;
const personReachPct = calledLeads.length > 0 ? (reachedLeads.length / calledLeads.length) * 100 : 0;

/** Hero bandı öne-çıkan istatistikleri (dashboard tepesi). */
export const HERO_STATS = {
  answerRatePct: Math.round(answerRatePct * 10) / 10,
  personReachPct: Math.round(personReachPct * 10) / 10,
  callsToday: callsToday.length,
  dealsMonth: LEADS.filter(
    (l) => l.dealStatus !== null && l.dealAt !== null && l.dealAt >= MONTH_START,
  ).length,
};

export const CALL_KPIS_30D: Kpi[] = [
  { id: "total", label: "Toplam Arama (30g)", format: "number", value: ALL_CALLS.length, accent: "indigo", icon: "phone-call", hint: "tüm çağrı denemeleri" },
  { id: "answered", label: "Cevaplanan Arama", format: "number", value: answeredAll.length, accent: "indigo", icon: "phone-incoming", hint: "karşı tarafın açtığı" },
  { id: "answer-rate", label: "Arama Cevaplanma Oranı", format: "percent", value: Math.round(answerRatePct * 10) / 10, accent: "indigo", icon: "percent", hint: "cevaplanan ÷ toplam arama" },
  { id: "person-reach", label: "Kişi Ulaşım Oranı", format: "percent", value: Math.round(personReachPct * 10) / 10, accent: "brand", icon: "users", hint: "ulaşılan kişi ÷ aranan kişi — farklı bir oran" },
  { id: "calls-per-lead", label: "Arama / Lead", format: "number", value: Math.round((ALL_CALLS.length / Math.max(calledLeads.length, 1)) * 10) / 10, accent: "violet", icon: "activity", hint: "lead başına ortalama deneme" },
];

/** Son 14 gün arama trendi — toplam vs cevaplanan. */
export const DAILY_TREND_14D: DailyTrendPoint[] = Array.from({ length: 14 }, (_, i) => {
  const dayStart = TODAY_START - (13 - i) * DAY;
  const inDay = ALL_CALLS.filter((c) => c.time >= dayStart && c.time < dayStart + DAY);
  return {
    day: shortDate(dayStart),
    total: inDay.length,
    answered: inDay.filter((c) => c.answered).length,
  };
});

/** Bugün saatlik ulaşım oranı (%) — çağrı yoksa null (boşluk). */
export const HOURLY_REACH_TODAY: HourlyRatePoint[] = HOURLY_TODAY.map((h) => ({
  hour: h.hour,
  ratePct: h.total > 0 ? Math.round((h.answered / h.total) * 1000) / 10 : null,
}));

/** Speed-to-Lead dağılımı — 7 kova (v2 4.2). */
export const SPEED_TO_LEAD: SpeedToLeadBucket[] = SPEED_BUCKETS.map((bucket) => ({
  key: bucket.key,
  label: bucket.label,
  count: LEADS.filter((l) => speedToLeadGroup(l) === bucket.key).length,
  status: bucket.status,
}));

/** Callback listesi — callback tarihi olan lead'lerden. */
export const CALLBACKS: CallbackItem[] = LEADS.filter((l) => l.callbackDate !== null)
  .sort((a, b) => (a.callbackDate ?? 0) - (b.callbackDate ?? 0))
  .slice(0, 6)
  .map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    scheduledAtISO: toLocalISO(l.callbackDate ?? 0),
  }));

/** SLA uyumu + cevaplanma oranı gauge'ları. */
const slaCompliant = calledLeads.filter(
  (l) => l.calls[0].time - l.createdAt <= SLA_MS,
).length;
const slaPct = calledLeads.length > 0 ? (slaCompliant / calledLeads.length) * 100 : 0;

export const CALL_GAUGES: GaugeMetric[] = [
  { key: "sla", label: "SLA Uyumlu Rate", valuePct: Math.round(slaPct * 10) / 10, targetPct: 85 },
  { key: "answer", label: "Cevaplanma Oranı", valuePct: Math.round(answerRatePct * 10) / 10, targetPct: 50 },
];

/* ------------------------------------------------------------------ */
/* 4.3 FUNNEL VE SATIŞ                                                  */
/* ------------------------------------------------------------------ */

const OFFER_RANK: Record<string, number> = {
  "Offer Created": 1,
  "Offer Shared": 2,
  "Offer Accepted": 3,
  "Willing to Close": 4,
};

function offerAtLeast(lead: Lead, rank: number): boolean {
  return lead.offerStatus !== null && OFFER_RANK[lead.offerStatus] >= rank;
}

export const FULL_FUNNEL: FunnelStageFull[] = (() => {
  const counts: Array<[string, string, number]> = [
    ["lead", "Lead", LEADS.length],
    ["first-call", "İlk Arama Yapılan", calledLeads.length],
    ["reached", "Ulaşılan", reachedLeads.length],
    ["contact", "Contact", LEADS.filter((l) => l.isConverted).length],
    ["offer-created", "Offer Created", LEADS.filter((l) => offerAtLeast(l, 1)).length],
    ["offer-shared", "Offer Shared", LEADS.filter((l) => offerAtLeast(l, 2)).length],
    ["offer-accepted", "Offer Accepted", LEADS.filter((l) => offerAtLeast(l, 3)).length],
    ["willing", "Willing to Close", LEADS.filter((l) => offerAtLeast(l, 4)).length],
    ["deal", "Deal", LEADS.filter((l) => l.dealStatus !== null).length],
    ["paid", "Ödeme Alınan Deal", LEADS.filter((l) => l.paymentReceived).length],
  ];
  return counts.map(([key, label, count], i) => ({
    key,
    label,
    count,
    prevPct: i === 0 ? null : counts[i - 1][2] > 0 ? (count / counts[i - 1][2]) * 100 : 0,
    leadPct: LEADS.length > 0 ? (count / LEADS.length) * 100 : 0,
  }));
})();

/** Grup bazlı dönüşüm tablosu üretici (source/country/language). */
function conversionBy(selector: (lead: Lead) => string): ConversionRow[] {
  const groups = new Map<string, { leads: number; deals: number }>();
  for (const lead of LEADS) {
    const key = selector(lead);
    const entry = groups.get(key) ?? { leads: 0, deals: 0 };
    entry.leads += 1;
    if (lead.dealStatus === "Won") entry.deals += 1;
    groups.set(key, entry);
  }
  return [...groups.entries()]
    .map(([group, { leads, deals }]) => ({
      group,
      leads,
      deals,
      ratePct: leads > 0 ? Math.round((deals / leads) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 6);
}

export const SOURCE_CONVERSION = conversionBy((l) => l.source);
export const COUNTRY_CONVERSION = conversionBy((l) => l.country);
export const LANGUAGE_CONVERSION = conversionBy((l) => l.language);

/* ------------------------------------------------------------------ */
/* İÇGÖRÜLER — veriden türetilen açıklayıcı notlar (v2: agent anlasın)  */
/* ------------------------------------------------------------------ */

export interface Insight {
  id: string;
  tone: StatusLevel;
  icon: string;
  text: string;
}

export const INSIGHTS: Insight[] = (() => {
  const list: Insight[] = [];

  // 1) En verimli arama saati (yeterli hacimli saatler arasında en yüksek ulaşım)
  const hourStats = new Map<number, { total: number; answered: number }>();
  for (const call of ALL_CALLS) {
    const h = hourOf(call.time);
    const s = hourStats.get(h) ?? { total: 0, answered: 0 };
    s.total += 1;
    if (call.answered) s.answered += 1;
    hourStats.set(h, s);
  }
  let bestHour = -1;
  let bestRate = -1;
  for (const [h, s] of hourStats) {
    if (s.total < 8) continue;
    const rate = s.answered / s.total;
    if (rate > bestRate) {
      bestRate = rate;
      bestHour = h;
    }
  }
  if (bestHour >= 0) {
    list.push({
      id: "best-hour",
      tone: "success",
      icon: "clock",
      text: `En yüksek ulaşım oranın saat ${String(bestHour).padStart(2, "0")}:00 civarında (%${Math.round(bestRate * 100)}). Yoğun aramalarını bu saate topla.`,
    });
  }

  // 2) SLA uyumu takım ortalamasına göre (referans takım ort. %76,6)
  const teamSla = 76.6;
  const diff = Math.round((slaPct - teamSla) * 10) / 10;
  list.push({
    id: "sla-compare",
    tone: diff >= 0 ? "success" : "risk",
    icon: "timer",
    text:
      diff >= 0
        ? `15 dk SLA uyumun takım ortalamasının ${diff} puan üstünde — hızlı ilk aramada iyisin.`
        : `15 dk SLA uyumun takım ortalamasının ${Math.abs(diff)} puan altında — yeni lead'lere daha hızlı dön.`,
  });

  // 3) Funnel'da en büyük kayıp aşaması
  let worstStage: { label: string; pct: number } | null = null;
  for (const stage of FULL_FUNNEL) {
    if (stage.prevPct === null) continue;
    if (worstStage === null || stage.prevPct < worstStage.pct) {
      worstStage = { label: stage.label, pct: stage.prevPct };
    }
  }
  if (worstStage) {
    list.push({
      id: "funnel-drop",
      tone: "warning",
      icon: "filter",
      text: `Funnel'da en çok kayıp "${worstStage.label}" aşamasında (%${Math.round(worstStage.pct)} geçiş). Buraya odaklan.`,
    });
  }

  return list;
})();

/* ------------------------------------------------------------------ */
/* 4.7 HEDEF VE PRİM                                                    */
/* ------------------------------------------------------------------ */

export const MONTHLY_TARGET_EUR = 60_000;

const monthPayments = LEADS.filter(
  (l) => l.paymentAt !== null && l.paymentAt >= MONTH_START,
);
const monthlySalesEUR = monthPayments.reduce((s, l) => s + (l.dealAmount ?? 0), 0);
const wonDealsMonth = LEADS.filter(
  (l) => l.dealStatus === "Won" && l.dealAt !== null && l.dealAt >= MONTH_START,
).length;
/** Tahmini ay sonu = gerçekleşen + günlük ortalama × kalan gün (v2 5.6). */
const forecastEUR = Math.round(
  monthlySalesEUR + (monthlySalesEUR / DAY_OF_MONTH) * (DAYS_IN_MONTH - DAY_OF_MONTH),
);

export const GOAL = {
  targetEUR: MONTHLY_TARGET_EUR,
  actualEUR: monthlySalesEUR,
  forecastEUR,
  pct: (monthlySalesEUR / MONTHLY_TARGET_EUR) * 100,
  wonDeals: wonDealsMonth,
};

export const TARGET_KPIS: Kpi[] = [
  { id: "target", label: "Aylık Hedef", format: "currency", value: MONTHLY_TARGET_EUR, accent: "brand-secondary", icon: "target", hint: "Temmuz hedefi" },
  { id: "actual", label: "Gerçekleşen Satış", format: "currency", value: monthlySalesEUR, accent: "brand", icon: "banknote", hint: "ödemesi alınan deal'ler" },
  { id: "rate", label: "Hedef Gerçekleşme", format: "percent", value: Math.round(GOAL.pct * 10) / 10, accent: "brand", icon: "percent", hint: "gerçekleşen ÷ hedef" },
  { id: "won", label: "Won Deal Adedi", format: "number", value: wonDealsMonth, accent: "violet", icon: "handshake", hint: "bu ay kapanan satış" },
  { id: "forecast", label: "Tahmini Ay Sonu", format: "currency", value: forecastEUR, accent: "brand-secondary", icon: "trending-up", hint: "mevcut tempoyla projeksiyon" },
];

/** Gün bazlı birikimli satış (bar) + doğrusal hedef temposu (çizgi). */
export const TARGET_PACE: PacePoint[] = (() => {
  const points: PacePoint[] = [];
  let cumulative = 0;
  for (let day = 1; day <= DAYS_IN_MONTH; day++) {
    const dayStart = MONTH_START + (day - 1) * DAY;
    if (day <= DAY_OF_MONTH) {
      cumulative += monthPayments
        .filter((l) => (l.paymentAt ?? 0) >= dayStart && (l.paymentAt ?? 0) < dayStart + DAY)
        .reduce((s, l) => s + (l.dealAmount ?? 0), 0);
    }
    points.push({
      day: String(day),
      actualEUR: day <= DAY_OF_MONTH ? cumulative : null,
      targetEUR: Math.round((MONTHLY_TARGET_EUR / DAYS_IN_MONTH) * day),
    });
  }
  return points;
})();

/* Kalite ve Vardiya KPI'ları */
export const QUALITY_KPIS: Kpi[] = [
  { id: "current", label: "Güncel Kalite Puanı", format: "number", value: currentQuality, accent: "violet", icon: "star", hint: "son değerlendirme" },
  { id: "avg30", label: "Son 30 Gün Ortalama", format: "number", value: avgQuality30, accent: "violet", icon: "activity", hint: "günlük puanların ortalaması" },
  { id: "evaluated", label: "Değerlendirilen Çağrı", format: "number", value: 46, accent: "indigo", icon: "phone-call", hint: "kalite ekibinin dinlediği" },
  { id: "critical-errors", label: "Kritik Hata", format: "number", value: 1, accent: "brand-secondary", status: "risk", icon: "alert", hint: "sıfır olmalı" },
];

export const SHIFT_KPIS: Kpi[] = [
  { id: "compliance", label: "Shift Uyum Oranı (7g)", format: "percent", value: Math.round(shiftCompliancePct * 10) / 10, accent: "indigo", icon: "clock", hint: "≤5 dk gecikme = uyumlu" },
  { id: "late", label: "Toplam Geç Kalma", format: "number", value: totalLateMinutes, accent: "brand-secondary", status: totalLateMinutes > 20 ? "risk" : "success", icon: "timer", hint: "dakika (7 gün)" },
  { id: "break", label: "Ortalama Mola", format: "number", value: avgBreakMinutes, accent: "violet", icon: "coffee", hint: "dk/gün" },
  { id: "planned", label: "Planlanan Vardiya", format: "number", value: SHIFT_WEEK.length, accent: "brand", icon: "calendar", hint: "son 7 gün" },
];

/* ------------------------------------------------------------------ */
/* 4.4 FOLLOW-UP LİSTESİ                                                */
/* ------------------------------------------------------------------ */

export const FOLLOW_UP_ROWS: FollowUpRow[] = LEADS.filter(
  (l) => !(l.dealStatus === "Won" && l.paymentReceived),
)
  .map((l) => ({
    id: l.id,
    priority: leadPriority(l),
    name: l.name,
    phone: l.phone,
    country: l.country,
    language: l.language,
    source: l.source,
    createdAtISO: toLocalISO(l.createdAt),
    lastCallISO: l.calls.length > 0 ? toLocalISO(l.calls[l.calls.length - 1].time) : null,
    attempts: l.attemptCount,
    resultCode: l.calls.length > 0 ? l.calls[l.calls.length - 1].resultCode : "—",
    status: l.status,
    dueISO: l.dueDate !== null ? toLocalISO(l.dueDate) : null,
    callbackISO: l.callbackDate !== null ? toLocalISO(l.callbackDate) : null,
    offer: l.offerStatus ?? "—",
    deal: l.dealStatus ?? "—",
    nextAction: nextAction(l),
  }))
  .sort(
    (a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      a.id.localeCompare(b.id),
  );

/** Sayfalarda gösterilen sabit mock tarih etiketi. */
export const MOCK_DATE_LABEL = "16 Temmuz 2026, Perşembe";
