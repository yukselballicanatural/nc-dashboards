/**
 * Seed'li PRNG — CLAUDE.md v2 Bölüm 5.1 (mulberry32).
 * Mock veri her yenilemede/SSR-CSR arasında AYNI üretilsin diye kullanılır;
 * Math.random asla kullanılmaz.
 */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** mulberry32 üzerine pratik yardımcılar. */
export class Rng {
  private readonly next: () => number;

  constructor(seed: number) {
    this.next = mulberry32(seed);
  }

  /** [0,1) */
  float(): number {
    return this.next();
  }

  /** [min,max) reel */
  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /** [min,max] tam sayı */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** p olasılıkla true */
  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  /** Ağırlıklı seçim: [[değer, ağırlık], ...] */
  weighted<T>(pairs: ReadonlyArray<readonly [T, number]>): T {
    const total = pairs.reduce((sum, [, w]) => sum + w, 0);
    let roll = this.next() * total;
    for (const [value, weight] of pairs) {
      roll -= weight;
      if (roll <= 0) return value;
    }
    return pairs[pairs.length - 1][0];
  }
}
