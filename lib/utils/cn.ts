import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * className birleştirici — koşullu sınıfları (clsx) birleştirir ve
 * çakışan Tailwind utility'lerini (tailwind-merge) çözer.
 * Örn: cn("px-2", cond && "px-4") → "px-4"
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
