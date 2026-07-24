"use client";

import { useLang } from "@/components/i18n/LanguageProvider";

/**
 * Yerinde iki dilli metin bileşeni. Sunucu bileşenleri (sayfalar, başlıklar)
 * dahil HER YERDE kullanılabilir — çünkü kendisi bir client bileşenidir ve dili
 * kendi içinde okur. Metin düğümleri için:
 *   <T tr="Kaydet" en="Save" />
 * Öznitelikler (aria-label, placeholder) için client bileşenlerde
 * `const { t } = useLang(); t("Kaydet","Save")` kullanılır.
 */
export function T({ tr, en }: { tr: string; en: string }) {
  const { lang } = useLang();
  return <>{lang === "en" ? en : tr}</>;
}
