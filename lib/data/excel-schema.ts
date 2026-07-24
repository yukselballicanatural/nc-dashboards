/**
 * Excel veri şeması + akıllı ayrıştırıcı (parser).
 *
 * Admin, buradaki şablona uygun bir Excel yükler; bu modül satırları okuyup
 * ANLAYIP sistemin Lead modeline dönüştürür ve org hiyerarşisini (Bölge →
 * Takım → Danışman) yeniden kurar. Flat satırlardan çağrı geçmişi (calls[])
 * sentezlenir ki SLA / saatlik / trend gibi tüm metrikler hesaplanabilsin.
 *
 * NOT: Kolon başlıkları gerçek Zoho export'unuza göre burada (COLUMNS) tek
 * yerden ayarlanabilir; ayrıştırıcı başlıkları büyük/küçük harf ve boşluk
 * duyarsız eşler, birkaç alternatif ada da izin verir.
 */

import type {
  Lead,
  LeadCall,
  LeadStatus,
  OfferStatus,
} from "@/lib/types/agent-data";
import type { RegionTeamRecord, RegionAgentRecord } from "@/lib/mock/region-data";

const HOUR = 3_600_000;
const DAY = 86_400_000;

/** Şablon kolonları — sıra + açıklama. `key` iç eşleme adı, `header` Excel başlığı. */
export interface ColumnDef {
  key: string;
  header: string;
  required: boolean;
  aliases?: string[];
  example: string;
  note: string;
}

export const COLUMNS: ColumnDef[] = [
  { key: "team", header: "Takım", required: true, aliases: ["team"], example: "Aamir Ali Team", note: "Danışmanın bağlı olduğu takım" },
  { key: "teamLeader", header: "Takım Lideri", required: true, aliases: ["team leader"], example: "Aamir Ali", note: "Takımın lideri" },
  { key: "agent", header: "Danışman", required: true, aliases: ["agent", "temsilci"], example: "Callum Ashford", note: "Lead'i yöneten danışman" },
  { key: "role", header: "Kıdem", required: false, aliases: ["role", "seviye"], example: "Senior", note: "Senior / Junior (boşsa Junior)" },
  { key: "leadId", header: "Lead ID", required: false, aliases: ["id"], example: "LD-1000", note: "Boşsa otomatik atanır" },
  { key: "name", header: "Ad Soyad", required: true, aliases: ["lead", "isim", "müşteri"], example: "Hans Müller", note: "Lead'in adı" },
  { key: "phone", header: "Telefon", required: false, aliases: ["phone", "tel"], example: "+49 15 234 567", note: "" },
  { key: "country", header: "Ülke", required: false, aliases: ["country"], example: "Almanya", note: "" },
  { key: "language", header: "Dil", required: false, aliases: ["language"], example: "German", note: "" },
  { key: "source", header: "Kaynak", required: false, aliases: ["source", "lead source"], example: "Meta Ads", note: "" },
  { key: "createdAt", header: "Oluşturma Tarihi", required: true, aliases: ["created", "created time"], example: "2026-07-14 10:30", note: "Lead'in sisteme düştüğü an" },
  { key: "firstCallAt", header: "İlk Arama Tarihi", required: false, aliases: ["first call"], example: "2026-07-14 10:40", note: "Boşsa hiç aranmamış sayılır" },
  { key: "attempts", header: "Deneme Sayısı", required: false, aliases: ["attempts", "arama sayısı"], example: "3", note: "Toplam arama denemesi" },
  { key: "reached", header: "Ulaşıldı", required: false, aliases: ["reached", "answered"], example: "E", note: "E/H — kişiye ulaşıldı mı" },
  { key: "contact", header: "Contact", required: false, aliases: ["converted", "contacted"], example: "E", note: "E/H — görüşmeye dönüştü mü" },
  { key: "offerStatus", header: "Offer Durumu", required: false, aliases: ["offer"], example: "Offer Shared", note: "Offer Created / Shared / Accepted / Willing to Close" },
  { key: "dealStatus", header: "Deal Durumu", required: false, aliases: ["deal"], example: "Won", note: "Won / In Progress (boş olabilir)" },
  { key: "dealAmount", header: "Deal Tutarı", required: false, aliases: ["amount", "tutar"], example: "4500", note: "€ (Won ise)" },
  { key: "paymentReceived", header: "Ödeme Alındı", required: false, aliases: ["payment"], example: "E", note: "E/H" },
  { key: "paymentAt", header: "Ödeme Tarihi", required: false, aliases: ["payment date"], example: "2026-07-15", note: "" },
  { key: "dueDate", header: "Due Date", required: false, aliases: ["due"], example: "2026-07-20", note: "" },
  { key: "callbackAt", header: "Callback Tarihi", required: false, aliases: ["callback"], example: "", note: "" },
];

