/**
 * Lead üretim motoru — CLAUDE.md v2 Bölüm 5.2.
 * Sabit seed + sabit "şimdi" (MOCK_NOW) ile deterministik üretim:
 * SSR ve CSR aynı veriyi görür, ekran görüntüleri/QA tutarlı kalır.
 * SLA eşiği bu projede 15 dakikadır (v2 Bölüm 5 girişi).
 */

import { Rng } from "./seeded-random";
import type { Lead, LeadCall, LeadStatus, OfferStatus, ResultReason } from "@/lib/types/agent-data";

/** Mock saat — gerçek saate bağlanmaz (deterministik türetimler için). */
export const MOCK_NOW = Date.parse("2026-08-04T12:00:00+03:00");

export const MINUTE = 60_000;
export const HOUR = 3_600_000;
export const DAY = 86_400_000;

/** 15 dakikalık SLA eşiği (ms). */
export const SLA_MS = 15 * MINUTE;

export const SEED = 20_260_714;
export const LEAD_COUNT = 130;
const LOOKBACK_DAYS = 30;
const ID_START = 1000;

// Referans prototipe paralel çok uluslu isim havuzu.
const FIRST_NAMES = [
  "Hans", "Pierre", "Ahmed", "Thomas", "Irina", "Nina", "Laura", "Youssef",
  "Marc", "Sofia", "Anna", "Marco", "Elena", "Julia", "Chiara", "James",
  "Sean", "Hana", "Diego", "Lucia", "Jonas", "Katrin", "Emma", "Oliver",
] as const;

const LAST_NAMES = [
  "Müller", "Conti", "Schmidt", "Bianchi", "García", "Dubois", "Rossi",
  "Novak", "Ivanov", "Fischer", "Moreau", "Weber", "Hartley", "Lancaster",
  "Whitfield", "Bakker", "Fernández", "Ricci",
] as const;

/** [ülke, dil, telefon öneki, ağırlık] */
const GEOS: ReadonlyArray<readonly [string, string, string, number]> = [
  ["İngiltere", "English", "+44 79", 26],
  ["Almanya", "German", "+49 15", 16],
  ["Fransa", "French", "+33 6", 12],
  ["İtalya", "Italian", "+39 33", 12],
  ["İspanya", "Spanish", "+34 6", 10],
  ["Rusya", "Russian", "+7 9", 8],
  ["Türkiye", "Turkish", "+90 53", 10],
  ["Fas", "Arabic", "+212 6", 6],
];

const SOURCES: ReadonlyArray<readonly [string, number]> = [
  ["Meta Ads", 32],
  ["Google Ads", 24],
  ["Instagram", 18],
  ["TikTok", 10],
  ["Website", 10],
  ["Referans", 6],
];

// Referans prototipteki sonuç kodları.
const ANSWERED_CODES = [
  "Answered - Interested",
  "Answered - Not Interested",
] as const;
const MISSED_CODES = [
  "No Answer",
  "Busy",
  "Voicemail",
  "Wrong Number",
] as const;

/**
 * İlk arama gecikmesi (dakika) — Speed-to-Lead dağılımını (v2 4.2) ve
 * ~%86,5 15dk SLA uyumunu (v2 5.5) besleyen ağırlıklı kovalar.
 */
const FIRST_CALL_DELAY: ReadonlyArray<readonly [[number, number], number]> = [
  [[1, 5], 52],
  [[6, 15], 34],
  [[16, 30], 6],
  [[31, 60], 3],
  [[61, 180], 2],
  [[181, 1440], 2],
  [[1441, 4320], 1],
];

