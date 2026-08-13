/**
 * PRİM / KOMİSYON KURAL MOTORU — saf kurallar katmanı.
 *
 * Kaynak (single source of truth):
 *  - `Natural_Clinic_Sales_Commission_System_Updated.xlsx` → Agent (satışçı)
 *    aylık komisyonu + tüm bölgeler için ortak çeyreklik ekstra komisyon.
 *  - `Team_Leader_Commission_ System Table.xlsx` → Takım Lideri kota üstü
 *    komisyonu, çeyreklik oranlar ve sıralama bonusları.
 *
 * Bu dosya BİLİNÇLİ olarak mock veriden ve React'ten bağımsızdır: yalnızca
 * tablo sabitleri + saf fonksiyonlar. Gerçek backend'e geçişte tablolar Admin
 * parametre ekranından beslenecek, fonksiyon imzaları değişmeyecek.
 */

/* ------------------------------------------------------------------ */
/* Bölge / rol / dönem tipleri                                         */
/* ------------------------------------------------------------------ */

export type CommissionRegion = "Istanbul" | "Morocco";
export type CommissionRole = "Salesperson" | "Manager";
export type QuarterKey = "Q1" | "Q2" | "Q3" | "Q4";

/** Aylık komisyon bandı sonucu — hangi kuralın uygulandığını da taşır. */
export interface MonthlyCommissionResult {
  /** Uygulanan oran (yüzde puan, örn. 3 = %3). */
  ratePct: number;
  /** Hesaplanan komisyon (€). */
  commissionEUR: number;
  /** Hangi bant uygulandı — gösterim/açıklama için. */
  band: "new-hire" | "standard" | "high" | "below-minimum";
  /**
   * Bir üst banda geçmek için gereken aylık satış eşiği (€).
   * En üst banttaysa null.
   */
  nextThresholdEUR: number | null;
  /** Bir üst bandın oranı (yüzde puan). En üst banttaysa null. */
  nextRatePct: number | null;
}

/* ------------------------------------------------------------------ */
/* AYLIK KOMİSYON — bölge bazlı kurallar                               */
/* ------------------------------------------------------------------ */

interface RegionMonthlyRule {
  /** Yeni işe alım sayılan gün sayısı (bu süre boyunca sabit oran, hedef yok). */
  newHireDays: number;
  newHireRatePct: number;
  /** Bu tutarın altında komisyon YOKTUR (kıdemli çalışan için). */
  minimumSalesEUR: number;
  /** minimumSalesEUR ile highThresholdEUR arasındaki standart oran. */
  standardRatePct: number;
  /** Yüksek performans bandı eşiği. */
  highThresholdEUR: number;
  highRatePct: number;
}

/**
 * NOT (Fas bandı yorumu): Excel'de kıdemli satışçı için standart bant
 * "€12.000–€14.000" yazılıdır ve yüksek bant "€15.000 ve üzeri"dir; arada
 * €14.000–€15.000 boşluğu kalır. Hesaplama notu 3 "tam €15.000 üst banda
 * dahildir" dediği için bu aralık standart bant (%0,5) olarak kapatılmıştır —
 * aksi hâlde bu tutar aralığında komisyon tanımsız kalırdı.
 */
export const MONTHLY_RULES: Record<CommissionRegion, RegionMonthlyRule> = {
  Istanbul: {
    newHireDays: 60,
    newHireRatePct: 1.0,
    minimumSalesEUR: 12_500,
    standardRatePct: 1.0,
    highThresholdEUR: 15_000,
    highRatePct: 3.0,
  },
  Morocco: {
    newHireDays: 90,
    newHireRatePct: 1.5,
    minimumSalesEUR: 12_000,
    standardRatePct: 0.5,
    highThresholdEUR: 15_000,
    highRatePct: 1.5,
  },
};

/** Fas'ta yönetici sabit oranı — kıdem/hedef koşulu yok. */
export const MOROCCO_MANAGER_RATE_PCT = 1.5;

export interface MonthlyCommissionInput {
  region: CommissionRegion;
  role: CommissionRole;
  /** İşe başlangıçtan itibaren geçen gün sayısı. */
  tenureDays: number;
  monthlySalesEUR: number;
}

