/**
 * Bölge rosteri — Avrupa Bölgesi'ndeki tüm takımlar (Bölge Müdürü görünümü).
 * Hiyerarşi: Bölge Müdürü → Takım Liderleri → danışmanlar.
 *
 * 1. takım (Aamir Ali Team) mevcut `TEAM_ROSTER`'ı birebir kullanır — böylece
 * hem Takım Lideri panelinde hem Bölge panelinde AYNI sayılar görünür.
 * Diğer 3 takım, aynı üretim motorunun (lead-engine.ts) takım-profiline göre
 * ayarlanmış parametreleriyle üretilir: güçlü / ortalama / gelişmeli takımlar —
 * bölge içi takım karşılaştırmasının anlamlı bir dağılıma oturması için.
 */

import type { AgentGenParams } from "./lead-engine";
import { TEAM_NAME, TEAM_ROSTER, type TeamRosterEntry } from "./team-roster";

export const REGION_NAME = "Avrupa Bölgesi";

export interface RegionTeam {
  id: string;
  name: string;
  teamLeaderName: string;
  location: string;
  /** Takımın performans karakteri — profil taban parametreleri buradan gelir. */
  tier: "strong" | "average" | "developing";
  roster: TeamRosterEntry[];
}

type TierParams = Required<
  Omit<AgentGenParams, "seed" | "idPrefix" | "leadCount">
>;

const TIER_BASE: Record<RegionTeam["tier"], TierParams> = {
  strong: {
    answerChance: 0.4, neverCalledChance: 0.04, delayMultiplier: 0.62,
    convertChance: 0.66, offerChance: 0.7, dealAdvanceChance: 0.48,
    wonChance: 0.66, paymentChance: 0.86,
  },
  average: {
    answerChance: 0.33, neverCalledChance: 0.08, delayMultiplier: 0.95,
    convertChance: 0.55, offerChance: 0.6, dealAdvanceChance: 0.36,
    wonChance: 0.56, paymentChance: 0.78,
  },
  developing: {
    answerChance: 0.23, neverCalledChance: 0.16, delayMultiplier: 1.6,
    convertChance: 0.41, offerChance: 0.46, dealAdvanceChance: 0.24,
    wonChance: 0.42, paymentChance: 0.62,
  },
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Takım profilinden, index'e göre deterministik küçük sapmalarla agent üretim
 * parametreleri türetir — takım içi gerçekçi bir performans yelpazesi oluşur
 * (Math.random YOK; sapma tamamen index'e bağlı → SSR/CSR tutarlı).
 */
function agentParams(
  tier: RegionTeam["tier"],
  seed: number,
  idPrefix: string,
  index: number,
): AgentGenParams {
  const base = TIER_BASE[tier];
  const d = (index % 5) - 2; // -2 .. +2
  return {
    seed,
    idPrefix,
    leadCount: 100 + ((index * 7) % 46), // 100-145
    answerChance: clamp(base.answerChance + d * 0.015, 0.14, 0.5),
    neverCalledChance: clamp(base.neverCalledChance - d * 0.01, 0.02, 0.3),
    delayMultiplier: Math.max(0.4, base.delayMultiplier + d * 0.12),
    convertChance: clamp(base.convertChance + d * 0.02, 0.28, 0.75),
    offerChance: clamp(base.offerChance + d * 0.02, 0.3, 0.78),
    dealAdvanceChance: clamp(base.dealAdvanceChance + d * 0.015, 0.12, 0.55),
    wonChance: clamp(base.wonChance + d * 0.02, 0.3, 0.72),
    paymentChance: clamp(base.paymentChance + d * 0.015, 0.5, 0.92),
  };
}

/** Bir takımın danışman roster'ını isim listesinden deterministik üretir. */
function buildRoster(
  teamKey: string,
  tier: RegionTeam["tier"],
  seedBase: number,
  members: Array<{ name: string; role: "Senior" | "Junior" }>,
): TeamRosterEntry[] {
  return members.map((m, i) => ({
    id: `agent-${teamKey}-${i}`,
    name: m.name,
    role: m.role,
    genParams: agentParams(tier, seedBase + i, `${teamKey.toUpperCase()}${i}`, i),
  }));
}

/* ---- Üretilen takımlar için isim havuzları (el yazımı takımlardan farklı) --- */
const FIRSTS = [
  "Lucas", "Mia", "Noah", "Sofía", "Liam", "Aylin", "Ethan", "Zeynep", "Mason",
  "Zoë", "Leo", "Ada", "Hugo", "Nil", "Felix", "Derya", "Arda", "Clara", "Milo",
  "Ela", "Kaan", "Iris", "Efe", "Lara", "Boran", "Maya", "Toprak", "Naz", "Emir",
  "Su", "Alp", "Defne", "Kerem", "Yağmur", "Berk", "Ceren", "Ozan", "Melis",
  "Sinan", "Ayla", "Doruk", "Ece", "Timur", "Rana",
] as const;

const LASTS = [
  "Yıldız", "Şahin", "Çelik", "Doğan", "Erdem", "Koç", "Kurt", "Aksu", "Taş",
  "Bulut", "Güneş", "Ünal", "Polat", "Acar", "Tekin", "Bayram", "Sarı",
  "Korkmaz", "Weber", "Klein", "Meyer", "Vogel", "Brandt", "Keller", "Hoffmann",
  "Roth", "Lang", "Braun", "Werner", "Kühn", "Schulz", "Böhm", "Frank", "Sommer",
  "Winter", "Busch", "Vega", "Marino", "Petit", "Moreau",
] as const;

/** Global index'ten deterministik, çakışmayan "Ad Soyad" üretir. */
function nameAt(globalIndex: number): string {
  const first = FIRSTS[globalIndex % FIRSTS.length];
  const last = LASTS[Math.floor(globalIndex / FIRSTS.length) % LASTS.length];
  return `${first} ${last}`;
}

/**
 * İsim havuzundan deterministik roster üretir — büyük takımları elle isim
 * yazmadan doldurmak için. `nameOffset` takımlar arası isim çakışmasını önler;
 * her 3. danışman Senior (gerçekçi kıdem dağılımı).
 */
function buildGeneratedRoster(
  teamKey: string,
  tier: RegionTeam["tier"],
  seedBase: number,
  count: number,
  nameOffset: number,
): TeamRosterEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `agent-${teamKey}-${i}`,
    name: nameAt(nameOffset + i),
    role: (i % 3 === 0 ? "Senior" : "Junior") as "Senior" | "Junior",
    genParams: agentParams(tier, seedBase + i, `${teamKey.toUpperCase()}${i}`, i),
  }));
}

