/**
 * Sayı/para/yüzde formatlama — tr-TR yereli (CLAUDE.md 3.2: mono rakamlar,
 * € formatı 4.6). Tüm gösterim formatlaması buradan geçer ki uygulama
 * genelinde tek dil olsun.
 */

import type { Lang } from "@/lib/i18n/core";

const numberFormatters = new Map<number, Intl.NumberFormat>();

function getNumberFormatter(digits: number): Intl.NumberFormat {
  let formatter = numberFormatters.get(digits);
  if (!formatter) {
    formatter = new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    numberFormatters.set(digits, formatter);
  }
  return formatter;
}

/** 1284.5 → "1.284,5" */
export function formatNumber(value: number, digits = 0): string {
  return getNumberFormatter(digits).format(value);
}

/** 86.5 → "%86,5" (Türkçe yazımda % öne gelir) */
export function formatPercent(value: number, digits = 1): string {
  return `%${formatNumber(value, digits)}`;
}

/** 12480 → "12.480 €" */
export function formatCurrencyEUR(value: number, digits = 0): string {
  return `${formatNumber(value, digits)} €`;
}

/** (10, 12) → "10/12" — SLA tarzı x/y gösterimi (4.3). */
export function formatRatio(numerator: number, denominator: number): string {
  return `${formatNumber(numerator)}/${formatNumber(denominator)}`;
}

export const MONTHS_TR = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
] as const;

export const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** Aktif dile göre kısa ay adı dizisi. */
export function monthsFor(lang: Lang): ReadonlyArray<string> {
  return lang === "en" ? MONTHS_EN : MONTHS_TR;
}

/**
 * ISO string → "13 Tem" / "13 Jul". TZ dönüşümü yapılmadan string'den
 * ayrıştırılır (SSR/CSR hydration tutarlılığı; saat dilimi backend fazında
 * ele alınacak).
 */
export function formatShortDate(iso: string, lang: Lang = "tr"): string {
  const day = Number(iso.slice(8, 10));
  const month = monthsFor(lang)[Number(iso.slice(5, 7)) - 1] ?? "";
  return `${day} ${month}`;
}

/** ISO string → "13 Tem · 14:30" / "13 Jul · 14:30". */
export function formatShortDateTime(iso: string, lang: Lang = "tr"): string {
  return `${formatShortDate(iso, lang)} · ${iso.slice(11, 16)}`;
}