/**
 * Aylık komisyonu hesaplar. Oran yalnızca bölge + kıdem + aylık satışa
 * bağlıdır; aylık hedef (MONTHLY_TARGET_EUR) komisyonu ETKİLEMEZ — hedef
 * ayrı bir motivasyon göstergesidir.
 */
export function monthlyCommission({
  region,
  role,
  tenureDays,
  monthlySalesEUR,
}: MonthlyCommissionInput): MonthlyCommissionResult {
  const rule = MONTHLY_RULES[region];

  const build = (
    ratePct: number,
    band: MonthlyCommissionResult["band"],
    nextThresholdEUR: number | null,
    nextRatePct: number | null,
  ): MonthlyCommissionResult => ({
    ratePct,
    commissionEUR: Math.round(monthlySalesEUR * ratePct) / 100,
    band,
    nextThresholdEUR,
    nextRatePct,
  });

  // Fas yöneticisi: sabit oran, başka koşul yok.
  if (region === "Morocco" && role === "Manager") {
    return build(MOROCCO_MANAGER_RATE_PCT, "standard", null, null);
  }

  // Yeni işe alım dönemi: minimum satış hedefi uygulanmaz.
  if (tenureDays <= rule.newHireDays) {
    return build(rule.newHireRatePct, "new-hire", null, null);
  }

  if (monthlySalesEUR < rule.minimumSalesEUR) {
    return build(0, "below-minimum", rule.minimumSalesEUR, rule.standardRatePct);
  }

  if (monthlySalesEUR < rule.highThresholdEUR) {
    return build(
      rule.standardRatePct,
      "standard",
      rule.highThresholdEUR,
      rule.highRatePct,
    );
  }

  return build(rule.highRatePct, "high", null, null);
}

/* ------------------------------------------------------------------ */
/* DİNAMİK SATIŞ HEDEFİ (TARGET LADDER)                                */
/* ------------------------------------------------------------------ */

/**
 * Agent'ın bir sonraki AYLIK satış hedefi, mevcut satışına göre otomatik
 * belirlenir — manuel hedef seçimi YOKTUR (kullanıcı talebi).
 *
 * Merdiven, aylık komisyon bantlarının eşiklerinden TÜRETİLİR; buradaki
 * 12.500 / 15.000 gibi sayılar elle yazılmaz (bkz. MONTHLY_RULES):
 *
 *   1. eşik = rule.minimumSalesEUR      (İstanbul 12.500 · Fas 12.000)
 *   2. eşik = rule.highThresholdEUR     (15.000 — en yüksek komisyon bandı)
 *   3. ve sonrası = 2. eşik + n × TARGET_STEP_EUR  (20.000, 25.000, 30.000 …)
 *
 * Eşiği TAM tutmak "geçmiş" sayılır: 15.000 € satan agent'ın hedefi 20.000 €
 * olur. Bu, komisyon kuralıyla tutarlıdır — hesaplama notu 3 gereği tam
 * 15.000 üst banda dahildir (bkz. MONTHLY_RULES üstündeki not).
 */
export const TARGET_STEP_EUR = 5_000;

export interface SalesTargetProgress {
  /** Mevcut satış (€). */
  currentEUR: number;
  /** Otomatik belirlenen bir sonraki hedef (€). */
  targetEUR: number;
  /** Hedefe kalan tutar (€) — hedefe ulaşıldıysa 0. */
  remainingEUR: number;
  /** Hedef gerçekleşme yüzdesi = mevcut ÷ hedef (1 ondalık). */
  progressPct: number;
  /** Merdivendeki seviye (1 = ilk eşik). */
  level: number;
  /**
   * Bu hedefin bir alt eşiği (€) — barda "bu seviyeye nereden geldim"
   * segmentini çizmek için. İlk seviyede 0.
   */
  previousTargetEUR: number;
  /**
   * Bu hedefe ulaşınca aylık komisyon ORANI değişiyorsa yeni oran (yüzde
   * puan); hedef bir komisyon bandı eşiği değilse null. 15.000 üstündeki
   * hedefler oranı değiştirmez — bu yüzden orada null döner ve UI yanlış
   * bir "oranın artacak" vaadi vermez.
   */
  unlocksRatePct: number | null;
}

/**
 * Mevcut aylık satışa göre hedef bar verisini üretir. Saf fonksiyon —
 * satış değiştiğinde hedef kendiliğinden bir üst seviyeye geçer.
 */
