/**
 * AGENT PRİM / KAZANÇ TÜRETİMİ — v2 4.7 "Hedef ve Prim" genişletmesi.
 *
 * Kural motoru `commission.ts`tedir; bu dosya yalnızca o kuralları agent'ın
 * gerçek verisine uygular ve ekranın ihtiyaç duyduğu satırları üretir.
 *
 * VERİ KAYNAĞI NOTU (önemli):
 *  - İÇİNDE BULUNULAN AY (mock: Ağustos 2026) tamamen `LEADS`ten türetilir —
 *    agent'ın her gün izlediği "anlık prim" rakamı gerçek lead verisinden gelir.
 *  - GEÇMİŞ AYLAR seed'li sentetik seridir. Sebep: lead motoru yalnızca 30 gün
 *    geriye üretim yapar (bkz. lead-engine LOOKBACK_DAYS), dolayısıyla Haziran
 *    ve öncesi için TAM ay verisi yoktur. Yarım aylık tahsilatı "tam ay" gibi
 *    kullanmak çeyrek ortalamasını yanlış (düşük) gösterirdi. Aynı yaklaşım
 *    team-monthly / region-monthly katmanlarında da kullanılıyor.
 *  - GELECEK AYLAR mevcut tempodan (run-rate) projeksiyondur.
 */

import type { Kpi } from "@/lib/types/agent-data";
import { pick, type Lang } from "@/lib/i18n/core";
import { formatRatePct } from "@/lib/utils/format";
import { Rng } from "./seeded-random";
import { DAY, HOUR, MOCK_NOW } from "./lead-engine";
import { LEADS } from "./datasets";
import { AGENT_PROFILE } from "./mock-data";
import {
  monthlyCommission,
  quarterForMonth,
  monthPositionInQuarter,
  quarterProgress,
  quarterlyBands,
  type CommissionRegion,
  type QuarterKey,
  type QuarterProgress,
} from "./commission";

const TZ_OFFSET = 3 * HOUR;
/** Sentetik geçmiş ay serisi için sabit seed — deterministik olmalı. */
const EARNINGS_SEED = 20_260_716;

/* ------------------------------------------------------------------ */
/* Takvim — MOCK_NOW'dan TÜRETİLİR (sabit yazılmaz)                    */
/* ------------------------------------------------------------------ */

const nowLocal = new Date(MOCK_NOW + TZ_OFFSET);
export const CURRENT_YEAR = nowLocal.getUTCFullYear();
/** 0 = Ocak. Mock'ta 6 (Temmuz). */
export const CURRENT_MONTH_INDEX = nowLocal.getUTCMonth();
/** Ayın kaçıncı günündeyiz (mock: 16). */
export const DAY_OF_MONTH = nowLocal.getUTCDate();
/** İçinde bulunulan ayın gün sayısı (mock: 31). */
export const DAYS_IN_MONTH = new Date(
  Date.UTC(CURRENT_YEAR, CURRENT_MONTH_INDEX + 1, 0),
).getUTCDate();

const MONTH_START = Date.parse(
  `${CURRENT_YEAR}-${String(CURRENT_MONTH_INDEX + 1).padStart(2, "0")}-01T00:00:00+03:00`,
);

/** "2026-07" biçiminde ay anahtarı. */
function monthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export const CURRENT_MONTH_KEY = monthKey(CURRENT_YEAR, CURRENT_MONTH_INDEX);

/* ------------------------------------------------------------------ */
/* Agent bağlamı — bölge, rol, kıdem                                   */
/* ------------------------------------------------------------------ */

/** Profil lokasyonunu komisyon bölgesine eşler. */
function regionFromLocation(location: string | undefined): CommissionRegion {
  if (!location) return "Istanbul";
  const normalized = location.toLocaleLowerCase("tr");
  // "Fas" (TR) / "Morocco" (EN) / şehir adları
  if (
    normalized.includes("fas") ||
    normalized.includes("morocco") ||
    normalized.includes("maroc") ||
    normalized.includes("kazablanka") ||
    normalized.includes("casablanca")
  ) {
    return "Morocco";
  }
  return "Istanbul";
}

export const AGENT_REGION: CommissionRegion = regionFromLocation(
  AGENT_PROFILE.location,
);

