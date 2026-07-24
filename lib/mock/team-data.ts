/**
 * Takım agent verisi — roster'daki her agent için lead üretimi.
 * Callum Ashford'un dizisi, üretim parametreleri Agent panelindekiyle birebir
 * aynı olduğu için `datasets.ts`'teki `LEADS` ile bit-bit eşittir.
 */

import type { Lead } from "@/lib/types/agent-data";
import type { TeamAgentProfile } from "@/lib/types/team-data";
import { generateLeadsFor } from "./lead-engine";
import { TEAM_NAME, TEAM_ROSTER } from "./team-roster";

export interface TeamAgentRecord extends TeamAgentProfile {
  leads: Lead[];
}

export { TEAM_NAME };

export const TEAM_AGENTS: TeamAgentRecord[] = TEAM_ROSTER.map((entry) => ({
  id: entry.id,
  name: entry.name,
  role: entry.role,
  leads: generateLeadsFor(entry.genParams),
}));
