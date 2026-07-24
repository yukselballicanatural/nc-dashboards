/**
 * Merkezi hareket/animasyon sabitleri — CLAUDE.md Bölüm 3.4.
 * Tüm bileşenler süre/easing/stagger değerlerini buradan alır ki
 * animasyon dili tek yerden yönetilebilsin ("tek yerde cesur ol" kuralı).
 *
 * prefers-reduced-motion kontrolü lib/hooks/usePrefersReducedMotion ile
 * yapılır; reduced modda framer-motion varyantlarına duration 0 verilir.
 */

// Süreler (saniye — framer-motion saniye bekler)
// NOT: Hız önceliği — kullanıcı geri bildirimi üzerine giriş/grafik süreleri
// belirgin şekilde kısaltıldı ki menüler arası geçişte içerik "hemen" açılsın.
// Premium his korunuyor ama animasyonlar artık çok kısa (snappy).
export const DURATION = {
  /** Hover mikro-etkileşimi (kart yükselme) — 3.4 madde 5 */
  hover: 0.11,
  /** Sekme geçişi — 3.4 madde 1 */
  tab: 0.07,
  /** Kart giriş fade+rise — 3.4 madde 2 */
  cardEnter: 0.12,
  /** KPI count-up — 3.4 madde 3 */
  countUp: 0.2,
  /** Grafik çizilme (bar-list fill animasyonları) — 3.4 madde 4.
   *  Recharts grafiklerin kendi çizim animasyonu performans için tamamen
   *  kapatıldı (isAnimationActive={false}); bu değer yalnızca framer-motion
   *  bar-liste dolgularını etkiler. */
  chart: 0.16,
  /** Tema geçişi — 3.1 (280ms, CSS tarafında da sabit) */
  theme: 0.24,
} as const;

// Easing eğrileri
export const EASING = {
  /** Genel giriş — ease-out benzeri */
  out: [0.16, 1, 0.3, 1] as const,
  /** Yumuşak standart */
  standard: [0.4, 0, 0.2, 1] as const,
};

// Staggered kart girişleri — 3.4 madde 2
// Hız önceliği: kartlar arası gecikme ~2 kata kadar kısaltıldı; uzun listelerde
// toplam bekleme belirgin düştü.
export const STAGGER = {
  children: 0.012,
  /** Dikey kayma miktarı (px) — fade+rise */
  rise: 5,
} as const;

// Sekme geçişi dikey kayma (px) — 3.4 madde 1 (8-12px)
export const TAB_SHIFT = 10;
