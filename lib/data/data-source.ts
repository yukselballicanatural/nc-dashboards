"use client";

import type { RegionTeamRecord } from "@/lib/mock/region-data";
import { REGION_TEAM_RECORDS } from "@/lib/mock/region-data";
import { useDataset } from "./dataset-store";

/**
 * Aktif veri kaynağı çözümleyici — panellerin okuduğu tek nokta.
 * Yüklenmiş Excel verisi varsa onu, yoksa seed (mock) veriyi döndürür.
 */

export interface DatasetMeta {
  source: "excel" | "seed";
  uploadedAt: number | null;
  fileName: string | null;
  stats: { teams: number; agents: number; leads: number };
}

/** Bölge (tüm org) kayıtları — yüklü veri ya da seed. */
export function useActiveRegionRecords(): RegionTeamRecord[] {
  const ds = useDataset();
  return ds?.teams ?? REGION_TEAM_RECORDS;
}

/** Aktif veri setinin meta bilgisi (kaynak, yükleme zamanı, sayımlar). */
export function useDatasetMeta(): DatasetMeta {
  const ds = useDataset();
  if (ds) {
    return {
      source: "excel",
      uploadedAt: ds.uploadedAt,
      fileName: ds.fileName,
      stats: ds.stats,
    };
  }
  const agents = REGION_TEAM_RECORDS.reduce((s, t) => s + t.agents.length, 0);
  const leads = REGION_TEAM_RECORDS.reduce(
    (s, t) => s + t.agents.reduce((a, ag) => a + ag.leads.length, 0),
    0,
  );
  return {
    source: "seed",
    uploadedAt: null,
    fileName: null,
    stats: { teams: REGION_TEAM_RECORDS.length, agents, leads },
  };
}
