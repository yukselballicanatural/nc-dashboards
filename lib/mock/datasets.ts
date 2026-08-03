/**
 * Türetilmiş veri setleri — CLAUDE.md v2 Bölüm 5.4-5.6.
 * Tüm sayfalar Lead listesi üzerinden hesaplanır; hiçbir istatistik elle
 * yazılmaz. Sabit seed + MOCK_NOW sayesinde SSR/CSR/yenileme tutarlıdır.
 *
 * i18n notu: ham sayısal/istatistiksel türetim modül yüklenirken BİR KEZ
 * hesaplanır (dilden bağımsız); yalnızca kullanıcıya gösterilen etiketler
 * (Kpi.label/hint, insight metinleri, tarih etiketleri) aktif dile göre
 * üretilir. Bu yüzden görünür metin taşıyan setler CONST değil, `lang`
 * parametreli FONKSİYON olarak dışa aktarılır — bkz. `pick()` kullanımı.
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
import { pick, type Lang } from "@/lib/i18n/core";
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
const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;
const WEEKDAYS_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"] as const;
const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

function shortDate(ts: number, lang: Lang = "tr"): string {
  const iso = toLocalISO(ts);
  const months = lang === "en" ? MONTHS_EN : MONTHS_TR;
  return `${Number(iso.slice(8, 10))} ${months[Number(iso.slice(5, 7)) - 1]}`;
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
const QUALITY_TREND_RAW: Array<{ ts: number; agent: number; team: number }> = (() => {
  const rng = new Rng(987_654);
  const points: Array<{ ts: number; agent: number; team: number }> = [];
  let agent = 84;
  let team = 80;
  for (let i = 29; i >= 0; i--) {
    agent = Math.min(98, Math.max(65, agent + rng.range(-3.5, 3.8)));
    team = Math.min(98, Math.max(65, team + rng.range(-2.5, 2.7)));
    points.push({
      ts: MOCK_NOW - i * DAY,
      agent: Math.round(agent * 10) / 10,
      team: Math.round(team * 10) / 10,
    });
  }
  return points;
})();

/** Kalite trendi (son 30 gün, agent vs takım ortalaması). */
export function qualityTrend(lang: Lang = "tr"): QualityPoint[] {
  return QUALITY_TREND_RAW.map((p) => ({ day: shortDate(p.ts, lang), agent: p.agent, team: p.team }));
}

const currentQuality = QUALITY_TREND_RAW[QUALITY_TREND_RAW.length - 1].agent;
const avgQuality30 =
  Math.round(
    (QUALITY_TREND_RAW.reduce((s, p) => s + p.agent, 0) / QUALITY_TREND_RAW.length) * 10,
  ) / 10;