export function salesTargetProgress(
  monthlySalesEUR: number,
  region: CommissionRegion = "Istanbul",
): SalesTargetProgress {
  const rule = MONTHLY_RULES[region];
  const first = rule.minimumSalesEUR;
  const second = rule.highThresholdEUR;
  const sales = Math.max(0, monthlySalesEUR);

  let targetEUR: number;
  let previousTargetEUR: number;
  let level: number;
  let unlocksRatePct: number | null;

  if (sales < first) {
    targetEUR = first;
    previousTargetEUR = 0;
    level = 1;
    unlocksRatePct = rule.standardRatePct;
  } else if (sales < second) {
    targetEUR = second;
    previousTargetEUR = first;
    level = 2;
    unlocksRatePct = rule.highRatePct;
  } else {
    // İkinci eşiği tutan/geçen satış: 5.000'lik adımlarla devam.
    const stepsPassed = Math.floor((sales - second) / TARGET_STEP_EUR) + 1;
    targetEUR = second + stepsPassed * TARGET_STEP_EUR;
    previousTargetEUR = targetEUR - TARGET_STEP_EUR;
    level = 2 + stepsPassed;
    // En üst komisyon bandı zaten yakalandı; bu hedefler oranı artırmaz.
    unlocksRatePct = null;
  }

  return {
    currentEUR: sales,
    targetEUR,
    remainingEUR: Math.max(0, targetEUR - sales),
    progressPct: targetEUR > 0 ? Math.round((sales / targetEUR) * 1000) / 10 : 0,
    level,
    previousTargetEUR,
    unlocksRatePct,
  };
}

/* ------------------------------------------------------------------ */
/* ÇEYREK TAKVİMİ — tüm bölgeler için ortak                            */
/* ------------------------------------------------------------------ */

/**
 * Çeyrek → ay indeksleri (0 = Ocak). Excel "SHARED QUARTER CALENDAR":
 * Q1 Eylül-Ekim-Kasım · Q2 Aralık-Ocak-Şubat · Q3 Mart-Nisan-Mayıs ·
 * Q4 Haziran-Temmuz-Ağustos. Dikkat: Q2 yıl sınırını aşar (Aralık → Ocak).
 */
export const QUARTER_MONTHS: Record<QuarterKey, readonly number[]> = {
  Q1: [8, 9, 10],
  Q2: [11, 0, 1],
  Q3: [2, 3, 4],
  Q4: [5, 6, 7],
};

/** Bir ay indeksinin (0 = Ocak) hangi çeyreğe düştüğünü döndürür. */
export function quarterForMonth(monthIndex: number): QuarterKey {
  const keys: QuarterKey[] = ["Q1", "Q2", "Q3", "Q4"];
  for (const key of keys) {
    if (QUARTER_MONTHS[key].includes(monthIndex)) return key;
  }
  // Girdi 0-11 aralığında olmalı; değilse sessiz kalmayıp hata veriyoruz.
  throw new Error(`quarterForMonth: geçersiz ay indeksi (${monthIndex}) — 0-11 bekleniyor.`);
}

/**
 * Ayın çeyrek içindeki sırası (1, 2 veya 3). Örn. Q4'te Haziran=1,
 * Temmuz=2, Ağustos=3.
 */
export function monthPositionInQuarter(monthIndex: number): number {
  const quarter = quarterForMonth(monthIndex);
  return QUARTER_MONTHS[quarter].indexOf(monthIndex) + 1;
}

/* ------------------------------------------------------------------ */
/* ÇEYREKLİK EKSTRA KOMİSYON                                           */
/* ------------------------------------------------------------------ */

export interface QuarterlyBand {
  /** Aylık ORTALAMA satış eşiği (€) — oranı bu belirler. */
  monthlyAvgEUR: number;
  /** Çeyrek TOPLAMINA uygulanacak ekstra oran (yüzde puan). */
  ratePct: number;
}

/** Q1 / Q2 / Q3 çeyreklik ekstra komisyon hedefleri. */
export const QUARTERLY_BANDS_Q123: readonly QuarterlyBand[] = [
  { monthlyAvgEUR: 15_000, ratePct: 2.0 },
  { monthlyAvgEUR: 20_000, ratePct: 3.0 },
  { monthlyAvgEUR: 25_000, ratePct: 4.5 },
  { monthlyAvgEUR: 30_000, ratePct: 5.0 },
  { monthlyAvgEUR: 40_000, ratePct: 5.5 },
  { monthlyAvgEUR: 50_000, ratePct: 6.0 },
];