function buildCalls(
  rng: Rng,
  createdAt: number,
  answerChance: number,
  delayMultiplier: number,
): LeadCall[] {
  const calls: LeadCall[] = [];
  const attempts = rng.int(1, 6);
  const [delayMin, delayMax] = rng.weighted(FIRST_CALL_DELAY);
  let time = createdAt + rng.range(delayMin, delayMax) * delayMultiplier * MINUTE;

  for (let i = 0; i < attempts && time <= MOCK_NOW; i++) {
    const answered = rng.chance(answerChance);
    calls.push({
      time,
      answered,
      resultCode: answered ? rng.pick(ANSWERED_CODES) : rng.pick(MISSED_CODES),
      // Cevaplanan çağrıda gerçekçi konuşma süresi (sn); cevaplanmayanda 0.
      talkSec: answered ? rng.weighted<number>([[45, 20], [120, 34], [240, 28], [420, 12], [720, 6]]) : 0,
    });
    if (answered) break; // ulaşıldıysa yeni deneme açılmaz
    time += rng.range(4 * HOUR, 2.5 * DAY);
  }
  return calls;
}

function deriveStatus(lead: Omit<Lead, "status">): LeadStatus {
  if (lead.isConverted) return "Convert to Contact";
  if (lead.attemptCount === 0) return "New Lead";
  if (lead.dueDate !== null && lead.dueDate < MOCK_NOW) return "Overdue Lead";
  if (!lead.reached && lead.attemptCount >= 4) return "No Response";
  if (lead.reached) return "Waiting for Contact Info";
  return "Returning Lead";
}

/**
 * Bir agent'ın lead üretimini yöneten olasılık parametreleri. Varsayılanlar
 * (v2 5.2'deki referans agent Callum Ashford'un sabit değerleridir); Team
 * Leader fazında her agent için bu parametreler tek tek ayarlanarak
 * gerçekçi bir güçlü/ortalama/gelişmeli performans dağılımı üretilir.
 */
export interface AgentGenParams {
  /** Deterministik üretim için sabit seed — agent başına benzersiz. */
  seed: number;
  leadCount?: number;
  /** Her arama denemesinde cevaplanma olasılığı (varsayılan 0.32). */
  answerChance?: number;
  /** Hiç aranmama olasılığı (varsayılan 0.08). */
  neverCalledChance?: number;
  /** İlk arama gecikmesi çarpanı — >1 daha yavaş, <1 daha hızlı (varsayılan 1). */
  delayMultiplier?: number;
  /** Ulaşılan lead'in contact'a dönüşme olasılığı (varsayılan 0.55). */
  convertChance?: number;
  /** Contact'ın offer sürecine girme olasılığı (varsayılan 0.6). */
  offerChance?: number;
  /** Zayıf offer statülerinin de deal'a ilerleme olasılığı (varsayılan 0.35). */
  dealAdvanceChance?: number;
  /** Deal'ın Won kapanma olasılığı (varsayılan 0.55). */
  wonChance?: number;
  /** Won deal'in ödeme alma olasılığı (varsayılan 0.75). */
  paymentChance?: number;
  /** Lead ID öneki — birden çok agent birleştirilince ID çakışmasın (varsayılan "LD"). */
  idPrefix?: string;
}