/** Vardiya haftası — v2 5.4: %25 olasılıkla 1-22 dk geç, 35-65 dk mola. */
const SHIFT_WEEK_RAW: Array<Omit<ShiftDay, "date"> & { ts: number }> = (() => {
  const rng = new Rng(555_111);
  const days: Array<Omit<ShiftDay, "date"> & { ts: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const dayTs = TODAY_START - i * DAY;
    const late = rng.chance(0.25) ? rng.int(1, 22) : 0;
    const breakMin = rng.int(35, 65);
    const outExtra = rng.int(-10, 25); // çıkışta küçük sapma
    const inTs = dayTs + 9 * HOUR + late * MINUTE;
    const outTs = dayTs + 18 * HOUR + outExtra * MINUTE;
    days.push({
      ts: dayTs,
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

/** Son 7 gün vardiya tablosu. */
export function shiftWeek(lang: Lang = "tr"): ShiftDay[] {
  return SHIFT_WEEK_RAW.map(({ ts, ...rest }) => ({ date: shortDate(ts, lang), ...rest }));
}

const shiftCompliancePct =
  (SHIFT_WEEK_RAW.filter((d) => d.lateMinutes <= 5).length / SHIFT_WEEK_RAW.length) * 100;
const totalLateMinutes = SHIFT_WEEK_RAW.reduce((s, d) => s + d.lateMinutes, 0);
const avgBreakMinutes = Math.round(
  SHIFT_WEEK_RAW.reduce((s, d) => s + d.breakMinutes, 0) / SHIFT_WEEK_RAW.length,
);

/* ------------------------------------------------------------------ */
/* 4.1 GÜNLÜK ÇALIŞMA EKRANI                                            */
/* ------------------------------------------------------------------ */

const reachRateToday =
  callsToday.length > 0 ? (answeredToday.length / callsToday.length) * 100 : 0;

export function dailyKpis(lang: Lang = "tr"): Kpi[] {
  return [
    { id: "leads", label: pick(lang, "Bugünkü Yeni Lead", "Today's New Leads"), format: "number", value: leadsToday.length, accent: "brand", icon: "user-plus", hint: pick(lang, "Bugün sana atanan lead", "Leads assigned to you today") },
    { id: "never-called", label: pick(lang, "Henüz Aranmayan", "Not Yet Called"), format: "number", value: neverCalled.length, accent: "brand-secondary", status: neverCalled.length > 0 ? "critical" : "success", icon: "phone-missed", hint: pick(lang, "hiç arama yapılmadı — önce bunlar", "never called — handle these first") },
    { id: "sla", label: pick(lang, "15 dk SLA İhlali", "15-min SLA Breach"), format: "number", value: slaViolationsToday.length, accent: "brand-secondary", status: slaViolationsToday.length > 0 ? "risk" : "success", icon: "timer", hint: pick(lang, "ilk arama 15 dk'yı aştı", "first call exceeded 15 min") },
    { id: "calls", label: pick(lang, "Bugünkü Arama", "Today's Calls"), format: "number", value: callsToday.length, accent: "indigo", icon: "phone-call", hint: pick(lang, "yaptığın toplam çağrı", "total calls you made") },
    { id: "answered", label: pick(lang, "Cevaplanan", "Answered"), format: "ratio", value: answeredToday.length, denominator: callsToday.length, accent: "indigo", icon: "phone-incoming", hint: pick(lang, `%${reachRateToday.toFixed(0)} ulaşım — açılan telefonlar`, `${reachRateToday.toFixed(0)}% reach — calls picked up`) },
    { id: "contacts", label: pick(lang, "Bugünkü Contact", "Today's Contacts"), format: "number", value: contactsToday.length, accent: "violet", icon: "user-check", hint: pick(lang, "görüşmeye dönüşen lead", "leads turned into conversations") },
    { id: "offers", label: pick(lang, "Bugünkü Offer", "Today's Offers"), format: "number", value: offersToday.length, accent: "violet", icon: "file-text", hint: pick(lang, "oluşturulan teklif", "offers created") },
    { id: "deals", label: pick(lang, "Bugünkü Deal", "Today's Deals"), format: "number", value: dealsToday.length, accent: "brand", icon: "handshake", hint: pick(lang, "kapanan satış", "deals closed") },
    { id: "payments", label: pick(lang, "Bugünkü Ödeme", "Today's Payments"), format: "number", value: paymentsToday.length, accent: "brand", icon: "banknote", hint: pick(lang, "ödemesi alınan deal", "deals with payment received") },
    { id: "quality", label: pick(lang, "Kalite Puanı", "Quality Score"), format: "number", value: currentQuality, accent: "violet", icon: "star", hint: pick(lang, "son değerlendirme (0-100)", "latest evaluation (0-100)") },
    { id: "shift", label: pick(lang, "Shift Uyum (7g)", "Shift Compliance (7d)"), format: "percent", value: Math.round(shiftCompliancePct * 10) / 10, accent: "indigo", icon: "clock", hint: pick(lang, "vardiyaya zamanında başlama", "starting shifts on time") },
  ];
}

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
export function miniFunnel(lang: Lang = "tr") {
  return [
    { key: "lead", label: "Lead", count: leadsToday.length },
    { key: "contact", label: "Contact", count: contactsToday.length },
    { key: "offer", label: "Offer", count: offersToday.length },
    { key: "deal", label: "Deal", count: dealsToday.length },
    { key: "paid", label: pick(lang, "Ödeme", "Payment"), count: paymentsToday.length },
  ];
}

/** Aksiyon Merkezi — istatistiklerden türetilir. */
export function actionCenterItems(lang: Lang = "tr"): ActionItem[] {
  const items: ActionItem[] = [];
  if (neverCalled.length > 0)
    items.push({ id: "uncalled", label: pick(lang, `${neverCalled.length} lead henüz aranmadı`, `${neverCalled.length} leads not yet called`), status: "critical", href: "/agent/follow-up" });
  if (slaViolationsToday.length > 0)
    items.push({ id: "sla", label: pick(lang, `${slaViolationsToday.length} lead'de 15 dk SLA ihlali var`, `${slaViolationsToday.length} leads have a 15-min SLA breach`), status: "risk", href: "/agent/follow-up" });
  const unsharedOffers = LEADS.filter((l) => l.offerStatus === "Offer Created").length;
  if (unsharedOffers > 0)
    items.push({ id: "offers", label: pick(lang, `${unsharedOffers} offer paylaşılmayı bekliyor`, `${unsharedOffers} offers awaiting sharing`), status: "warning", href: "/agent/follow-up" });
  const unpaidWon = LEADS.filter((l) => l.dealStatus === "Won" && !l.paymentReceived).length;
  if (unpaidWon > 0)
    items.push({ id: "payments", label: pick(lang, `${unpaidWon} deal için ödeme henüz alınmadı`, `${unpaidWon} deals have not received payment yet`), status: "risk", href: "/agent/performans" });
  const callbacksToday = LEADS.filter(
    (l) => l.callbackDate !== null && startOfDay(l.callbackDate) === TODAY_START,
  ).length;
  if (callbacksToday > 0)
    items.push({ id: "callbacks", label: pick(lang, `${callbacksToday} callback bugün için planlandı`, `${callbacksToday} callbacks scheduled for today`), status: "warning", href: "/agent/aramalar" });
  return items;
}

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

export function callKpis30d(lang: Lang = "tr"): Kpi[] {
  return [
    { id: "total", label: pick(lang, "Toplam Arama (30g)", "Total Calls (30d)"), format: "number", value: ALL_CALLS.length, accent: "indigo", icon: "phone-call", hint: pick(lang, "tüm çağrı denemeleri", "all call attempts") },
    { id: "answered", label: pick(lang, "Cevaplanan Arama", "Answered Calls"), format: "number", value: answeredAll.length, accent: "indigo", icon: "phone-incoming", hint: pick(lang, "karşı tarafın açtığı", "picked up by the other side") },
    { id: "answer-rate", label: pick(lang, "Arama Cevaplanma Oranı", "Call Answer Rate"), format: "percent", value: Math.round(answerRatePct * 10) / 10, accent: "indigo", icon: "percent", hint: pick(lang, "cevaplanan ÷ toplam arama", "answered ÷ total calls") },
    { id: "person-reach", label: pick(lang, "Kişi Ulaşım Oranı", "Person Reach Rate"), format: "percent", value: Math.round(personReachPct * 10) / 10, accent: "brand", icon: "users", hint: pick(lang, "ulaşılan kişi ÷ aranan kişi — farklı bir oran", "people reached ÷ people called — a different ratio") },
    { id: "calls-per-lead", label: pick(lang, "Arama / Lead", "Calls / Lead"), format: "number", value: Math.round((ALL_CALLS.length / Math.max(calledLeads.length, 1)) * 10) / 10, accent: "violet", icon: "activity", hint: pick(lang, "lead başına ortalama deneme", "average attempts per lead") },
  ];
}

const DAILY_TREND_14D_RAW: Array<{ ts: number; total: number; answered: number }> = Array.from(
  { length: 14 },
  (_, i) => {
    const dayStart = TODAY_START - (13 - i) * DAY;
    const inDay = ALL_CALLS.filter((c) => c.time >= dayStart && c.time < dayStart + DAY);
    return { ts: dayStart, total: inDay.length, answered: inDay.filter((c) => c.answered).length };
  },
);

/** Son 14 gün arama trendi — toplam vs cevaplanan. */
export function dailyTrend14d(lang: Lang = "tr"): DailyTrendPoint[] {
  return DAILY_TREND_14D_RAW.map((p) => ({ day: shortDate(p.ts, lang), total: p.total, answered: p.answered }));
}

/** Bugün saatlik ulaşım oranı (%) — çağrı yoksa null (boşluk). */
export const HOURLY_REACH_TODAY: HourlyRatePoint[] = HOURLY_TODAY.map((h) => ({
  hour: h.hour,
  ratePct: h.total > 0 ? Math.round((h.answered / h.total) * 1000) / 10 : null,
}));

/** Speed-to-Lead dağılımı — 7 kova (v2 4.2). */
export function speedToLead(lang: Lang = "tr"): SpeedToLeadBucket[] {
  return SPEED_BUCKETS.map((bucket) => ({
    key: bucket.key,
    label: pick(lang, bucket.label, bucket.labelEn),
    count: LEADS.filter((l) => speedToLeadGroup(l) === bucket.key).length,
    status: bucket.status,
  }));
}

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

export function callGauges(lang: Lang = "tr"): GaugeMetric[] {
  return [
    { key: "sla", label: pick(lang, "SLA Uyumlu Rate", "SLA Compliance Rate"), valuePct: Math.round(slaPct * 10) / 10, targetPct: 85 },
    { key: "answer", label: pick(lang, "Cevaplanma Oranı", "Answer Rate"), valuePct: Math.round(answerRatePct * 10) / 10, targetPct: 50 },
  ];
}

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

export function fullFunnel(lang: Lang = "tr"): FunnelStageFull[] {
  const counts: Array<[string, string, number]> = [
    ["lead", "Lead", LEADS.length],
    ["first-call", pick(lang, "İlk Arama Yapılan", "First Call Made"), calledLeads.length],
    ["reached", pick(lang, "Ulaşılan", "Reached"), reachedLeads.length],
    ["contact", "Contact", LEADS.filter((l) => l.isConverted).length],
    ["offer-created", "Offer Created", LEADS.filter((l) => offerAtLeast(l, 1)).length],
    ["offer-shared", "Offer Shared", LEADS.filter((l) => offerAtLeast(l, 2)).length],
    ["offer-accepted", "Offer Accepted", LEADS.filter((l) => offerAtLeast(l, 3)).length],
    ["willing", "Willing to Close", LEADS.filter((l) => offerAtLeast(l, 4)).length],
    ["deal", "Deal", LEADS.filter((l) => l.dealStatus !== null).length],
    ["paid", pick(lang, "Ödeme Alınan Deal", "Deals with Payment Received"), LEADS.filter((l) => l.paymentReceived).length],
  ];
  return counts.map(([key, label, count], i) => ({
    key,
    label,
    count,
    prevPct: i === 0 ? null : counts[i - 1][2] > 0 ? (count / counts[i - 1][2]) * 100 : 0,
    leadPct: LEADS.length > 0 ? (count / LEADS.length) * 100 : 0,
  }));
}

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

export function insightsList(lang: Lang = "tr"): Insight[] {
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
      text: pick(
        lang,
        `En yüksek ulaşım oranın saat ${String(bestHour).padStart(2, "0")}:00 civarında (%${Math.round(bestRate * 100)}). Yoğun aramalarını bu saate topla.`,
        `Your highest reach rate is around ${String(bestHour).padStart(2, "0")}:00 (${Math.round(bestRate * 100)}%). Focus your busiest calling on this hour.`,
      ),
    });
  }

  // 2) SLA uyumu takım ortalamasına göre (referans takım ort. %76,6)
  const teamSla = 76.6;
  const diff = Math.round((slaPct - teamSla) * 10) / 10;
  list.push({
    id: "sla-compare",
    tone: diff >= 0 ? "success" : "risk",
    icon: "timer",
    text: pick(
      lang,
      diff >= 0
        ? `15 dk SLA uyumun takım ortalamasının ${diff} puan üstünde — hızlı ilk aramada iyisin.`
        : `15 dk SLA uyumun takım ortalamasının ${Math.abs(diff)} puan altında — yeni lead'lere daha hızlı dön.`,
      diff >= 0
        ? `Your 15-min SLA compliance is ${diff} points above the team average — you're fast on first calls.`
        : `Your 15-min SLA compliance is ${Math.abs(diff)} points below the team average — respond to new leads faster.`,
    ),
  });

  // 3) Funnel'da en büyük kayıp aşaması
  const funnel = fullFunnel(lang);
  let worstStage: { label: string; pct: number } | null = null;
  for (const stage of funnel) {
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
      text: pick(
        lang,
        `Funnel'da en çok kayıp "${worstStage.label}" aşamasında (%${Math.round(worstStage.pct)} geçiş). Buraya odaklan.`,
        `The biggest drop-off in your funnel is at the "${worstStage.label}" stage (${Math.round(worstStage.pct)}% pass-through). Focus here.`,
      ),
    });
  }

  return list;
}

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