/** Q4 (Haziran-Temmuz-Ağustos) çeyreklik ekstra komisyon hedefleri. */
export const QUARTERLY_BANDS_Q4: readonly QuarterlyBand[] = [
  { monthlyAvgEUR: 14_000, ratePct: 2.0 },
  { monthlyAvgEUR: 18_000, ratePct: 3.0 },
  { monthlyAvgEUR: 22_500, ratePct: 4.0 },
  { monthlyAvgEUR: 27_000, ratePct: 5.0 },
  { monthlyAvgEUR: 36_000, ratePct: 5.5 },
  { monthlyAvgEUR: 45_000, ratePct: 6.0 },
];

/** Çeyreğe göre geçerli ekstra komisyon bandı tablosu. */
export function quarterlyBands(quarter: QuarterKey): readonly QuarterlyBand[] {
  return quarter === "Q4" ? QUARTERLY_BANDS_Q4 : QUARTERLY_BANDS_Q123;
}

/** Çeyreklik dilim merdiveninin tek adımı — "neredeyim / ne kadar kaldı". */
export interface TierStep extends QuarterlyBand {
  /** Bu dilim şu anki aylık ortalamayla yakalandı mı. */
  reached: boolean;
  /** Şu an içinde bulunulan (en yüksek yakalanan) dilim mi. */
  isCurrent: boolean;
  /** Sıradaki hedef dilim mi. */
  isNext: boolean;
  /**
   * Bu dilime ulaşmak için gereken EK satış (€) — mevcut çeyrek ortalamasını
   * bu eşiğe çıkarmak için. Yakalanmış dilimlerde 0.
   */
  gapEUR: number;
  /** gapEUR'yi kapatmak için gereken tahmini deal adedi. */
  gapDeals: number;
}

export interface QuarterProgressInput {
  quarter: QuarterKey;
  /** Çeyrek başından bugüne toplam satış (€). */
  quarterTotalEUR: number;
  /**
   * Çeyrekte geçen ay sayısı (1-3). İçinde bulunulan kısmi ay da sayılır —
   * "koşan ortalama" bu şekilde hesaplanır.
   */
  monthsElapsed: number;
  /** Ortalama deal tutarı (€) — dilim farkını deal adedine çevirmek için. */
  avgDealEUR: number;
}

export interface QuarterProgress {
  quarter: QuarterKey;
  /** Koşan aylık ortalama = quarterTotalEUR / monthsElapsed. */
  monthlyAvgEUR: number;
  /** Şu an geçerli ekstra oran (yüzde puan) — hiçbir dilim yakalanmadıysa 0. */
  currentRatePct: number;
  /** Şu anki orana göre çeyrek toplamı üzerinden ekstra komisyon (€). */
  extraEUR: number;
  currentBand: QuarterlyBand | null;
  nextBand: QuarterlyBand | null;
  /** Sıradaki dilime ulaşmak için gereken ek satış (€). En üstteyse 0. */
  gapToNextEUR: number;
  /** gapToNextEUR'nin deal karşılığı. */
  gapToNextDeals: number;
  /**
   * Sıradaki dilime geçilirse ekstra komisyonun ne olacağı (€) — motivasyon
   * mesajında "bu kadar daha kazanırsın" demek için.
   */
  nextExtraEUR: number;
  /** Tüm merdiven — UI'da adım adım gösterim için. */
  steps: TierStep[];
}

/**
 * Çeyreklik ekstra komisyon durumunu ve dilim merdivenini hesaplar.
 *
 * Excel hesaplama notları 4-5 gereği: ORAN aylık ortalamaya göre seçilir,
 * ancak ekstra komisyon çeyrek TOPLAMI üzerinden hesaplanır.
 */
