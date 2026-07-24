/**
 * Dönem bazlı hesaplama katmanı — tarih filtresi için.
 * LEADS (seed'li, sabit) üzerinden seçilen [startMs, endMs] aralığına göre
 * aktivite/pipeline verisini YENİDEN türetir. Saf fonksiyonlar; hiçbir yan etki
 * yok, aynı aralık her zaman aynı sonucu verir.
 *
 * Not: "Bugün" snapshot'ı, aylık hedef, 30g kalite ve 7g vardiya doğaları gereği
 * sabit dönemlidir; filtre bunları değil, aktivite/funnel/dönüşüm/follow-up gibi
 * dönem-duyarlı verileri etkiler.
 */

import type {
  ActionItem,
  ConversionRow,
  DailyTrendPoint,
  FollowUpRow,
  FunnelStageFull,
  GaugeMetric,
  HourlyCallPoint,
  Kpi,
  Lead,
  SpeedToLeadBucket,
} from "@/lib/types/agent-data";
import { pick, type Lang } from "@/lib/i18n/core";
import { MONTHLY_TARGET_EUR } from "./datasets";
import { DAY, HOUR, MOCK_NOW, SLA_MS } from "./lead-engine";
import {
  PRIORITY_ORDER,
  SPEED_BUCKETS,
  leadPriority,
  nextAction,
  speedToLeadGroup,
} from "./derived";

const TZ_OFFSET = 3 * HOUR;
const MONTHS_TR = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
] as const;
const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

function toLocalISO(ts: number): string {
  return new Date(ts + TZ_OFFSET).toISOString().slice(0, 19);
}
function startOfDay(ts: number): number {
  const local = ts + TZ_OFFSET;
  return local - (local % DAY) - TZ_OFFSET;
}
function shortDate(ts: number, lang: Lang): string {
  const iso = toLocalISO(ts);
  const months = lang === "en" ? MONTHS_EN : MONTHS_TR;
  return `${Number(iso.slice(8, 10))} ${months[Number(iso.slice(5, 7)) - 1]}`;
}

const OFFER_RANK: Record<string, number> = {
  "Offer Created": 1,
  "Offer Shared": 2,
  "Offer Accepted": 3,
  "Willing to Close": 4,
};
function offerAtLeast(lead: Lead, rank: number): boolean {
  return lead.offerStatus !== null && OFFER_RANK[lead.offerStatus] >= rank;
}

export interface MiniFunnelStage {
  key: string;
  label: string;
  count: number;
}

export interface PeriodData {
  /** Üst özet KPI'ları — seçili aralığa göre (+ sabit kalite/vardiya kartları). */
  overviewKpis: Kpi[];
  /** Seçili aralıktaki cevaplanma oranı — hero şeridindeki canlı istatistik. */
  answerRatePct: number;
  /** Seçili aralıkta ödemesi alınan tutarın aylık hedefe oranı — hero şeridi. */
  targetPct: number;
  /** Seçili aralıkta ödemesi alınan tutar (€, ham). */
  paymentsEUR: number;
  miniFunnel: MiniFunnelStage[];
  actionCenter: ActionItem[];
  hourlyCalls: HourlyCallPoint[];
  callKpis: Kpi[];
  gauges: GaugeMetric[];
  speedToLead: SpeedToLeadBucket[];
  fullFunnel: FunnelStageFull[];
  sourceConversion: ConversionRow[];
  countryConversion: ConversionRow[];
  languageConversion: ConversionRow[];
  dailyTrend: DailyTrendPoint[];
  followUp: FollowUpRow[];
  /** Ham backlog sayaçları (aksiyon merkezi label'larının arkasındaki sayılar). */
  backlog: {
    neverCalled: number;
    slaViolations: number;
    pendingOffers: number;
    overdueFollowUps: number;
  };
}