export function generateLeadsFor(params: AgentGenParams): Lead[] {
  const {
    seed,
    leadCount = LEAD_COUNT,
    answerChance = 0.32,
    neverCalledChance = 0.08,
    delayMultiplier = 1,
    convertChance = 0.55,
    offerChance = 0.6,
    dealAdvanceChance = 0.35,
    wonChance = 0.55,
    paymentChance = 0.75,
    idPrefix = "LD",
  } = params;

  const rng = new Rng(seed);
  const leads: Lead[] = [];

  for (let i = 0; i < leadCount; i++) {
    const createdAt = MOCK_NOW - rng.range(0, LOOKBACK_DAYS) * DAY;
    const [country, language, phonePrefix] = rng.weighted(
      GEOS.map(([c, l, p, w]) => [[c, l, p] as const, w] as const),
    );
    const name = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
    const phone = `${phonePrefix}${rng.int(10, 99)} ${rng.int(100, 999)} ${rng.int(100, 999)}`;
    const source = rng.weighted(SOURCES);

    const calls = rng.chance(neverCalledChance)
      ? []
      : buildCalls(rng, createdAt, answerChance, delayMultiplier);
    const reached = calls.some((c) => c.answered);
    const firstAnswered = calls.find((c) => c.answered) ?? null;

    const isConverted = reached && rng.chance(convertChance);
    const contactAt =
      isConverted && firstAnswered
        ? Math.min(firstAnswered.time + rng.range(0, 1 * DAY), MOCK_NOW)
        : null;

    let offerStatus: OfferStatus | null = null;
    let offerCreatedAt: number | null = null;
    if (isConverted && contactAt !== null && rng.chance(offerChance)) {
      offerStatus = rng.weighted<OfferStatus>([
        ["Offer Created", 40],
        ["Offer Shared", 35],
        ["Offer Accepted", 15],
        ["Willing to Close", 10],
      ]);
      offerCreatedAt = Math.min(contactAt + rng.range(0, 2 * DAY), MOCK_NOW);
    }

    // Deal: Accepted/Willing offer'lardan (+dealAdvanceChance ile diğerlerinden)
    let dealStatus: Lead["dealStatus"] = null;
    let dealAt: number | null = null;
    let dealAmount: number | null = null;
    let paymentReceived = false;
    let paymentAt: number | null = null;

    if (offerStatus !== null && offerCreatedAt !== null) {
      const advanced =
        offerStatus === "Offer Accepted" || offerStatus === "Willing to Close";
      if (advanced || rng.chance(dealAdvanceChance)) {
        dealStatus = rng.chance(wonChance) ? "Won" : "In Progress";
        dealAt = Math.min(offerCreatedAt + rng.range(0, 3 * DAY), MOCK_NOW);
        // Deal açıldıysa offer aşaması fiilen Accepted/Willing'e ilerlemiştir
        // (funnel monotonluğu — görsel tutarlılık için).
        if (!advanced) {
          offerStatus = rng.chance(0.6) ? "Offer Accepted" : "Willing to Close";
        }
        if (dealStatus === "Won") {
          dealAmount = rng.int(36, 150) * 50; // 1800-7500 € (v2 5.2)
          if (rng.chance(paymentChance)) {
            paymentReceived = true;
            paymentAt = Math.min(dealAt + rng.range(0, 4 * DAY), MOCK_NOW);
          }
        }
      }
    }

    // Takip alanları (v2 5.2)
    const dueDate =
      !reached && calls.length > 0
        ? MOCK_NOW + rng.range(-2, 35) * DAY
        : null;
    const callbackDate =
      reached && !isConverted && rng.chance(0.4)
        ? MOCK_NOW + rng.range(0, 3) * DAY
        : null;

    // Sonuç/kayıp nedeni — Zoho "Sales Opportunity Result" kırılımını besler.
    let resultReason: ResultReason | null = null;
    if (dealStatus === "Won") {
      resultReason = null; // kazanıldı — kayıp değil
    } else if (calls.length === 0) {
      resultReason = null; // hiç aranmadı — henüz sonuç yok (backlog'da sayılır)
    } else if (!reached) {
      resultReason = rng.weighted<ResultReason>([
        ["No Response", 48],
        ["No Answer", 34],
        ["Wrong Contact Info", 18],
      ]);
    } else if (isConverted) {
      resultReason = "Interested"; // hâlâ açık fırsat
    } else {
      resultReason = rng.weighted<ResultReason>([
        ["Not Interested", 30],
        ["Budget Issue", 22],
        ["Chose Another Provider", 16],
        ["Not Eligible", 12],
        ["Already Treated", 8],
        ["Language Barrier", 7],
        ["No Response", 5],
      ]);
    }

    const base = {
      id: `${idPrefix}-${ID_START + i}`,
      name,
      phone,
      country,
      language,
      source,
      createdAt,
      calls,
      attemptCount: calls.length,
      reached,
      isConverted,
      contactAt,
      offerStatus,
      offerCreatedAt,
      dealStatus,
      dealAt,
      dealAmount,
      paymentReceived,
      paymentAt,
      dueDate,
      callbackDate,
      resultReason,
    };

    leads.push({ ...base, status: deriveStatus(base) });
  }

  return leads;
}

/** Referans agent (Callum Ashford) — sabit seed/parametreler, davranış değişmedi. */
export function generateLeads(): Lead[] {
  return generateLeadsFor({ seed: SEED, leadCount: LEAD_COUNT });
}