export function quarterProgress({
  quarter,
  quarterTotalEUR,
  monthsElapsed,
  avgDealEUR,
}: QuarterProgressInput): QuarterProgress {
  const bands = quarterlyBands(quarter);
  // Sıfıra bölmeyi ve anlamsız ortalamayı engelle.
  const months = Math.max(1, Math.min(3, monthsElapsed));
  const monthlyAvgEUR = quarterTotalEUR / months;
  const safeAvgDeal = avgDealEUR > 0 ? avgDealEUR : 1;

  let currentBand: QuarterlyBand | null = null;
  let nextBand: QuarterlyBand | null = null;
  for (const band of bands) {
    if (monthlyAvgEUR >= band.monthlyAvgEUR) currentBand = band;
    else {
      nextBand = band;
      break;
    }
  }

  /** Ortalamayı verilen eşiğe çıkarmak için gereken ek satış. */
  const gapFor = (threshold: number) =>
    Math.max(0, Math.round(threshold * months - quarterTotalEUR));

  const steps: TierStep[] = bands.map((band) => {
    const reached = monthlyAvgEUR >= band.monthlyAvgEUR;
    const gapEUR = reached ? 0 : gapFor(band.monthlyAvgEUR);
    return {
      ...band,
      reached,
      isCurrent: currentBand !== null && band.monthlyAvgEUR === currentBand.monthlyAvgEUR,
      isNext: nextBand !== null && band.monthlyAvgEUR === nextBand.monthlyAvgEUR,
      gapEUR,
      gapDeals: gapEUR === 0 ? 0 : Math.ceil(gapEUR / safeAvgDeal),
    };
  });

  const currentRatePct = currentBand?.ratePct ?? 0;
  const gapToNextEUR = nextBand ? gapFor(nextBand.monthlyAvgEUR) : 0;

  return {
    quarter,
    monthlyAvgEUR,
    currentRatePct,
    extraEUR: Math.round(quarterTotalEUR * currentRatePct) / 100,
    currentBand,
    nextBand,
    gapToNextEUR,
    gapToNextDeals: gapToNextEUR === 0 ? 0 : Math.ceil(gapToNextEUR / safeAvgDeal),
    // Sıradaki dilim yakalanırsa çeyrek toplamı da en az eşiğe çıkmış olur.
    nextExtraEUR: nextBand
      ? Math.round((quarterTotalEUR + gapToNextEUR) * nextBand.ratePct) / 100
      : 0,
    steps,
  };
}

/* ------------------------------------------------------------------ */
/* TAKIM LİDERİ — kota üstü + çeyreklik + sıralama bonusları           */
/* ------------------------------------------------------------------ */

/**
 * TL kotası çeyreğe göre değişir (Excel: Q1-Q3 tablosunda €150.000,
 * Q4 tablosunda €145.000). Kota TAKIM TOPLAMI üzerindendir.
 */
export const TL_QUOTA_EUR: Record<QuarterKey, number> = {
  Q1: 150_000,
  Q2: 150_000,
  Q3: 150_000,
  Q4: 145_000,
};

/** Kotanın ÜSTÜNDEKİ satışa uygulanan aylık komisyon oranı. */
export const TL_MONTHLY_RATE_PCT = 2.0;

/**
 * TL çeyreklik komisyon oranları — agent başına aylık ortalama satışa göre.
 * Excel'de "Quarterly Bonus (If catch these targets as quarterly average.
 * These will be new comission rate)" kolonu. Q1-Q3 ve Q4 tabloları aynı
 * oranları kullanır; fark kotadadır.
 */
export const TL_QUARTERLY_BANDS: readonly QuarterlyBand[] = [
  { monthlyAvgEUR: 12_000, ratePct: 3.0 },
  { monthlyAvgEUR: 13_000, ratePct: 3.5 },
  { monthlyAvgEUR: 14_000, ratePct: 4.0 },
  { monthlyAvgEUR: 15_000, ratePct: 4.5 },
  { monthlyAvgEUR: 16_000, ratePct: 4.6 },
  { monthlyAvgEUR: 17_000, ratePct: 4.7 },
  { monthlyAvgEUR: 18_000, ratePct: 4.8 },
  { monthlyAvgEUR: 19_000, ratePct: 4.9 },
  { monthlyAvgEUR: 20_000, ratePct: 5.0 },
];

/**
 * Aylık ve çeyreklik bonusun ön koşulu: agent başına en az bu tutarda
 * gerçekleşme (Excel: "Condition: Min. 12.000 Per agent realization").
 */
export const TL_MIN_PER_AGENT_EUR = 12_000;