export const AGENT_TENURE_DAYS: number = (() => {
  if (!AGENT_PROFILE.startDateISO) return 9999;
  const start = Date.parse(`${AGENT_PROFILE.startDateISO}T00:00:00+03:00`);
  if (Number.isNaN(start)) {
    console.error(
      "[agent-earnings] AGENT_PROFILE.startDateISO ayrıştırılamadı:",
      AGENT_PROFILE.startDateISO,
    );
    return 9999;
  }
  return Math.max(0, Math.floor((MOCK_NOW - start) / DAY));
})();

/* ------------------------------------------------------------------ */
/* Ortalama deal tutarı — dilim farkını "kaç deal" diye çevirmek için  */
/* ------------------------------------------------------------------ */

const paidLeads = LEADS.filter((l) => l.paymentAt !== null && l.dealAmount !== null);

export const AVG_DEAL_EUR: number = (() => {
  if (paidLeads.length === 0) return 0;
  const total = paidLeads.reduce((s, l) => s + (l.dealAmount ?? 0), 0);
  return Math.round(total / paidLeads.length);
})();

/* ------------------------------------------------------------------ */
/* İÇİNDE BULUNULAN AY — günlük prim tablosu (LEADS'ten)               */
/* ------------------------------------------------------------------ */

/** Satış = tahsilatı alınan deal (mevcut GOAL/TARGET_PACE ile aynı tanım). */
const currentMonthPayments = paidLeads.filter(
  (l) => (l.paymentAt ?? 0) >= MONTH_START,
);

export interface DailyCommissionRow {
  /** Ayın günü (1-31). */
  day: number;
  dateISO: string;
  /** O gün tahsil edilen satış (€). */
  salesEUR: number;
  /** O gün tahsilatı kapanan deal adedi. */
  deals: number;
  /** Ay başından o güne birikimli satış (€). */
  cumulativeSalesEUR: number;
  /** Birikimli satışın karşılık geldiği aylık oran (yüzde puan). */
  ratePct: number;
  /** O güne kadar birikmiş prim (€) — "anlık prim". */
  accruedCommissionEUR: number;
  /** Bir önceki güne göre prim artışı (€). */
  commissionDeltaEUR: number;
  /** O gün bir üst prim bandına geçildi mi (oran atladı mı). */
  crossedBand: boolean;
  isToday: boolean;
}

/**
 * Günlük satırlar. Prim, birikimli aylık satışa göre YENİDEN hesaplanır —
 * çünkü oran aylık toplamın fonksiyonudur (basamaklı). Bu sayede bandın
 * aşıldığı gün primde görünür bir sıçrama olur; tablo bunu `crossedBand`
 * ile işaretler.
 */
export const DAILY_COMMISSION_ROWS: DailyCommissionRow[] = (() => {
  const rows: DailyCommissionRow[] = [];
  let cumulative = 0;
  let prevAccrued = 0;
  let prevRate = monthlyCommission({
    region: AGENT_REGION,
    role: "Salesperson",
    tenureDays: AGENT_TENURE_DAYS,
    monthlySalesEUR: 0,
  }).ratePct;

  for (let day = 1; day <= DAY_OF_MONTH; day++) {
    const dayStart = MONTH_START + (day - 1) * DAY;
    const dayPayments = currentMonthPayments.filter(
      (l) => (l.paymentAt ?? 0) >= dayStart && (l.paymentAt ?? 0) < dayStart + DAY,
    );
    const salesEUR = dayPayments.reduce((s, l) => s + (l.dealAmount ?? 0), 0);
    cumulative += salesEUR;

    const result = monthlyCommission({
      region: AGENT_REGION,
      role: "Salesperson",
      tenureDays: AGENT_TENURE_DAYS,
      monthlySalesEUR: cumulative,
    });

    rows.push({
      day,
      dateISO: new Date(dayStart + TZ_OFFSET).toISOString().slice(0, 10),
      salesEUR,
      deals: dayPayments.length,
      cumulativeSalesEUR: cumulative,
      ratePct: result.ratePct,
      accruedCommissionEUR: result.commissionEUR,
      commissionDeltaEUR: Math.round((result.commissionEUR - prevAccrued) * 100) / 100,
      crossedBand: result.ratePct > prevRate,
      isToday: day === DAY_OF_MONTH,
    });

    prevAccrued = result.commissionEUR;
    prevRate = result.ratePct;
  }
  return rows;
})();

