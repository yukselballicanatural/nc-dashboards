/**
 * ANLIK (CANLI) ÇAĞRI MOTORU — takımın o anki çağrı durumu + agent'ın bu
 * toplam içindeki payı ve takım içi sırası (kullanıcı talebi).
 *
 * İKİ KATMAN:
 *  1. TABAN (gerçek veri) — her takım üyesinin BUGÜN yaptığı çağrı sayısı,
 *     mevcut lead motorundan `summarizeAgent` ile türetilir. Yani panelin
 *     geri kalanıyla birebir tutarlıdır, uydurma sayı yoktur.
 *  2. CANLI KATMAN (simülasyon) — mock ortamda gerçek bir telefon santrali
 *     olmadığı için "şu an hatta kim var" ve "sayaç tik tik artıyor" hissi
 *     deterministik PRNG ile üretilir. Backend bağlanınca yalnızca bu
 *     katman gerçek santral verisiyle değiştirilecek; taban ve pay/sıra
 *     hesapları aynı kalabilir.
 *
 * DETERMİNİZM / HYDRATION: `liveCallSnapshot(elapsedSec)` saf bir
 * fonksiyondur ve `Math.random`/`Date.now` KULLANMAZ. Bileşen ilk render'da
 * `elapsedSec = 0` ile çağırır (sunucu ve tarayıcıda aynı sonuç → hydration
 * uyuşmazlığı olmaz), sayaç yalnızca `useEffect` içinde ilerletilir.
 *
 * Pay/sıra algoritması, şirket kıyaslamasındaki (company-benchmark.ts) dille
 * aynı: eşit dağılımda beklenen pay = 100 / takım mevcudu.
 */

import { DAY, HOUR, MOCK_NOW } from "./lead-engine";
import { mulberry32 } from "./seeded-random";
import { summarizeAgent } from "./team-compute";
import { TEAM_AGENTS, TEAM_NAME } from "./team-data";
import { AGENT_PROFILE } from "./mock-data";

const TZ_OFFSET = 3 * HOUR;

/** Günün başlangıcı (İstanbul) — datasets.ts'teki aynı hesap. */
function startOfDay(ts: number): number {
  const local = ts + TZ_OFFSET;
  return local - (local % DAY) - TZ_OFFSET;
}

const TODAY_START = startOfDay(MOCK_NOW);

/** Vardiya (CLAUDE.md profil çipi: 09:00–18:00). */
const SHIFT_START_HOUR = 9;
const SHIFT_END_HOUR = 18;

const SHIFT_START = TODAY_START + SHIFT_START_HOUR * HOUR;
const SHIFT_END = TODAY_START + SHIFT_END_HOUR * HOUR;

/** Vardiya başından "şimdi"ye kadar geçen saat (en az 0.5 — sıfıra bölme koruması). */
const HOURS_ELAPSED = Math.max(0.5, (MOCK_NOW - SHIFT_START) / HOUR);

/**
 * Demo hızlandırması: 1 gerçek saniye = LIVE_SPEED simüle saniye. Gerçek
 * hızda (1×) takım ortalaması dakikalar boyu hiç kıpırdamaz ve gösterge
 * "bozuk" görünür; bu çarpan sayacın gözle görülür şekilde işlemesini
 * sağlar. Gerçek santral entegrasyonunda 1 olacak.
 */
export const LIVE_SPEED = 30;

/** Sayaç vardiya bitişini aşmasın — sayfa açık kalırsa sonsuza gitmemeli. */
const MAX_SIM_SECONDS = Math.max(0, (SHIFT_END - MOCK_NOW) / 1000);

/** Kaç simüle saniyede bir "hatta olma" durumu yeniden belirlenir. */
const CALL_STATE_WINDOW_SEC = 90;

export interface LiveAgentRow {
  agentId: string;
  name: string;
  /** Agent panelinin sahibi mi (Callum) — vurgulu gösterim için. */
  isSelf: boolean;
  /** Bugün yapılan çağrı: gerçek taban + canlı artış. */
  callsToday: number;
  /** Şu an bir görüşmede mi. */
  onCall: boolean;
  /** Takımın bugünkü toplamındaki payı (%). */
  sharePct: number;
  /** Takım içi sıra (1 = en çok çağrı yapan). */
  rank: number;
}

export interface LiveCallSnapshot {
  teamName: string;
  teamSize: number;
  /** Takımın bugün yaptığı toplam çağrı (canlı). */
  teamTotalCalls: number;
  /** Şu an hatta olan takım üyesi sayısı. */
  onCallCount: number;
  /** Eşit dağılımda her agent'a düşen pay (%) — kıyas çizgisi. */
  fairSharePct: number;
  /** Panelin sahibi olan agent'ın satırı. */
  self: LiveAgentRow;
  /** Tüm takım, çağrı sayısına göre azalan (sıralama bu diziden gelir). */
  rows: LiveAgentRow[];
}