function conversionBy(
  leads: Lead[],
  selector: (lead: Lead) => string,
): ConversionRow[] {
  const groups = new Map<string, { leads: number; deals: number }>();
  for (const lead of leads) {
    const key = selector(lead);
    const entry = groups.get(key) ?? { leads: 0, deals: 0 };
    entry.leads += 1;
    if (lead.dealStatus === "Won") entry.deals += 1;
    groups.set(key, entry);
  }
  return [...groups.entries()]
    .map(([group, { leads: l, deals }]) => ({
      group,
      leads: l,
      deals,
      ratePct: l > 0 ? Math.round((deals / l) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 6);
}

/**
 * @param allLeads Hangi agent/takıma ait olursa olsun, üzerinde hesap yapılacak
 * TÜM lead havuzu (aralık filtresi bu fonksiyon içinde uygulanır). Agent kendi
 * `LEADS`'ini, Team Leader katmanı her agent'ın kendi lead'lerini ayrı ayrı
 * geçirerek AYNI hesaplama mantığını tekrar kullanır — iki panel arasında
 * tanım farkı (mantık hatası) oluşmaz.
 */
export function computePeriod(
  allLeads: Lead[],
  startMs: number,
  endMs: number,
  lang: Lang = "tr",
): PeriodData {
  const inRange = (ts: number | null): ts is number =>
    ts !== null && ts >= startMs && ts <= endMs;

  // Aralıkta oluşturulan lead'ler + aralıktaki çağrılar.
  const leads = allLeads.filter((l) => l.createdAt >= startMs && l.createdAt <= endMs);
  const calls = allLeads.flatMap((l) =>
    l.calls.filter((c) => c.time >= startMs && c.time <= endMs),
  );
  const answered = calls.filter((c) => c.answered);
  const calledLeads = leads.filter((l) => l.attemptCount > 0);
  const reachedLeads = leads.filter((l) => l.reached);

  const answerRatePct = calls.length > 0 ? (answered.length / calls.length) * 100 : 0;
  const personReachPct =
    calledLeads.length > 0 ? (reachedLeads.length / calledLeads.length) * 100 : 0;
  const slaCompliant = calledLeads.filter(
    (l) => l.calls[0].time - l.createdAt <= SLA_MS,
  ).length;
  const slaPct = calledLeads.length > 0 ? (slaCompliant / calledLeads.length) * 100 : 0;

  const callKpis: Kpi[] = [
    { id: "total", label: pick(lang, "Toplam Arama", "Total Calls"), format: "number", value: calls.length, accent: "indigo", icon: "phone-call", hint: pick(lang, "tüm çağrı denemeleri", "all call attempts") },
    { id: "answered", label: pick(lang, "Cevaplanan Arama", "Answered Calls"), format: "number", value: answered.length, accent: "indigo", icon: "phone-incoming", hint: pick(lang, "karşı tarafın açtığı", "picked up by the contact") },
    { id: "answer-rate", label: pick(lang, "Arama Cevaplanma Oranı", "Call Answer Rate"), format: "percent", value: Math.round(answerRatePct * 10) / 10, accent: "indigo", icon: "percent", hint: pick(lang, "cevaplanan ÷ toplam arama", "answered ÷ total calls") },
    { id: "person-reach", label: pick(lang, "Kişi Ulaşım Oranı", "Person Reach Rate"), format: "percent", value: Math.round(personReachPct * 10) / 10, accent: "brand", icon: "users", hint: pick(lang, "ulaşılan kişi ÷ aranan kişi", "people reached ÷ people called") },
    { id: "calls-per-lead", label: pick(lang, "Arama / Lead", "Calls / Lead"), format: "number", value: Math.round((calls.length / Math.max(calledLeads.length, 1)) * 10) / 10, accent: "violet", icon: "activity", hint: pick(lang, "lead başına ortalama deneme", "average attempts per lead") },
  ];

  const gauges: GaugeMetric[] = [
    { key: "sla", label: pick(lang, "SLA Uyumlu Rate", "SLA Compliance Rate"), valuePct: Math.round(slaPct * 10) / 10, targetPct: 85 },
    { key: "answer", label: pick(lang, "Cevaplanma Oranı", "Answer Rate"), valuePct: Math.round(answerRatePct * 10) / 10, targetPct: 50 },
  ];

  const speedToLead: SpeedToLeadBucket[] = SPEED_BUCKETS.map((bucket) => ({
    key: bucket.key,
    label: pick(lang, bucket.label, bucket.labelEn),
    count: leads.filter((l) => speedToLeadGroup(l) === bucket.key).length,
    status: bucket.status,
  }));

  const funnelCounts: Array<[string, string, number]> = [
    ["lead", "Lead", leads.length],
    ["first-call", pick(lang, "İlk Arama Yapılan", "First Call Made"), calledLeads.length],
    ["reached", pick(lang, "Ulaşılan", "Reached"), reachedLeads.length],
    ["contact", "Contact", leads.filter((l) => l.isConverted).length],
    ["offer-created", "Offer Created", leads.filter((l) => offerAtLeast(l, 1)).length],
    ["offer-shared", "Offer Shared", leads.filter((l) => offerAtLeast(l, 2)).length],
    ["offer-accepted", "Offer Accepted", leads.filter((l) => offerAtLeast(l, 3)).length],
    ["willing", "Willing to Close", leads.filter((l) => offerAtLeast(l, 4)).length],
    ["deal", "Deal", leads.filter((l) => l.dealStatus !== null).length],
    ["paid", pick(lang, "Ödeme Alınan Deal", "Paid Deals"), leads.filter((l) => l.paymentReceived).length],
  ];
  const fullFunnel: FunnelStageFull[] = funnelCounts.map(([key, label, count], i) => ({
    key,
    label,
    count,
    prevPct:
      i === 0 ? null : funnelCounts[i - 1][2] > 0 ? (count / funnelCounts[i - 1][2]) * 100 : 0,
    leadPct: leads.length > 0 ? (count / leads.length) * 100 : 0,
  }));

  // Günlük trend — aralık uzunsa haftalık kovalara toplar (en çok ~31 nokta).
  const dayCount = Math.max(1, Math.round((endMs - startMs) / DAY));
  const step = dayCount > 45 ? 7 : 1;
  const dailyTrend: DailyTrendPoint[] = [];
  for (let offset = 0; offset < dayCount; offset += step) {
    const bStart = startOfDay(startMs + offset * DAY);
    const bEnd = bStart + step * DAY;
    const inB = calls.filter((c) => c.time >= bStart && c.time < bEnd);
    dailyTrend.push({
      day: shortDate(bStart, lang),
      total: inB.length,
      answered: inB.filter((c) => c.answered).length,
    });
  }

  const followUp: FollowUpRow[] = leads
    .filter((l) => !(l.dealStatus === "Won" && l.paymentReceived))
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

  /* ---------------- Özet KPI'lar — üst kısım, aralığa göre ---------------- */
  const neverCalled = leads.filter((l) => l.attemptCount === 0);
  const slaViolations = calledLeads.filter(
    (l) => l.calls[0].time - l.createdAt > SLA_MS,
  );
  const contacts = leads.filter((l) => inRange(l.contactAt));
  const offersCreated = leads.filter((l) => inRange(l.offerCreatedAt));
  const dealsClosed = leads.filter((l) => inRange(l.dealAt));
  const paymentsReceived = leads.filter((l) => inRange(l.paymentAt));
  const periodSalesEUR = paymentsReceived.reduce((s, l) => s + (l.dealAmount ?? 0), 0);
  const targetPct = (periodSalesEUR / MONTHLY_TARGET_EUR) * 100;

  const overviewKpis: Kpi[] = [
    { id: "leads", label: pick(lang, "Yeni Lead", "New Leads"), format: "number", value: leads.length, accent: "brand", icon: "user-plus", hint: pick(lang, "seçili dönemde atanan lead", "leads assigned in the selected period") },
    { id: "never-called", label: pick(lang, "Henüz Aranmayan", "Not Yet Called"), format: "number", value: neverCalled.length, accent: "brand-secondary", status: neverCalled.length > 0 ? "critical" : "success", icon: "phone-missed", hint: pick(lang, "hiç arama yapılmadı — önce bunlar", "never called — start with these") },
    { id: "sla", label: pick(lang, "15 dk SLA İhlali", "15-min SLA Breach"), format: "number", value: slaViolations.length, accent: "brand-secondary", status: slaViolations.length > 0 ? "risk" : "success", icon: "timer", hint: pick(lang, "ilk arama 15 dk'yı aştı", "first call exceeded 15 min") },
    { id: "calls", label: pick(lang, "Toplam Arama", "Total Calls"), format: "number", value: calls.length, accent: "indigo", icon: "phone-call", hint: pick(lang, "yapılan tüm çağrılar", "all calls made") },
    { id: "answered", label: pick(lang, "Cevaplanan", "Answered"), format: "ratio", value: answered.length, denominator: calls.length, accent: "indigo", icon: "phone-incoming", hint: pick(lang, `%${answerRatePct.toFixed(0)} ulaşım — açılan telefonlar`, `${answerRatePct.toFixed(0)}% reach — calls picked up`) },
    { id: "contacts", label: "Contact", format: "number", value: contacts.length, accent: "violet", icon: "user-check", hint: pick(lang, "görüşmeye dönüşen lead", "leads turned into conversations") },
    { id: "offers", label: "Offer", format: "number", value: offersCreated.length, accent: "violet", icon: "file-text", hint: pick(lang, "oluşturulan teklif", "offers created") },
    { id: "deals", label: "Deal", format: "number", value: dealsClosed.length, accent: "brand", icon: "handshake", hint: pick(lang, "kapanan satış", "deals closed") },
    { id: "payments", label: pick(lang, "Ödeme", "Payment"), format: "number", value: paymentsReceived.length, accent: "brand", icon: "banknote", hint: pick(lang, "ödemesi alınan deal", "deals with payment received") },
  ];

  const miniFunnel: MiniFunnelStage[] = [
    { key: "lead", label: "Lead", count: leads.length },
    { key: "contact", label: "Contact", count: contacts.length },
    { key: "offer", label: "Offer", count: offersCreated.length },
    { key: "deal", label: "Deal", count: dealsClosed.length },
    { key: "paid", label: pick(lang, "Ödeme", "Payment"), count: paymentsReceived.length },
  ];

  const actionCenter: ActionItem[] = [];
  if (neverCalled.length > 0)
    actionCenter.push({ id: "uncalled", label: pick(lang, `${neverCalled.length} lead henüz aranmadı`, `${neverCalled.length} leads not yet called`), status: "critical", href: "/agent/follow-up" });
  if (slaViolations.length > 0)
    actionCenter.push({ id: "sla", label: pick(lang, `${slaViolations.length} lead'de 15 dk SLA ihlali var`, `${slaViolations.length} leads have a 15-min SLA breach`), status: "risk", href: "/agent/follow-up" });
  const unsharedOffers = leads.filter((l) => l.offerStatus === "Offer Created").length;
  if (unsharedOffers > 0)
    actionCenter.push({ id: "offers", label: pick(lang, `${unsharedOffers} offer paylaşılmayı bekliyor`, `${unsharedOffers} offers waiting to be shared`), status: "warning", href: "/agent/follow-up" });
  const unpaidWon = leads.filter((l) => l.dealStatus === "Won" && !l.paymentReceived).length;
  if (unpaidWon > 0)
    actionCenter.push({ id: "payments", label: pick(lang, `${unpaidWon} deal için ödeme henüz alınmadı`, `${unpaidWon} deals still awaiting payment`), status: "risk", href: "/agent/performans" });
  const callbacksInRange = leads.filter((l) => inRange(l.callbackDate)).length;
  if (callbacksInRange > 0)
    actionCenter.push({ id: "callbacks", label: pick(lang, `${callbacksInRange} callback bu dönem için planlandı`, `${callbacksInRange} callbacks scheduled for this period`), status: "warning", href: "/agent/aramalar" });
  const overdueFollowUps = leads.filter(
    (l) => l.dueDate !== null && l.dueDate < MOCK_NOW,
  ).length;

  /* Saatlik dağılım — aralıktaki TÜM günler için saat-of-day bazında toplanır. */
  const hourBuckets = new Map<number, { total: number; answered: number }>();
  for (let h = 0; h < 24; h++) hourBuckets.set(h, { total: 0, answered: 0 });
  for (const call of calls) {
    const h = new Date(call.time + TZ_OFFSET).getUTCHours();
    const bucket = hourBuckets.get(h)!;
    bucket.total += 1;
    if (call.answered) bucket.answered += 1;
  }
  const hourlyCalls: HourlyCallPoint[] = Array.from({ length: 10 }, (_, i) => {
    const hour = 9 + i;
    const bucket = hourBuckets.get(hour) ?? { total: 0, answered: 0 };
    return { hour: String(hour).padStart(2, "0"), total: bucket.total, answered: bucket.answered };
  });

  return {
    overviewKpis,
    answerRatePct: Math.round(answerRatePct * 10) / 10,
    targetPct: Math.round(targetPct * 10) / 10,
    paymentsEUR: periodSalesEUR,
    miniFunnel,
    actionCenter,
    hourlyCalls,
    callKpis,
    gauges,
    speedToLead,
    fullFunnel,
    sourceConversion: conversionBy(leads, (l) => l.source),
    countryConversion: conversionBy(leads, (l) => l.country),
    languageConversion: conversionBy(leads, (l) => l.language),
    dailyTrend,
    followUp,
    backlog: {
      neverCalled: neverCalled.length,
      slaViolations: slaViolations.length,
      pendingOffers: unsharedOffers,
      overdueFollowUps,
    },
  };
}
