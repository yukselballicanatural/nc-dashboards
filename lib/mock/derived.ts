/**
 * Lead'den türetilen saf hesaplama fonksiyonları — CLAUDE.md v2 Bölüm 5.3.
 * Veri üretiminden ayrı tutulur; gerçek backend geldiğinde aynı fonksiyonlar
 * gerçek Lead kayıtlarına uygulanabilir.
 */

import type { Lead, LeadPriority, StatusLevel } from "@/lib/types/agent-data";
import { pick, type Lang } from "@/lib/i18n/core";
import { DAY, MINUTE, MOCK_NOW, SLA_MS } from "./lead-engine";

/** Öncelik karar ağacı — v2 5.3 madde 1 (SLA eşiği 15 dk). */
export function leadPriority(lead: Lead, now: number = MOCK_NOW): LeadPriority {
  if (lead.attemptCount === 0) {
    return now - lead.createdAt > SLA_MS ? "cok-kritik" : "normal";
  }
  if (lead.isConverted) return "normal";
  if (lead.dueDate === null) return lead.reached ? "normal" : "orta";

  const daysLeft = (lead.dueDate - now) / DAY;
  if (daysLeft <= 0) return "cok-kritik";
  if (daysLeft <= 7) return "kritik";
  if (daysLeft <= 30) return "yuksek";
  return "orta";
}

/** Speed-to-Lead kovaları — v2 4.2/5.3 madde 2 (7 grup). */
export const SPEED_BUCKETS: ReadonlyArray<{
  key: string;
  label: string;
  labelEn: string;
  maxMinutes: number;
  status: StatusLevel;
}> = [
  { key: "0-5", label: "0-5 dk", labelEn: "0-5 min", maxMinutes: 5, status: "success" },
  { key: "6-15", label: "6-15 dk", labelEn: "6-15 min", maxMinutes: 15, status: "success" },
  { key: "16-30", label: "16-30 dk", labelEn: "16-30 min", maxMinutes: 30, status: "warning" },
  { key: "31-60", label: "31-60 dk", labelEn: "31-60 min", maxMinutes: 60, status: "warning" },
  { key: "61-180", label: "1-3 saat", labelEn: "1-3 hr", maxMinutes: 180, status: "risk" },
  { key: "181-1440", label: "3-24 saat", labelEn: "3-24 hr", maxMinutes: 1440, status: "risk" },
  { key: "1440+", label: "24 saat üzeri", labelEn: "24 hr+", maxMinutes: Infinity, status: "critical" },
];

/** İlk arama gecikmesine göre kova anahtarı — hiç aranmadıysa null. */
export function speedToLeadGroup(lead: Lead): string | null {
  if (lead.calls.length === 0) return null;
  const minutes = (lead.calls[0].time - lead.createdAt) / MINUTE;
  const bucket = SPEED_BUCKETS.find((b) => minutes <= b.maxMinutes);
  return bucket?.key ?? null;
}

/** Yapılacak işlem karar ağacı — v2 5.3 madde 3 (sıralı). */
export function nextAction(lead: Lead, lang: Lang = "tr"): string {
  if (lead.attemptCount === 0) return pick(lang, "İlk aramayı yap", "Make the first call");
  if (!lead.reached) return pick(lang, "Tekrar aramayı dene", "Try calling again");
  if (lead.callbackDate !== null && !lead.isConverted)
    return pick(lang, "Callback'i takip et", "Follow up the callback");
  if (!lead.isConverted)
    return pick(lang, "Contact'a dönüştürmeyi değerlendir", "Consider converting to Contact");
  if (lead.offerStatus === null) return pick(lang, "Offer oluştur", "Create an offer");
  if (lead.offerStatus === "Offer Created") return pick(lang, "Offer'ı paylaş", "Share the offer");
  if (lead.offerStatus === "Offer Shared") return pick(lang, "Onay için takip et", "Follow up for approval");
  if (lead.dealStatus === null) return pick(lang, "Deal'a dönüştür", "Convert to a deal");
  if (lead.dealStatus === "Won" && !lead.paymentReceived)
    return pick(lang, "Ödemeyi takip et", "Follow up the payment");
  return pick(lang, "Takip et", "Follow up");
}

/** Öncelik sıralama ağırlığı (düşük = daha acil). */
export const PRIORITY_ORDER: Record<LeadPriority, number> = {
  "cok-kritik": 0,
  kritik: 1,
  yuksek: 2,
  orta: 3,
  normal: 4,
};
