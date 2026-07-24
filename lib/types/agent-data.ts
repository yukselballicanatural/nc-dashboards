/**
 * Paylaşılan veri tipleri — CLAUDE.md Bölüm 4-5.
 * NOT: Bu dosya rol-bağımsız/genel tutulur; ileride Team Leader ve
 * Region Manager fazları aynı temel tipleri genişletecek. Agent'a özel
 * alanlar buraya karıştırılmaz (gerekirse ayrı dosyada extend edilir).
 */

/** Semantik durum seviyeleri — renk karşılıkları design token'larda (3.1). */
export type StatusLevel = "success" | "warning" | "risk" | "critical" | "neutral";

/** Marka vurgu renkleri — KPI/grafik renklendirmesi için (3.1). */
export type AccentColor = "brand" | "brand-secondary" | "indigo" | "violet";

/** KPI değerinin gösterim biçimi. */
export type KpiFormat = "number" | "percent" | "currency" | "ratio";

export interface PersonProfile {
  id: string;
  name: string;
  /** Rol rozeti — 4.1 (Senior/Junior). */
  role: "Senior" | "Junior";
  team: string;
  location?: string;
  /** İşe başlangıç (ISO tarih). */
  startDateISO?: string;
}

/** "vs önceki dönem" değişim etiketi — CLAUDE.md Bölüm 2. */
export interface KpiDelta {
  /** Yüzde değişim (örn. +12, -20). */
  value: number;
  /** false ise düşüş iyidir (örn. aranmamış lead sayısı). */
  positiveIsGood: boolean;
}

export interface Kpi {
  id: string;
  label: string;
  format: KpiFormat;
  /** number/percent/currency için ana değer; ratio için pay (numerator). */
  value: number;
  /** Yalnızca format="ratio" — payda (örn. 10/12'deki 12). */
  denominator?: number;
  /** Değerin altındaki küçük açıklama satırı (örn. "%83,3 uyum"). */
  hint?: string;
  accent?: AccentColor;
  /** Kart durumu — örn. kritik KPI'da uyarı vurgusu. */
  status?: StatusLevel;
  /** Lucide ikon anahtarı — görsel eşleme KpiCard içinde yapılır. */
  icon?: string;
  delta?: KpiDelta;
}

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
}

/** "Bugün yapman gerekenler" tarzı aksiyon satırı — 4.3. */
export interface ActionItem {
  id: string;
  label: string;
  status: StatusLevel;
  /** Tıklanınca gidilecek sekme yolu. */
  href: string;
}

/** "Sen vs Takım" karşılaştırması — 4.3 (değerler yüzde puan). */
export interface ComparisonMetric {
  key: string;
  label: string;
  minePct: number;
  teamPct: number;
}

/** Sıralama/puan bilgisi — 4.6 Rank kartı (TL fazında liste haline gelecek). */
export interface RankInfo {
  position: number;
  totalAgents: number;
  /** Genel Başarı puanı (0-100). */
  score: number;
  teamName: string;
}

/** Saatlik aktivite — 4.4 sütun grafik (TL fazında ısı haritasına genişler). */
export interface HourlyActivity {
  /** "09", "10" ... mesai saati etiketi. */
  hour: string;
  calls: number;
}

/** Bekleme süresi dağılım segmenti — 4.4 (kritiklik arttıkça sıcak renk). */
export interface WaitTimeSegment {
  key: string;
  label: string;
  count: number;
  status: StatusLevel;
}

/** Radial gauge metriği — 4.4 (SLA/Connection) ve 4.6 (hedef gerçekleşme). */
export interface GaugeMetric {
  key: string;
  label: string;
  /** Gerçekleşen değer (yüzde puan). */
  valuePct: number;
  /** Hedef (yüzde puan) — renk, hedefe yakınlığa göre belirlenir. */
  targetPct: number;
}

/** Callback kaydı — 4.4 kart-liste. */
export interface CallbackItem {
  id: string;
  name: string;
  phone: string;
  scheduledAtISO: string;
}

/** Sales Opportunity statü dağılımı satırı — 4.5 (adet + varsa tutar). */
export interface StatusDistributionItem {
  key: string;
  label: string;
  count: number;
  amountEUR?: number;
}

/** Aylık trend noktası — 4.6 çizgi grafik (gerçekleşen vs hedef). */
export interface TrendPoint {
  /** "Şub", "Mar" ... kısa ay etiketi. */
  month: string;
  actualEUR: number;
  targetEUR: number;
}

/** Aylık hedef gerçekleşme — 4.6 büyük gauge. */
export interface GoalProgress {
  actualEUR: number;
  targetEUR: number;
  /** Tahmini ay sonu. */
  forecastEUR: number;
}

/** Payment durum satırı — 4.6 (Confirmed/Waiting/Rejected). */
export interface PaymentStatusItem {
  key: string;
  label: string;
  count: number;
  amountEUR: number;
  status: StatusLevel;
}

/** Lead önceliği — 4.5 tablo rozetleri. */
export type LeadPriority =
  | "cok-kritik"
  | "kritik"
  | "yuksek"
  | "orta"
  | "normal";