/**
 * "12.500 satışı geçen" agent sayısına göre çeyreklik komisyon çarpanı
 * (Excel sağ üst köşe: 7+ %10, 10+ %15, 12+ %20). Çarpan, çeyreklik
 * komisyonun ÜZERİNE eklenen yüzdedir.
 */
export const TL_ACHIEVER_MULTIPLIERS: readonly { minAgents: number; bonusPct: number }[] = [
  { minAgents: 12, bonusPct: 20 },
  { minAgents: 10, bonusPct: 15 },
  { minAgents: 7, bonusPct: 10 },
];

/** Çarpanın eşiği — bu tutarın üstünde satan agent "achiever" sayılır. */
export const TL_ACHIEVER_THRESHOLD_EUR = 12_500;

/** Verilen achiever sayısına karşılık gelen çarpan yüzdesi (yoksa 0). */
export function achieverBonusPct(achieverCount: number): number {
  for (const tier of TL_ACHIEVER_MULTIPLIERS) {
    if (achieverCount >= tier.minAgents) return tier.bonusPct;
  }
  return 0;
}

export type RankBonusPeriod = "monthly" | "quarterly";

/** Sıralama bonusu — 1./2./3. sıra ödülleri (€). */
export interface RankBonus {
  key: string;
  /** TR/EN etiketler gösterim katmanında seçilir. */
  labelTR: string;
  labelEN: string;
  period: RankBonusPeriod;
  /** [1. sıra, 2. sıra, 3. sıra] ödülleri (€). */
  prizes: readonly [number, number, number];
  /** Hangi sıralamaya göre verildiği. */
  basisTR: string;
  basisEN: string;
}

/**
 * Sıralama bonusları — Excel "SIRALAMA BONUSLARI" bloğu. Bu bonuslar
 * hesaplama sayfasında MANUEL girilebilir olarak işaretlenmiştir; bu yüzden
 * burada yalnızca ödül tablosu tutulur, otomatik atama yapılmaz.
 */
export const TL_RANK_BONUSES: readonly RankBonus[] = [
  { key: "top-tl-monthly", labelTR: "En İyi Takım Lideri", labelEN: "Top Team Leader", period: "monthly", prizes: [450, 300, 150], basisTR: "Satış sıralaması", basisEN: "Sales ranking" },
  { key: "least-discount-monthly", labelTR: "En Az İskonto Veren", labelEN: "Least Discount Rate Owner", period: "monthly", prizes: [450, 300, 150], basisTR: "İskonto sıralaması", basisEN: "Discount ranking" },
  { key: "deal-realization-monthly", labelTR: "Deal / Gerçekleşme Oranı", labelEN: "Deal / Realization Rate", period: "monthly", prizes: [450, 300, 150], basisTR: "Deal-gerçekleşme sıralaması", basisEN: "Deal-to-realization ranking" },
  { key: "top-tl-quarterly", labelTR: "En İyi Takım Lideri", labelEN: "Top Team Leader", period: "quarterly", prizes: [1800, 1200, 600], basisTR: "Çeyrek satış sıralaması", basisEN: "Quarterly sales ranking" },
  { key: "least-discount-quarterly", labelTR: "En Az İskonto Veren", labelEN: "Least Discount Rate Owner", period: "quarterly", prizes: [1800, 1200, 600], basisTR: "İskonto sıralaması", basisEN: "Discount ranking" },
  { key: "deal-realization-quarterly", labelTR: "Deal / Gerçekleşme Oranı", labelEN: "Deal / Realization Rate", period: "quarterly", prizes: [900, 600, 300], basisTR: "Deal-gerçekleşme sıralaması", basisEN: "Deal-to-realization ranking" },
  { key: "target-catcher-offers", labelTR: "Hedefi Yakalayan — Teklif", labelEN: "Target Catcher — Offers", period: "quarterly", prizes: [900, 600, 300], basisTR: "Teklif sıralaması", basisEN: "Offer ranking" },
];

export interface TeamLeaderCommissionInput {
  quarter: QuarterKey;
  /** Takımın bu ayki toplam satışı (€). */
  monthlyTeamSalesEUR: number;
  /** Takımdaki agent sayısı. */
  agentCount: number;
  /** Çeyrek başından bugüne takım toplamı (€). */
  quarterTeamSalesEUR: number;
  /** Çeyrekte geçen ay sayısı (1-3, kısmi ay dahil). */
  monthsElapsed: number;
  /** TL_ACHIEVER_THRESHOLD_EUR üstünde satan agent sayısı. */
  achieverCount: number;
}