const todayRow = DAILY_COMMISSION_ROWS[DAILY_COMMISSION_ROWS.length - 1];

/* ------------------------------------------------------------------ */
/* AY BAŞINDAN BUGÜNE (MTD) — hero bandının ana rakamı                 */
/* ------------------------------------------------------------------ */

const monthSalesEUR = currentMonthPayments.reduce(
  (s, l) => s + (l.dealAmount ?? 0),
  0,
);

const monthResult = monthlyCommission({
  region: AGENT_REGION,
  role: "Salesperson",
  tenureDays: AGENT_TENURE_DAYS,
  monthlySalesEUR: monthSalesEUR,
});

/** Mevcut tempoyla ay sonu satış projeksiyonu (€). */
export const MONTH_FORECAST_SALES_EUR = Math.round(
  (monthSalesEUR / DAY_OF_MONTH) * DAYS_IN_MONTH,
);

const forecastResult = monthlyCommission({
  region: AGENT_REGION,
  role: "Salesperson",
  tenureDays: AGENT_TENURE_DAYS,
  monthlySalesEUR: MONTH_FORECAST_SALES_EUR,
});

export const MONTH_TO_DATE = {
  salesEUR: monthSalesEUR,
  deals: currentMonthPayments.length,
  ratePct: monthResult.ratePct,
  /** Şu ana kadar birikmiş prim (€) — "anlık prim". */
  commissionEUR: monthResult.commissionEUR,
  band: monthResult.band,
  /** Bir üst aylık banda geçmek için gereken satış eşiği (€). */
  nextThresholdEUR: monthResult.nextThresholdEUR,
  nextRatePct: monthResult.nextRatePct,
  /** Bir üst aylık banda kalan satış (€). */
  gapToNextEUR:
    monthResult.nextThresholdEUR === null
      ? 0
      : Math.max(0, monthResult.nextThresholdEUR - monthSalesEUR),
  forecastSalesEUR: MONTH_FORECAST_SALES_EUR,
  forecastCommissionEUR: forecastResult.commissionEUR,
  forecastRatePct: forecastResult.ratePct,
} as const;

export const TODAY_EARNINGS = {
  day: DAY_OF_MONTH,
  salesEUR: todayRow?.salesEUR ?? 0,
  deals: todayRow?.deals ?? 0,
  /** Bugün primde yaşanan artış (€). */
  commissionEUR: todayRow?.commissionDeltaEUR ?? 0,
  crossedBand: todayRow?.crossedBand ?? false,
} as const;

/* ------------------------------------------------------------------ */
/* AYLIK SERİ — geçmiş (sentetik) + bu ay (gerçek) + gelecek (projeksiyon) */
/* ------------------------------------------------------------------ */

export type MonthStatus = "actual" | "current" | "projected";

export interface MonthlyEarningRow {
  /** "2026-07" */
  key: string;
  year: number;
  /** 0 = Ocak. */
  monthIndex: number;
  salesEUR: number;
  status: MonthStatus;
  ratePct: number;
  /** O ayın aylık komisyonu (€) — çeyreklik ekstra HARİÇ. */
  commissionEUR: number;
}

/**
 * Sentetik geçmiş: Aralık 2025 → içinde bulunulan aydan bir önceki ay.
 * Agent 10 Kas 2025'te başladığı için Aralık 2025 ilk tam çalışma ayıdır;
 * seri oradan başlar (Q2 2025-26 çeyreğinin ilk ayı da Aralık'tır).
 */
const HISTORY_START_YEAR = 2025;
const HISTORY_START_MONTH_INDEX = 11; // Aralık

/** Kıdem arttıkça yükselen gerçekçi bir satış rampası (€). */
const RAMP_FROM_EUR = 13_500;
const RAMP_TO_EUR = 22_000;

function historyMonths(): { year: number; monthIndex: number }[] {
  const months: { year: number; monthIndex: number }[] = [];
  let year = HISTORY_START_YEAR;
  let monthIndex = HISTORY_START_MONTH_INDEX;
  while (year < CURRENT_YEAR || (year === CURRENT_YEAR && monthIndex < CURRENT_MONTH_INDEX)) {
    months.push({ year, monthIndex });
    monthIndex += 1;
    if (monthIndex > 11) {
      monthIndex = 0;
      year += 1;
    }
  }
  return months;
}

