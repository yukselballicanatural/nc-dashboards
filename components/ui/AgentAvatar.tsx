"use client";

import { useLang } from "@/components/i18n/LanguageProvider";

/**
 * Temsili agent avatarı — gerçek fotoğraf yerine düz-tasarım karakter
 * illüstrasyonu (baş harflerin boş/beyaz kalmasının önüne geçmek için).
 * Marka renk paletiyle (jade zemin, sıcak ten tonu) tutarlı, tek SVG.
 */
export function AgentAvatar({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const { t } = useLang();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={t("Agent profil avatarı", "Agent profile avatar")}
      className={className}
    >
      <defs>
        <linearGradient id="avatarBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0EA98B" />
          <stop offset="100%" stopColor="#067A62" />
        </linearGradient>
      </defs>
      {/* Zemin */}
      <circle cx="32" cy="32" r="32" fill="url(#avatarBg)" />
      {/* Omuz/gövde */}
      <path
        d="M8 58C8 45.85 18.75 39 32 39C45.25 39 56 45.85 56 58V64H8V58Z"
        fill="#F6C7A9"
      />
      {/* Yaka detayı */}
      <path
        d="M32 39C26.5 39 21.6 40.4 17.8 42.7C21.1 47.5 26.1 50.5 32 50.5C37.9 50.5 42.9 47.5 46.2 42.7C42.4 40.4 37.5 39 32 39Z"
        fill="#FFFFFF"
        opacity="0.9"
      />
      {/* Baş */}
      <circle cx="32" cy="24" r="13" fill="#F6C7A9" />
      {/* Saç */}
      <path
        d="M19 22C19 14.8 24.8 9 32 9C39.2 9 45 14.8 45 22C45 18.5 42.5 16.5 39.5 15.8C36.8 18 33.8 18.5 32 18.5C30.2 18.5 27.2 18 24.5 15.8C21.5 16.5 19 18.5 19 22Z"
        fill="#3A2A24"
      />
    </svg>
  );
}
