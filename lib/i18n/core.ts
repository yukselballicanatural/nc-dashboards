/**
 * i18n çekirdeği — TR/EN iki dilli sistem.
 *
 * Tasarım kararı: Ayrı bir anahtar (key) sözlüğü yerine YERİNDE iki dilli metin
 * kullanılır → `t("Türkçe", "English")`. Böylece her metnin iki dili kullanım
 * yerinde görünür; eksik-anahtar hatası olmaz ("kusursuz çalışma" hedefi).
 *
 * React dışı (compute/veri katmanı) için `pick(lang, tr, en)` yardımcı fonksiyonu
 * kullanılır — KPI etiketleri, funnel etiketleri, tavsiye cümleleri gibi veri
 * kaynaklı metinler doğrudan aktif dilde üretilir.
 */

export type Lang = "tr" | "en";

export const DEFAULT_LANG: Lang = "tr";
export const LANG_STORAGE_KEY = "nc_lang_v1";

/** Dil seçimine göre iki metinden birini döndürür (React dışı katmanlar için). */
export function pick(lang: Lang, tr: string, en: string): string {
  return lang === "en" ? en : tr;
}