/** key → satış (€). Tüm hesaplamalar bu haritadan okur. */
const salesByMonth = new Map<string, number>();

(() => {
  const rng = new Rng(EARNINGS_SEED);
  const months = historyMonths();
  const span = Math.max(1, months.length - 1);
  months.forEach(({ year, monthIndex }, i) => {
    const base = RAMP_FROM_EUR + (RAMP_TO_EUR - RAMP_FROM_EUR) * (i / span);
    const jitter = rng.range(-0.12, 0.12);
    // 50 €'ya yuvarla — lead motorundaki deal tutarlarıyla aynı granülerlik.
    const value = Math.round((base * (1 + jitter)) / 50) * 50;
    salesByMonth.set(monthKey(year, monthIndex), value);
  });
})();

// İçinde bulunulan ay: gerçek (bugüne kadar).
salesByMonth.set(CURRENT_MONTH_KEY, monthSalesEUR);

/**
 * Gelecek ay projeksiyonu (run-rate): son üç ayın ortalaması — içinde
 * bulunulan ay TAM AY projeksiyonuyla katılır (mevcut tempoyu yansıtsın).
 */
export const PROJECTED_MONTHLY_SALES_EUR: number = (() => {
  const history = historyMonths();
  const lastTwo = history.slice(-2).map((m) => salesByMonth.get(monthKey(m.year, m.monthIndex)) ?? 0);
  const samples = [...lastTwo, MONTH_FORECAST_SALES_EUR].filter((v) => v > 0);
  if (samples.length === 0) return 0;
  return Math.round(samples.reduce((s, v) => s + v, 0) / samples.length / 50) * 50;
})();

// Gelecek aylar: içinde bulunulan aydan sonraki tüm 2026 ayları.
for (let m = CURRENT_MONTH_INDEX + 1; m <= 11; m++) {
  salesByMonth.set(monthKey(CURRENT_YEAR, m), PROJECTED_MONTHLY_SALES_EUR);
}

function rowFor(year: number, monthIndex: number): MonthlyEarningRow {
  const key = monthKey(year, monthIndex);
  const salesEUR = salesByMonth.get(key) ?? 0;
  const result = monthlyCommission({
    region: AGENT_REGION,
    role: "Salesperson",
    tenureDays: AGENT_TENURE_DAYS,
    monthlySalesEUR: salesEUR,
  });
  const status: MonthStatus =
    key === CURRENT_MONTH_KEY
      ? "current"
      : year > CURRENT_YEAR || (year === CURRENT_YEAR && monthIndex > CURRENT_MONTH_INDEX)
        ? "projected"
        : "actual";
  return {
    key,
    year,
    monthIndex,
    salesEUR,
    status,
    ratePct: result.ratePct,
    commissionEUR: result.commissionEUR,
  };
}

/** İçinde bulunulan takvim yılının 12 ayı — grafik ve yıl toplamı için. */
export const MONTHLY_EARNINGS: MonthlyEarningRow[] = Array.from(
  { length: 12 },
  (_, m) => rowFor(CURRENT_YEAR, m),
);

/* ------------------------------------------------------------------ */
/* ÇEYREKLER                                                           */
/* ------------------------------------------------------------------ */

export interface QuarterMonthCell {
  key: string;
  monthIndex: number;
  year: number;
  salesEUR: number;
  status: MonthStatus;
}

export interface QuarterEarning {
  quarter: QuarterKey;
  /** Çeyreğin bittiği (ödemenin yapıldığı) yıl. */
  endYear: number;
  months: QuarterMonthCell[];
  totalEUR: number;
  monthlyAvgEUR: number;
  ratePct: number;
  extraEUR: number;
  /** Çeyreğin tamamı geçmişte mi (kesinleşmiş) yoksa hâlâ sürüyor/gelecek mi. */
  settled: boolean;
}

/**
 * 2026 içinde ÖDEMESİ YAPILAN çeyrekler — çeyreğin son ayı 2026'ya düşenler.
 * Çeyrek takvimi Eylül-anchor'lı olduğu için yıl sınırını aşan çeyrekler
 * (Q2 = Aralık-Ocak-Şubat) bilinçli olarak açıkça yazılmıştır; genel tarih
 * matematiği bu sınırda kırılgan olurdu.
 */