export const REQUIRED_HEADERS = COLUMNS.filter((c) => c.required).map((c) => c.header);

const OFFER_VALUES: OfferStatus[] = [
  "Offer Created",
  "Offer Shared",
  "Offer Accepted",
  "Willing to Close",
];

/* ------------------------------ Dönüştürücüler ----------------------------- */

function normKey(s: string): string {
  return String(s).trim().toLocaleLowerCase("tr-TR");
}

function toEpoch(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number") {
    // Excel seri tarihi (1899-12-30 tabanlı)
    return Math.round((v - 25569) * 86400 * 1000);
  }
  const t = Date.parse(String(v));
  return Number.isNaN(t) ? null : t;
}

function toBool(v: unknown): boolean {
  const s = normKey(String(v ?? ""));
  return ["e", "evet", "true", "1", "yes", "y", "x", "var"].includes(s);
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parseOffer(v: unknown): OfferStatus | null {
  const s = normKey(String(v ?? ""));
  if (!s) return null;
  return OFFER_VALUES.find((o) => normKey(o) === s || s.includes(normKey(o))) ?? null;
}

function parseDeal(v: unknown): Lead["dealStatus"] {
  const s = normKey(String(v ?? ""));
  if (!s) return null;
  if (s.includes("won") || s.includes("kazan")) return "Won";
  if (s.includes("progress") || s.includes("devam") || s.includes("süre")) return "In Progress";
  return null;
}

function parseRole(v: unknown): "Senior" | "Junior" {
  return normKey(String(v ?? "")).startsWith("sen") ? "Senior" : "Junior";
}

/** Flat satırdan çağrı geçmişi sentezler (SLA/saatlik/trend metrikleri için). */
function synthCalls(createdAt: number, firstCallAt: number | null, attempts: number, reached: boolean): LeadCall[] {
  const n = Math.max(reached ? 1 : 0, attempts, firstCallAt !== null ? 1 : 0);
  if (n === 0) return [];
  const start = firstCallAt ?? createdAt + HOUR;
  const calls: LeadCall[] = [];
  for (let i = 0; i < n; i++) {
    const answered = reached && i === n - 1;
    calls.push({
      time: start + i * 6 * HOUR,
      answered,
      resultCode: answered ? "Answered - Interested" : "No Answer",
      talkSec: answered ? 180 : 0,
    });
  }
  return calls;
}

function deriveStatus(l: Omit<Lead, "status">, now: number): LeadStatus {
  if (l.isConverted) return "Convert to Contact";
  if (l.attemptCount === 0) return "New Lead";
  if (l.dueDate !== null && l.dueDate < now) return "Overdue Lead";
  if (!l.reached && l.attemptCount >= 4) return "No Response";
  if (l.reached) return "Waiting for Contact Info";
  return "Returning Lead";
}

export interface ParseResult {
  ok: boolean;
  teams: RegionTeamRecord[];
  stats: { teams: number; agents: number; leads: number };
  errors: string[];
  missingHeaders: string[];
}

type RawRow = Record<string, unknown>;

/**
 * sheet_to_json çıktısını (başlık→değer nesneleri) org kayıtlarına dönüştürür.
 */
export function parseRows(rows: RawRow[]): ParseResult {
  const errors: string[] = [];
  if (rows.length === 0) {
    return { ok: false, teams: [], stats: { teams: 0, agents: 0, leads: 0 }, errors: ["Dosyada veri satırı bulunamadı."], missingHeaders: [] };
  }

  // Başlık eşleme haritası: normalized header → columnKey
  const present = Object.keys(rows[0]);
  const headerToKey = new Map<string, string>();
  for (const col of COLUMNS) {
    const candidates = [col.header, ...(col.aliases ?? [])].map(normKey);
    const match = present.find((h) => candidates.includes(normKey(h)));
    if (match) headerToKey.set(col.key, match);
  }

  const missingHeaders = COLUMNS.filter((c) => c.required && !headerToKey.has(c.key)).map((c) => c.header);
  if (missingHeaders.length > 0) {
    return {
      ok: false,
      teams: [],
      stats: { teams: 0, agents: 0, leads: 0 },
      errors: [`Zorunlu kolon(lar) eksik: ${missingHeaders.join(", ")}`],
      missingHeaders,
    };
  }

  const get = (row: RawRow, key: string): unknown => {
    const h = headerToKey.get(key);
    return h ? row[h] : undefined;
  };

  const now = Date.now();
  // Takım → (Danışman → leads)
  const teamMap = new Map<string, { leader: string; agents: Map<string, { role: "Senior" | "Junior"; leads: Lead[] }> }>();
  let leadCounter = 1000;
  let leadCount = 0;

  rows.forEach((row, idx) => {
    const rowNo = idx + 2; // Excel'de başlık 1. satır
    const teamName = String(get(row, "team") ?? "").trim();
    const agentName = String(get(row, "agent") ?? "").trim();
    const leadName = String(get(row, "name") ?? "").trim();
    const createdAt = toEpoch(get(row, "createdAt"));

    if (!teamName || !agentName || !leadName) {
      if (errors.length < 20) errors.push(`Satır ${rowNo}: Takım / Danışman / Ad Soyad boş olamaz — atlandı.`);
      return;
    }
    if (createdAt === null) {
      if (errors.length < 20) errors.push(`Satır ${rowNo}: Oluşturma Tarihi okunamadı — atlandı.`);
      return;
    }

    const attempts = Math.round(toNum(get(row, "attempts")));
    const firstCallAt = toEpoch(get(row, "firstCallAt"));
    const reached = toBool(get(row, "reached"));
    const calls = synthCalls(createdAt, firstCallAt, attempts, reached);
    const actuallyReached = calls.some((c) => c.answered);
    const firstAnswered = calls.find((c) => c.answered) ?? null;

    const isConverted = toBool(get(row, "contact")) && actuallyReached;
    const contactAt = isConverted ? (firstAnswered?.time ?? createdAt + DAY) : null;

    const offerStatus = parseOffer(get(row, "offerStatus"));
    const offerCreatedAt = offerStatus !== null ? contactAt ?? createdAt + DAY : null;

    const dealStatus = parseDeal(get(row, "dealStatus"));
    const dealAt = dealStatus !== null ? offerCreatedAt ?? contactAt ?? createdAt + 2 * DAY : null;
    const dealAmount = dealStatus === "Won" ? Math.round(toNum(get(row, "dealAmount"))) || null : null;
    const paymentReceived = dealStatus === "Won" && toBool(get(row, "paymentReceived"));
    const paymentAt = paymentReceived ? toEpoch(get(row, "paymentAt")) ?? dealAt : null;

    const dueDate = toEpoch(get(row, "dueDate"));
    const callbackDate = toEpoch(get(row, "callbackAt"));

    const idRaw = String(get(row, "leadId") ?? "").trim();
    const base = {
      id: idRaw || `LD-${leadCounter++}`,
      name: leadName,
      phone: String(get(row, "phone") ?? "").trim() || "—",
      country: String(get(row, "country") ?? "").trim() || "Bilinmiyor",
      language: String(get(row, "language") ?? "").trim() || "Bilinmiyor",
      source: String(get(row, "source") ?? "").trim() || "Bilinmiyor",
      createdAt,
      calls,
      attemptCount: calls.length,
      reached: actuallyReached,
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
      resultReason:
        dealStatus === "Won"
          ? null
          : calls.length === 0
            ? null
            : !actuallyReached
              ? ("No Response" as const)
              : isConverted
                ? ("Interested" as const)
                : ("Not Interested" as const),
    };
    const lead: Lead = { ...base, status: deriveStatus(base, now) };

    let team = teamMap.get(teamName);
    if (!team) {
      team = { leader: String(get(row, "teamLeader") ?? "").trim() || "—", agents: new Map() };
      teamMap.set(teamName, team);
    }
    let agent = team.agents.get(agentName);
    if (!agent) {
      agent = { role: parseRole(get(row, "role")), leads: [] };
      team.agents.set(agentName, agent);
    }
    agent.leads.push(lead);
    leadCount++;
  });

  const slug = (s: string) => s.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  const teams: RegionTeamRecord[] = [...teamMap.entries()].map(([teamName, t]) => {
    const agents: RegionAgentRecord[] = [...t.agents.entries()].map(([agentName, a]) => ({
      id: `agent-${slug(teamName)}-${slug(agentName)}`,
      name: agentName,
      role: a.role,
      leads: a.leads,
    }));
    return {
      teamId: `team-${slug(teamName)}`,
      teamName,
      teamLeaderName: t.leader,
      location: "—",
      agents,
    };
  });

  const agentCount = teams.reduce((s, t) => s + t.agents.length, 0);
  return {
    ok: teams.length > 0 && leadCount > 0,
    teams,
    stats: { teams: teams.length, agents: agentCount, leads: leadCount },
    errors,
    missingHeaders: [],
  };
}