export function targetKpis(lang: Lang = "tr"): Kpi[] {
  return [
    { id: "target", label: pick(lang, "Aylık Hedef", "Monthly Target"), format: "currency", value: MONTHLY_TARGET_EUR, accent: "brand-secondary", icon: "target", hint: pick(lang, "Temmuz hedefi", "July target") },
    { id: "actual", label: pick(lang, "Gerçekleşen Satış", "Actual Sales"), format: "currency", value: monthlySalesEUR, accent: "brand", icon: "banknote", hint: pick(lang, "ödemesi alınan deal'ler", "deals with payment received") },
    { id: "rate", label: pick(lang, "Hedef Gerçekleşme", "Target Achievement"), format: "percent", value: Math.round(GOAL.pct * 10) / 10, accent: "brand", icon: "percent", hint: pick(lang, "gerçekleşen ÷ hedef", "actual ÷ target") },
    { id: "won", label: pick(lang, "Won Deal Adedi", "Won Deals"), format: "number", value: wonDealsMonth, accent: "violet", icon: "handshake", hint: pick(lang, "bu ay kapanan satış", "deals closed this month") },
    { id: "forecast", label: pick(lang, "Tahmini Ay Sonu", "Projected Month-End"), format: "currency", value: forecastEUR, accent: "brand-secondary", icon: "trending-up", hint: pick(lang, "mevcut tempoyla projeksiyon", "projection at current pace") },
  ];
}