const QUARTER_DEFS: { quarter: QuarterKey; months: { year: number; monthIndex: number }[] }[] = [
  { quarter: "Q2", months: [{ year: CURRENT_YEAR - 1, monthIndex: 11 }, { year: CURRENT_YEAR, monthIndex: 0 }, { year: CURRENT_YEAR, monthIndex: 1 }] },
  { quarter: "Q3", months: [{ year: CURRENT_YEAR, monthIndex: 2 }, { year: CURRENT_YEAR, monthIndex: 3 }, { year: CURRENT_YEAR, monthIndex: 4 }] },
  { quarter: "Q4", months: [{ year: CURRENT_YEAR, monthIndex: 5 }, { year: CURRENT_YEAR, monthIndex: 6 }, { year: CURRENT_YEAR, monthIndex: 7 }] },
  { quarter: "Q1", months: [{ year: CURRENT_YEAR, monthIndex: 8 }, { year: CURRENT_YEAR, monthIndex: 9 }, { year: CURRENT_YEAR, monthIndex: 10 }] },
];

export const QUARTER_EARNINGS: QuarterEarning[] = QUARTER_DEFS.map((def) => {
  const months: QuarterMonthCell[] = def.months.map(({ year, monthIndex }) => {
    const row = rowFor(year, monthIndex);
    return { key: row.key, monthIndex, year, salesEUR: row.salesEUR, status: row.status };
  });
  const totalEUR = months.reduce((s, m) => s + m.salesEUR, 0);
  const monthlyAvgEUR = totalEUR / months.length;
  const bands = quarterlyBands(def.quarter);
  let ratePct = 0;
  for (const band of bands) {
    if (monthlyAvgEUR >= band.monthlyAvgEUR) ratePct = band.ratePct;
    else break;
  }
  return {
    quarter: def.quarter,
    endYear: months[months.length - 1].year,
    months,
    totalEUR,
    monthlyAvgEUR,
    ratePct,
    extraEUR: Math.round(totalEUR * ratePct) / 100,
    settled: months.every((m) => m.status === "actual"),
  };
});

/* İçinde bulunulan çeyrek — dilim merdiveninin kaynağı. */
export const CURRENT_QUARTER: QuarterKey = quarterForMonth(CURRENT_MONTH_INDEX);
/** Çeyrekte geçen ay sayısı — içinde bulunulan kısmi ay dahil (mock: 2). */
export const MONTHS_ELAPSED_IN_QUARTER = monthPositionInQuarter(CURRENT_MONTH_INDEX);

const currentQuarterDef = QUARTER_DEFS.find((d) => d.quarter === CURRENT_QUARTER);

/** Çeyrek başından BUGÜNE toplam satış (gelecek aylar hariç). */
export const QUARTER_TO_DATE_EUR: number = (() => {
  if (!currentQuarterDef) {
    console.error("[agent-earnings] içinde bulunulan çeyrek tanımı bulunamadı:", CURRENT_QUARTER);
    return monthSalesEUR;
  }
  return currentQuarterDef.months
    .slice(0, MONTHS_ELAPSED_IN_QUARTER)
    .reduce((s, { year, monthIndex }) => s + (salesByMonth.get(monthKey(year, monthIndex)) ?? 0), 0);
})();

/** Çeyreklik dilim durumu + merdiven — motivasyon mesajının kaynağı. */
export const QUARTER_PROGRESS: QuarterProgress = quarterProgress({
  quarter: CURRENT_QUARTER,
  quarterTotalEUR: QUARTER_TO_DATE_EUR,
  monthsElapsed: MONTHS_ELAPSED_IN_QUARTER,
  avgDealEUR: AVG_DEAL_EUR,
});

/** İçinde bulunulan çeyreğin ay kırılımı — merdiven kartının alt satırı. */
export const CURRENT_QUARTER_MONTHS: QuarterMonthCell[] =
  QUARTER_EARNINGS.find((q) => q.quarter === CURRENT_QUARTER)?.months ?? [];

/* ------------------------------------------------------------------ */
/* YIL PROJEKSİYONU                                                    */
/* ------------------------------------------------------------------ */