export interface TeamLeaderCommissionResult {
  quotaEUR: number;
  /** Kota üstü satış (€) — negatifse 0. */
  overQuotaEUR: number;
  monthlyRatePct: number;
  /** Kota üstü × %2 (€). */
  monthlyCommissionEUR: number;
  /** Agent başına aylık ortalama satış (€) — çeyrek oranını bu belirler. */
  perAgentMonthlyAvgEUR: number;
  /** Ön koşul (agent başına min. €12.000) sağlandı mı. */
  conditionMet: boolean;
  quarterlyRatePct: number;
  /** Çeyreklik komisyon — çeyrek toplamı × oran (€). */
  quarterlyCommissionEUR: number;
  achieverBonusPct: number;
  /** Çarpanın getirdiği ek tutar (€). */
  achieverBonusEUR: number;
  /** Çeyreklik komisyon + çarpan bonusu (€). */
  quarterlyTotalEUR: number;
  nextBand: QuarterlyBand | null;
  /** Sıradaki çeyrek dilimine ulaşmak için gereken ek takım satışı (€). */
  gapToNextEUR: number;
}

/**
 * Takım Lideri komisyonunu hesaplar.
 *
 * Aylık: (takım satışı − kota) × %2.
 * Çeyreklik: agent başına aylık ortalamaya göre seçilen oran × çeyrek toplamı,
 * üstüne achiever çarpanı. Her ikisi de agent başına min. €12.000 koşuluna
 * bağlıdır (Excel notu).
 */
export function teamLeaderCommission({
  quarter,
  monthlyTeamSalesEUR,
  agentCount,
  quarterTeamSalesEUR,
  monthsElapsed,
  achieverCount,
}: TeamLeaderCommissionInput): TeamLeaderCommissionResult {
  const quotaEUR = TL_QUOTA_EUR[quarter];
  const overQuotaEUR = Math.max(0, monthlyTeamSalesEUR - quotaEUR);

  const agents = Math.max(1, agentCount);
  const months = Math.max(1, Math.min(3, monthsElapsed));
  const perAgentMonthlyAvgEUR = quarterTeamSalesEUR / months / agents;
  const conditionMet = perAgentMonthlyAvgEUR >= TL_MIN_PER_AGENT_EUR;

  const monthlyCommissionEUR = conditionMet
    ? Math.round(overQuotaEUR * TL_MONTHLY_RATE_PCT) / 100
    : 0;

  let currentBand: QuarterlyBand | null = null;
  let nextBand: QuarterlyBand | null = null;
  for (const band of TL_QUARTERLY_BANDS) {
    if (perAgentMonthlyAvgEUR >= band.monthlyAvgEUR) currentBand = band;
    else {
      nextBand = band;
      break;
    }
  }

  const quarterlyRatePct = conditionMet ? (currentBand?.ratePct ?? 0) : 0;
  const quarterlyCommissionEUR =
    Math.round(quarterTeamSalesEUR * quarterlyRatePct) / 100;
  const bonusPct = conditionMet ? achieverBonusPct(achieverCount) : 0;
  const achieverBonusEUR = Math.round(quarterlyCommissionEUR * bonusPct) / 100;

  // Sıradaki dilim: agent başına ortalamayı eşiğe çıkarmak için gereken toplam.
  const gapToNextEUR = nextBand
    ? Math.max(
        0,
        Math.round(nextBand.monthlyAvgEUR * months * agents - quarterTeamSalesEUR),
      )
    : 0;

  return {
    quotaEUR,
    overQuotaEUR,
    monthlyRatePct: TL_MONTHLY_RATE_PCT,
    monthlyCommissionEUR,
    perAgentMonthlyAvgEUR,
    conditionMet,
    quarterlyRatePct,
    quarterlyCommissionEUR,
    achieverBonusPct: bonusPct,
    achieverBonusEUR,
    quarterlyTotalEUR: quarterlyCommissionEUR + achieverBonusEUR,
    nextBand,
    gapToNextEUR,
  };
}
