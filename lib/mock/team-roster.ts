/**
 * Takım rosteri — Aamir Ali Team (CLAUDE.md v2 5.5 referansı: Callum Ashford
 * dahil 12 agent). Callum'un kendi verisi `datasets.ts`'teki mevcut `LEADS`
 * ile birebir aynı üretim parametrelerinden (SEED, LEAD_COUNT) türer — Agent
 * panelindeki sayılar bu panelde de değişmeden görünür.
 *
 * Diğer 11 agent, aynı üretim motorunun (lead-engine.ts) farklı olasılık
 * parametreleriyle çalıştırılmasıyla oluşur: 3 güçlü, 4 ortalama, 4 gelişmeli
 * performans profili — Best5/Worst5 ve ısı haritası gibi karşılaştırmalı
 * görünümlerin gerçekçi bir dağılım üzerinde anlamlı olması için.
 */

import type { AgentGenParams } from "./lead-engine";
import { SEED, LEAD_COUNT } from "./lead-engine";

export const TEAM_NAME = "Aamir Ali Team";

export interface TeamRosterEntry {
  id: string;
  name: string;
  role: "Senior" | "Junior";
  genParams: AgentGenParams;
}

export const TEAM_ROSTER: TeamRosterEntry[] = [
  // Referans agent — Agent panelindeki Callum ile bit-bit aynı üretim.
  {
    id: "agent-callum-ashford",
    name: "Callum Ashford",
    role: "Senior",
    genParams: { seed: SEED, leadCount: LEAD_COUNT, idPrefix: "LD" },
  },

  /* ---------------------------- Güçlü (3) ---------------------------- */
  {
    id: "agent-elif-demirtas",
    name: "Elif Demirtaş",
    role: "Senior",
    genParams: {
      seed: 30_101, leadCount: 145, idPrefix: "ED",
      answerChance: 0.42, neverCalledChance: 0.03, delayMultiplier: 0.55,
      convertChance: 0.68, offerChance: 0.72, dealAdvanceChance: 0.5,
      wonChance: 0.68, paymentChance: 0.88,
    },
  },
  {
    id: "agent-marco-ferretti",
    name: "Marco Ferretti",
    role: "Senior",
    genParams: {
      seed: 30_102, leadCount: 138, idPrefix: "MF",
      answerChance: 0.41, neverCalledChance: 0.04, delayMultiplier: 0.6,
      convertChance: 0.66, offerChance: 0.7, dealAdvanceChance: 0.48,
      wonChance: 0.66, paymentChance: 0.86,
    },
  },
  {
    id: "agent-priya-nair",
    name: "Priya Nair",
    role: "Senior",
    genParams: {
      seed: 30_103, leadCount: 150, idPrefix: "PN",
      answerChance: 0.44, neverCalledChance: 0.03, delayMultiplier: 0.5,
      convertChance: 0.7, offerChance: 0.74, dealAdvanceChance: 0.52,
      wonChance: 0.7, paymentChance: 0.9,
    },
  },

  /* --------------------------- Ortalama (4) --------------------------- */
  {
    id: "agent-tobias-reinholt",
    name: "Tobias Reinholt",
    role: "Senior",
    genParams: {
      seed: 30_201, leadCount: 125, idPrefix: "TR",
      answerChance: 0.34, neverCalledChance: 0.07, delayMultiplier: 0.95,
      convertChance: 0.56, offerChance: 0.6, dealAdvanceChance: 0.36,
      wonChance: 0.56, paymentChance: 0.78,
    },
  },
  {
    id: "agent-fatima-zahra",
    name: "Fatima Zahra",
    role: "Junior",
    genParams: {
      seed: 30_202, leadCount: 110, idPrefix: "FZ",
      answerChance: 0.3, neverCalledChance: 0.1, delayMultiplier: 1.05,
      convertChance: 0.5, offerChance: 0.55, dealAdvanceChance: 0.32,
      wonChance: 0.52, paymentChance: 0.74,
    },
  },
  {
    id: "agent-lukas-beranek",
    name: "Lukas Beránek",
    role: "Senior",
    genParams: {
      seed: 30_203, leadCount: 120, idPrefix: "LB",
      answerChance: 0.36, neverCalledChance: 0.06, delayMultiplier: 0.9,
      convertChance: 0.58, offerChance: 0.63, dealAdvanceChance: 0.38,
      wonChance: 0.58, paymentChance: 0.8,
    },
  },
  {
    id: "agent-noora-salminen",
    name: "Noora Salminen",
    role: "Junior",
    genParams: {
      seed: 30_204, leadCount: 105, idPrefix: "NS",
      answerChance: 0.29, neverCalledChance: 0.11, delayMultiplier: 1.1,
      convertChance: 0.48, offerChance: 0.52, dealAdvanceChance: 0.3,
      wonChance: 0.5, paymentChance: 0.72,
    },
  },

  /* -------------------------- Gelişmeli (4) --------------------------- */
  {
    id: "agent-diego-alcantara",
    name: "Diego Alcántara",
    role: "Junior",
    genParams: {
      seed: 30_301, leadCount: 95, idPrefix: "DA",
      answerChance: 0.22, neverCalledChance: 0.18, delayMultiplier: 1.7,
      convertChance: 0.4, offerChance: 0.45, dealAdvanceChance: 0.2,
      wonChance: 0.4, paymentChance: 0.6,
    },
  },
  {
    id: "agent-yara-khoury",
    name: "Yara Khoury",
    role: "Junior",
    genParams: {
      seed: 30_302, leadCount: 90, idPrefix: "YK",
      answerChance: 0.2, neverCalledChance: 0.22, delayMultiplier: 2.0,
      convertChance: 0.36, offerChance: 0.42, dealAdvanceChance: 0.18,
      wonChance: 0.38, paymentChance: 0.58,
    },
  },
  {
    id: "agent-milan-kovac",
    name: "Milan Kovač",
    role: "Junior",
    genParams: {
      seed: 30_303, leadCount: 100, idPrefix: "MK",
      answerChance: 0.24, neverCalledChance: 0.16, delayMultiplier: 1.5,
      convertChance: 0.42, offerChance: 0.47, dealAdvanceChance: 0.22,
      wonChance: 0.42, paymentChance: 0.62,
    },
  },
  {
    id: "agent-grace-okafor",
    name: "Grace Okafor",
    role: "Junior",
    genParams: {
      seed: 30_304, leadCount: 92, idPrefix: "GO",
      answerChance: 0.18, neverCalledChance: 0.25, delayMultiplier: 2.3,
      convertChance: 0.33, offerChance: 0.38, dealAdvanceChance: 0.15,
      wonChance: 0.35, paymentChance: 0.55,
    },
  },
];
