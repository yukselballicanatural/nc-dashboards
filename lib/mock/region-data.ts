/**
 * Bölge agent verisi — roster'daki her takımın her danışmanı için lead üretimi.
 * Aamir Ali Team'in kayıtları, üretim parametreleri Takım Lideri panelindekiyle
 * aynı olduğu için `team-data.ts`'teki `TEAM_AGENTS` ile bit-bit eşittir.
 */

import type { Lead } from "@/lib/types/agent-data";
import { generateLeadsFor } from "./lead-engine";
import { REGION_NAME, REGION_TEAMS } from "./region-roster";

export interface RegionAgentRecord {
  id: string;
  name: string;
  role: "Senior" | "Junior";
  leads: Lead[];
}

export interface RegionTeamRecord {
  teamId: string;
  teamName: string;
  teamLeaderName: string;
  location: string;
  agents: RegionAgentRecord[];
}

export { REGION_NAME };

export const REGION_TEAM_RECORDS: RegionTeamRecord[] = REGION_TEAMS.map((team) => ({
  teamId: team.id,
  teamName: team.name,
  teamLeaderName: team.teamLeaderName,
  location: team.location,
  agents: team.roster.map((entry) => ({
    id: entry.id,
    name: entry.name,
    role: entry.role,
    leads: generateLeadsFor(entry.genParams),
  })),
}));

export const REGION_TOTAL_AGENTS = REGION_TEAM_RECORDS.reduce(
  (s, t) => s + t.agents.length,
  0,
);