/* ------------------------------------------------------------------ */
/* SEEDED MOCK VERİ MODELİ — CLAUDE.md v2 Bölüm 5                      */
/* Rol-bağımsız: TL/RM fazları aynı Lead varlığını kullanacak.          */
/* ------------------------------------------------------------------ */

/** Tek çağrı kaydı — v2 5.2. */
export interface LeadCall {
  /** Epoch ms. */
  time: number;
  answered: boolean;
  resultCode: string;
  /** Cevaplanan çağrıda konuşma süresi (saniye). Cevaplanmayanda 0. */
  talkSec: number;
}

export type OfferStatus =
  | "Offer Created"
  | "Offer Shared"
  | "Offer Accepted"
  | "Willing to Close";

/**
 * Lead sonuç/kayıp nedeni — Zoho "Sales Opportunity Result" kodları temel
 * alındı. Kazanılan (Won) lead'lerde null. "Interested" hâlâ açık fırsat;
 * diğerleri kayıp/olumsuz sonuç nedenleridir. Sade Türkçe/İngilizce karşılıkları
 * gösterim katmanında (compute) verilir.
 */
export type ResultReason =
  | "Interested"
  | "Not Interested"
  | "No Response"
  | "No Answer"
  | "Budget Issue"
  | "Chose Another Provider"
  | "Not Eligible"
  | "Language Barrier"
  | "Wrong Contact Info"
  | "Already Treated";

export type LeadStatus =
  | "New Lead"
  | "Convert to Contact"
  | "Overdue Lead"
  | "No Response"
  | "Returning Lead"
  | "Waiting for Contact Info";

/** Temel Lead varlığı — v2 5.2 (tüm zamanlar epoch ms). */
export interface Lead {
  id: string;
  name: string;
  phone: string;
  country: string;
  language: string;
  source: string;
  createdAt: number;
  calls: LeadCall[];
  attemptCount: number;
  /** Herhangi bir çağrı answered=true ise. */
  reached: boolean;
  isConverted: boolean;
  contactAt: number | null;
  offerStatus: OfferStatus | null;
  offerCreatedAt: number | null;
  dealStatus: "Won" | "In Progress" | null;
  dealAt: number | null;
  dealAmount: number | null;
  paymentReceived: boolean;
  paymentAt: number | null;
  /** Sadece ulaşılamamış + en az 1 deneme yapılmış lead'lerde. */
  dueDate: number | null;
  /** Ulaşılmış ama dönüşmemiş lead'lerde (%40 olasılık). */
  callbackDate: number | null;
  /** Sonuç/kayıp nedeni — Won'da ve hiç aranmamışta null. */
  resultReason: ResultReason | null;
  status: LeadStatus;
}

/** Speed-to-Lead kovaları — v2 4.2 (7 grup). */
export interface SpeedToLeadBucket {
  key: string;
  label: string;
  count: number;
  status: StatusLevel;
}

/** İki serili saatlik nokta — toplam vs cevaplanan (v2 4.1). */
export interface HourlyCallPoint {
  hour: string;
  total: number;
  answered: number;
}

/** Günlük arama trendi noktası — son 14 gün (v2 4.2). */
export interface DailyTrendPoint {
  day: string;
  total: number;
  answered: number;
}

/** Saatlik ulaşım oranı noktası (v2 4.2). */
export interface HourlyRatePoint {
  hour: string;
  ratePct: number | null;
}

/** Tam funnel aşaması — adet + önceki aşamaya göre % + lead'e göre % (v2 4.3). */
export interface FunnelStageFull {
  key: string;
  label: string;
  count: number;
  prevPct: number | null;
  leadPct: number;
}

/** Kaynak/ülke/dil dönüşüm satırı (v2 4.3). */
export interface ConversionRow {
  group: string;
  leads: number;
  deals: number;
  ratePct: number;
}

/** Hedef tempo grafiği noktası — gün bazlı birikimli (v2 4.7). */
export interface PacePoint {
  day: string;
  /** Ay başından o güne birikimli satış (gelecek günler için null). */
  actualEUR: number | null;
  /** Doğrusal hedef temposu. */
  targetEUR: number;
}

/** Kalite trend noktası — agent vs takım ortalaması (v2 4.5). */
export interface QualityPoint {
  day: string;
  agent: number;
  team: number;
}

/** Vardiya günü — v2 4.6 tablosu. */
export interface ShiftDay {
  date: string;
  plannedIn: string;
  actualIn: string;
  plannedOut: string;
  actualOut: string;
  lateMinutes: number;
  breakMinutes: number;
  workedHours: number;
}

/** Follow-up tablosu satırı — v2 4.4 (Lead'den türetilir). */
export interface FollowUpRow {
  id: string;
  priority: LeadPriority;
  name: string;
  phone: string;
  country: string;
  language: string;
  source: string;
  createdAtISO: string;
  lastCallISO: string | null;
  attempts: number;
  resultCode: string;
  status: LeadStatus;
  dueISO: string | null;
  callbackISO: string | null;
  offer: string;
  deal: string;
  nextAction: string;
}