/** Gün bazlı birikimli satış (bar) + doğrusal hedef temposu (çizgi). Dilden bağımsız (gün numarası). */
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
export function qualityKpis(lang: Lang = "tr"): Kpi[] {
  return [
    { id: "current", label: pick(lang, "Güncel Kalite Puanı", "Current Quality Score"), format: "number", value: currentQuality, accent: "violet", icon: "star", hint: pick(lang, "son değerlendirme", "latest evaluation") },
    { id: "avg30", label: pick(lang, "Son 30 Gün Ortalama", "Last 30 Days Average"), format: "number", value: avgQuality30, accent: "violet", icon: "activity", hint: pick(lang, "günlük puanların ortalaması", "average of daily scores") },
    { id: "evaluated", label: pick(lang, "Değerlendirilen Çağrı", "Calls Evaluated"), format: "number", value: 46, accent: "indigo", icon: "phone-call", hint: pick(lang, "kalite ekibinin dinlediği", "listened to by the quality team") },
    { id: "critical-errors", label: pick(lang, "Kritik Hata", "Critical Errors"), format: "number", value: 1, accent: "brand-secondary", status: "risk", icon: "alert", hint: pick(lang, "sıfır olmalı", "should be zero") },
  ];
}

export function shiftKpis(lang: Lang = "tr"): Kpi[] {
  return [
    { id: "compliance", label: pick(lang, "Shift Uyum Oranı (7g)", "Shift Compliance (7d)"), format: "percent", value: Math.round(shiftCompliancePct * 10) / 10, accent: "indigo", icon: "clock", hint: pick(lang, "≤5 dk gecikme = uyumlu", "≤5 min late = compliant") },
    { id: "late", label: pick(lang, "Toplam Geç Kalma", "Total Lateness"), format: "number", value: totalLateMinutes, accent: "brand-secondary", status: totalLateMinutes > 20 ? "risk" : "success", icon: "timer", hint: pick(lang, "dakika (7 gün)", "minutes (7 days)") },
    { id: "break", label: pick(lang, "Ortalama Mola", "Average Break"), format: "number", value: avgBreakMinutes, accent: "violet", icon: "coffee", hint: pick(lang, "dk/gün", "min/day") },
    { id: "planned", label: pick(lang, "Planlanan Vardiya", "Planned Shifts"), format: "number", value: SHIFT_WEEK_RAW.length, accent: "brand", icon: "calendar", hint: pick(lang, "son 7 gün", "last 7 days") },
  ];
}

/* ------------------------------------------------------------------ */
/* 4.4 FOLLOW-UP LİSTESİ                                                */
/* ------------------------------------------------------------------ */

export function followUpRows(lang: Lang = "tr"): FollowUpRow[] {
  return LEADS.filter((l) => !(l.dealStatus === "Won" && l.paymentReceived))
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
      nextAction: nextAction(l, lang),
    }))
    .sort(
      (a, b) =>
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        a.id.localeCompare(b.id),
    );
}

/** Sayfalarda gösterilen sabit mock tarih etiketi. */
export function mockDateLabel(lang: Lang = "tr"): string {
  const d = new Date(MOCK_NOW + TZ_OFFSET);
  const day = d.getUTCDate();
  const monthFull = lang === "en"
    ? ["January","February","March","April","May","June","July","August","September","October","November","December"][d.getUTCMonth()]
    : ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"][d.getUTCMonth()];
  const weekday = (lang === "en" ? WEEKDAYS_EN : WEEKDAYS_TR)[d.getUTCDay()];
  return `${day} ${monthFull} ${d.getUTCFullYear()}, ${weekday}`;
}