const monthlySumTo = (predicate: (row: MonthlyEarningRow) => boolean) =>
  MONTHLY_EARNINGS.filter(predicate).reduce((s, r) => s + r.commissionEUR, 0);

const earnedMonthlyEUR = monthlySumTo((r) => r.status !== "projected");
const remainingMonthlyEUR = monthlySumTo((r) => r.status === "projected");

const settledQuarterExtraEUR = QUARTER_EARNINGS.filter((q) => q.settled).reduce(
  (s, q) => s + q.extraEUR,
  0,
);
const openQuarterExtraEUR = QUARTER_EARNINGS.filter((q) => !q.settled).reduce(
  (s, q) => s + q.extraEUR,
  0,
);

/**
 * Yıl projeksiyonu. "Kazanılan" = kesinleşmiş aylar + kesinleşmiş çeyrekler.
 * "Kalan" = projeksiyon aylar + hâlâ açık/gelecek çeyreklerin ekstrası.
 *
 * NOT: Aralık 2026 ayının komisyonu 2026'ya dahildir, ancak Aralık'ın içinde
 * bulunduğu çeyrek (Q2: Ara-Oca-Şub) 2027'de kapandığı için o çeyreğin ekstra
 * komisyonu bu yıl toplamına DAHİL EDİLMEZ.
 */
export const YEAR_PROJECTION = {
  year: CURRENT_YEAR,
  earnedMonthlyEUR: Math.round(earnedMonthlyEUR * 100) / 100,
  remainingMonthlyEUR: Math.round(remainingMonthlyEUR * 100) / 100,
  settledQuarterExtraEUR: Math.round(settledQuarterExtraEUR * 100) / 100,
  openQuarterExtraEUR: Math.round(openQuarterExtraEUR * 100) / 100,
  earnedTotalEUR: Math.round((earnedMonthlyEUR + settledQuarterExtraEUR) * 100) / 100,
  remainingTotalEUR: Math.round((remainingMonthlyEUR + openQuarterExtraEUR) * 100) / 100,
  totalEUR:
    Math.round(
      (earnedMonthlyEUR + remainingMonthlyEUR + settledQuarterExtraEUR + openQuarterExtraEUR) * 100,
    ) / 100,
} as const;

/* ------------------------------------------------------------------ */
/* KPI kartları                                                        */
/* ------------------------------------------------------------------ */

export function earningsKpis(lang: Lang = "tr"): Kpi[] {
  const q = QUARTER_PROGRESS;
  return [
    {
      id: "mtd-commission",
      label: pick(lang, "Bu Ay Biriken Prim", "Commission Accrued This Month"),
      format: "currency",
      value: MONTH_TO_DATE.commissionEUR,
      accent: "brand",
      icon: "banknote",
      hint: pick(
        lang,
        `${formatRatePct(MONTH_TO_DATE.ratePct)} aylık oran üzerinden`,
        `at a ${MONTH_TO_DATE.ratePct}% monthly rate`,
      ),
    },
    {
      id: "quarter-extra",
      label: pick(lang, "Çeyreklik Ekstra Prim", "Quarterly Extra Commission"),
      format: "currency",
      value: q.extraEUR,
      accent: "violet",
      icon: "trending-up",
      hint: pick(
        lang,
        `${q.quarter} · ${formatRatePct(q.currentRatePct)} dilim`,
        `${q.quarter} · ${q.currentRatePct}% tier`,
      ),
    },
    {
      id: "month-forecast-commission",
      label: pick(lang, "Tahmini Ay Sonu Prim", "Projected Month-End Commission"),
      format: "currency",
      value: MONTH_TO_DATE.forecastCommissionEUR,
      accent: "brand-secondary",
      icon: "target",
      hint: pick(lang, "mevcut tempoyla", "at your current pace"),
    },
    {
      id: "year-projection",
      label: pick(lang, "Yıl Sonu Tahmini Prim", "Projected Year-End Commission"),
      format: "currency",
      value: YEAR_PROJECTION.totalEUR,
      accent: "indigo",
      icon: "percent",
      hint: pick(
        lang,
        `${YEAR_PROJECTION.year} · aylık + çeyreklik`,
        `${YEAR_PROJECTION.year} · monthly + quarterly`,
      ),
    },
  ];
}