/* ------------------------------------------------------------------ */
/* TABAN — modül yüklenirken BİR KEZ hesaplanır (gerçek veri)          */
/* ------------------------------------------------------------------ */

interface BaseRow {
  agentId: string;
  name: string;
  isSelf: boolean;
  baseCalls: number;
  /** Saatlik çağrı hızı — canlı artışın temeli. */
  callsPerHour: number;
  /** PRNG için agent'a sabit tohum. */
  seed: number;
}

const BASE_ROWS: BaseRow[] = TEAM_AGENTS.map((record, index) => {
  const { summary } = summarizeAgent(record, TODAY_START, MOCK_NOW);
  return {
    agentId: record.id,
    name: record.name,
    isSelf: record.id === AGENT_PROFILE.id,
    baseCalls: summary.calls,
    callsPerHour: summary.calls / HOURS_ELAPSED,
    seed: 77_000 + index * 977,
  };
});

const TEAM_SIZE = BASE_ROWS.length;

/** Takımın saatlik toplam hızı — "hatta olma" olasılığını ölçeklemek için. */
const TEAM_CALLS_PER_HOUR = BASE_ROWS.reduce((s, r) => s + r.callsPerHour, 0);
const AVG_CALLS_PER_HOUR = TEAM_CALLS_PER_HOUR / Math.max(1, TEAM_SIZE);

/**
 * Bir agent'ın şu an hatta olma olasılığı: kendi çağrı hızının takım
 * ortalamasına oranıyla ölçeklenir (çok arayan daha sık hatta olur), ama
 * gösterge hep "0 hatta" kalmasın diye makul bir bantta tutulur.
 */
function onCallProbability(callsPerHour: number): number {
  if (AVG_CALLS_PER_HOUR <= 0) return 0.25;
  const relative = callsPerHour / AVG_CALLS_PER_HOUR;
  return Math.min(0.6, Math.max(0.08, 0.3 * relative));
}

/* ------------------------------------------------------------------ */
/* CANLI ANLIK GÖRÜNTÜ                                                 */
/* ------------------------------------------------------------------ */

/**
 * Verilen "geçen gerçek saniye" için anlık görüntü üretir.
 * @param elapsedSec Bileşenin mount olmasından bu yana geçen gerçek saniye.
 */
export function liveCallSnapshot(elapsedSec = 0): LiveCallSnapshot {
  const simSeconds = Math.min(MAX_SIM_SECONDS, Math.max(0, elapsedSec) * LIVE_SPEED);
  const windowIndex = Math.floor(simSeconds / CALL_STATE_WINDOW_SEC);

  const rows: LiveAgentRow[] = BASE_ROWS.map((base) => {
    // Canlı artış: hız × geçen simüle süre. Agent'a özgü sabit bir faz kayması
    // ([0,1) aralığında) ekliyoruz ki herkesin sayacı aynı anda değil sırayla
    // artsın — gerçek bir takımda olduğu gibi.
    const phase = mulberry32(base.seed)();
    const grown = (base.callsPerHour * simSeconds) / 3600 + phase;
    const callsToday = base.baseCalls + Math.floor(grown);

    // Hatta olma durumu: agent + pencere kombinasyonuna bağlı deterministik
    // zar. Pencere değişince durum değişir, aynı pencerede sabit kalır.
    const stateRoll = mulberry32(base.seed + windowIndex * 7919)();
    const onCall = stateRoll < onCallProbability(base.callsPerHour);

    return {
      agentId: base.agentId,
      name: base.name,
      isSelf: base.isSelf,
      callsToday,
      onCall,
      sharePct: 0, // toplam bilindikten sonra doldurulur
      rank: 0, // sıralamadan sonra doldurulur
    };
  });

  const teamTotalCalls = rows.reduce((s, r) => s + r.callsToday, 0);
  for (const row of rows) {
    row.sharePct =
      teamTotalCalls > 0 ? Math.round((row.callsToday / teamTotalCalls) * 1000) / 10 : 0;
  }

  // Sıralama: çağrı sayısı azalan; eşitlikte isim (deterministik olsun).
  const ranked = [...rows].sort(
    (a, b) => b.callsToday - a.callsToday || a.name.localeCompare(b.name, "tr"),
  );
  ranked.forEach((row, index) => {
    row.rank = index + 1;
  });

  const self = ranked.find((r) => r.isSelf) ?? ranked[0];

  return {
    teamName: TEAM_NAME,
    teamSize: TEAM_SIZE,
    teamTotalCalls,
    onCallCount: rows.filter((r) => r.onCall).length,
    fairSharePct: Math.round((100 / Math.max(1, TEAM_SIZE)) * 10) / 10,
    self,
    rows: ranked,
  };
}