export const REGION_TEAMS: RegionTeam[] = [
  {
    id: "team-aamir-ali",
    name: TEAM_NAME,
    teamLeaderName: "Aamir Ali",
    location: "İstanbul",
    tier: "average",
    roster: TEAM_ROSTER,
  },
  {
    id: "team-sofia-marchetti",
    name: "Sofia Marchetti Team",
    teamLeaderName: "Sofia Marchetti",
    location: "İstanbul",
    tier: "strong",
    roster: buildRoster("sm", "strong", 31_000, [
      { name: "Lena Hofmann", role: "Senior" },
      { name: "Paolo Greco", role: "Senior" },
      { name: "Amara Okonkwo", role: "Senior" },
      { name: "Ravi Kapoor", role: "Senior" },
      { name: "Sophie Laurent", role: "Senior" },
      { name: "Mehmet Aslan", role: "Junior" },
      { name: "Ingrid Larsen", role: "Senior" },
      { name: "Tomás Herrera", role: "Junior" },
      { name: "Aisha Rahman", role: "Senior" },
      { name: "Daniel Fischer", role: "Junior" },
      { name: "Zara Ahmed", role: "Junior" },
    ]),
  },
  {
    id: "team-viktor-petrov",
    name: "Viktor Petrov Team",
    teamLeaderName: "Viktor Petrov",
    location: "İstanbul",
    tier: "average",
    roster: buildRoster("vp", "average", 32_000, [
      { name: "Nikolai Sokolov", role: "Senior" },
      { name: "Emma Wright", role: "Senior" },
      { name: "Carlos Méndez", role: "Junior" },
      { name: "Fatih Yılmaz", role: "Senior" },
      { name: "Julia Kowalski", role: "Junior" },
      { name: "Hassan Ali", role: "Junior" },
      { name: "Marta Silva", role: "Senior" },
      { name: "Kevin O'Brien", role: "Junior" },
      { name: "Nadia Petrova", role: "Senior" },
      { name: "Bruno Costa", role: "Junior" },
      { name: "Selin Demir", role: "Junior" },
    ]),
  },
  {
    id: "team-leyla-kaya",
    name: "Leyla Kaya Team",
    teamLeaderName: "Leyla Kaya",
    location: "İstanbul",
    tier: "developing",
    roster: buildRoster("lk", "developing", 33_000, [
      { name: "Deniz Arslan", role: "Junior" },
      { name: "Oliver Bennett", role: "Junior" },
      { name: "Rosa Jiménez", role: "Junior" },
      { name: "Kwame Mensah", role: "Junior" },
      { name: "Petra Novák", role: "Senior" },
      { name: "Can Öztürk", role: "Junior" },
      { name: "Lucia Romano", role: "Junior" },
      { name: "Adam Schmidt", role: "Junior" },
      { name: "Yasmin Farouk", role: "Junior" },
      { name: "Igor Volkov", role: "Senior" },
    ]),
  },

  /* --------- Üretilen takımlar (5-10) — toplam ~120 danışman için --------- */
  {
    id: "team-elena-rossi",
    name: "Elena Rossi Team",
    teamLeaderName: "Elena Rossi",
    location: "İstanbul",
    tier: "strong",
    roster: buildGeneratedRoster("er", "strong", 34_000, 13, 0),
  },
  {
    id: "team-marcus-bauer",
    name: "Marcus Bauer Team",
    teamLeaderName: "Marcus Bauer",
    location: "İstanbul",
    tier: "average",
    roster: buildGeneratedRoster("mb", "average", 35_000, 13, 13),
  },
  {
    id: "team-yusuf-demir",
    name: "Yusuf Demir Team",
    teamLeaderName: "Yusuf Demir",
    location: "İstanbul",
    tier: "average",
    roster: buildGeneratedRoster("yd", "average", 36_000, 13, 26),
  },
  {
    id: "team-anais-laurent",
    name: "Anaïs Laurent Team",
    teamLeaderName: "Anaïs Laurent",
    location: "İstanbul",
    tier: "developing",
    roster: buildGeneratedRoster("al", "developing", 37_000, 13, 39),
  },
  {
    id: "team-kenji-tanaka",
    name: "Kenji Tanaka Team",
    teamLeaderName: "Kenji Tanaka",
    location: "İstanbul",
    tier: "strong",
    roster: buildGeneratedRoster("kt", "strong", 38_000, 13, 52),
  },
  {
    id: "team-olga-ivanova",
    name: "Olga Ivanova Team",
    teamLeaderName: "Olga Ivanova",
    location: "İstanbul",
    tier: "developing",
    roster: buildGeneratedRoster("oi", "developing", 39_000, 13, 65),
  },
];
