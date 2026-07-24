"use client";

/**
 * Giriş ekranı — WebGL "duman" shader arkaplanı üzerinde cam efektli (glass)
 * form kartı. İmza görsel öğe: SmokeyBackground (fare hareketine tepki veren,
 * marka rengiyle akan dalga efekti); kart yüzen etiketli (floating label)
 * girişler, hatalı denemede sallanma efekti, yükleniyor durumu içerir.
 *
 * Demo kimlik doğrulama (mock — gerçek auth backend fazında bağlanacak):
 * - agent / 123456        → /agent
 * - takımlideri / 123456  → /team-leader
 */

import { useCallback, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, User, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils/cn";
import { SmokeyBackground } from "@/components/ui/SmokeyBackground";
import { findManagedUser, ROLE_ROUTE, ROLE_LABEL } from "@/lib/data/user-store";
import { setSessionUser } from "@/lib/data/session-store";
import { AGENT_PROFILE } from "@/lib/mock/mock-data";
import { TEAM_LEADER_PROFILE } from "@/lib/mock/team-leader-profile";
import { REGION_MANAGER_PROFILE } from "@/lib/mock/region-manager-profile";
import { ADMIN_PROFILE } from "@/lib/mock/admin-profile";
import logoWhite from "@/public/brand/natural-clinic-logo-white.png";

const DEMO_PASSWORD = "123456";
interface DemoAccount {
  route: string;
  identity: { name: string; role: string; team: string; location?: string };
}
// Sabit demo hesapları — her biri kendi kanonik kimliğiyle giriş yapar.
const DEMO_ACCOUNTS: Record<string, DemoAccount> = {
  agent: { route: "/agent", identity: AGENT_PROFILE },
  takımlideri: { route: "/team-leader", identity: TEAM_LEADER_PROFILE },
  bolgemuduru: { route: "/region-manager", identity: REGION_MANAGER_PROFILE },
  admin: { route: "/admin", identity: ADMIN_PROFILE },
};

export function LoginScreen() {
  const router = useRouter();
  const reduced = usePrefersReducedMotion();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      setSubmitting(true);
      setError(null);

      window.setTimeout(() => {
        // 1) Sabit demo hesapları — kendi kanonik kimlikleriyle
        const demo = DEMO_ACCOUNTS[username.trim().toLocaleLowerCase("tr-TR")];
        if (demo && password === DEMO_PASSWORD) {
          setSessionUser({ ...demo.identity, location: demo.identity.location ?? "İstanbul" });
          router.push(demo.route);
          return;
        }
        // 2) Admin panelinden oluşturulan kullanıcılar — kendi kimlikleriyle
        const managed = findManagedUser(username, password);
        if (managed) {
          setSessionUser({
            name: managed.name,
            role: ROLE_LABEL[managed.role],
            team: managed.team,
            location: "İstanbul",
          });
          router.push(ROLE_ROUTE[managed.role]);
          return;
        }
        setSubmitting(false);
        setError("Kullanıcı adı veya şifre hatalı.");
        setShakeKey((k) => k + 1);
      }, 550);
    },
    [submitting, username, password, router],
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050810]">
      {/* İmza görsel öğe — WebGL duman shader */}
      <div className="absolute inset-0">
        <SmokeyBackground color="#12C99E" />
      </div>
      {/* Köşe glow'ları — marka gradienti ile derinlik (screen blend) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          mixBlendMode: "screen",
          backgroundImage: [
            "radial-gradient(60% 55% at 85% 8%, rgba(124,92,252,0.35) 0%, transparent 60%)",
            "radial-gradient(55% 50% at 10% 95%, rgba(79,99,232,0.30) 0%, transparent 60%)",
          ].join(", "),
        }}
      />
      {/* Vinyet — kenarlarda kart okunurluğu için koyulaştırma */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(120% 100% at 50% 50%, transparent 35%, rgba(2,4,10,0.55) 100%)",
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <motion.div
          key={shakeKey}
          animate={error && !reduced ? { x: [0, -10, 9, -7, 5, -3, 0] } : { x: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-[380px] space-y-6 rounded-[28px] border border-white/14 bg-[#0b1120]/75 p-8 shadow-[0_30px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
        >
          <div className="flex flex-col items-center gap-5 text-center">
            <Image
              src={logoWhite}
              alt="Natural Clinic"
              height={34}
              className="h-[34px] w-auto"
              priority
            />
            <div>
              <h1 className="font-display text-[24px] font-bold text-white">
                Tekrar Hoş Geldin
              </h1>
              <p className="mt-1.5 font-body text-[13px] text-white/60">
                Agent paneline devam etmek için giriş yap
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Kullanıcı adı */}
            <label className="flex flex-col gap-1.5">
              <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-white/50">
                Kullanıcı Adı
              </span>
              <div className="relative">
                <User
                  size={16}
                  aria-hidden
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="agent"
                  disabled={submitting}
                  className="h-12 w-full rounded-control border border-white/15 bg-white/8 pl-10 pr-3.5 font-body text-[14px] text-white outline-none transition-colors placeholder:text-white/30 focus:border-brand focus:bg-white/10 disabled:opacity-50"
                />
              </div>
            </label>

            {/* Şifre + göster/gizle */}
            <label className="flex flex-col gap-1.5">
              <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-white/50">
                Şifre
              </span>
              <div className="relative">
                <Lock
                  size={16}
                  aria-hidden
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••"
                  disabled={submitting}
                  className="h-12 w-full rounded-control border border-white/15 bg-white/8 pl-10 pr-11 font-body text-[14px] text-white outline-none transition-colors placeholder:text-white/30 focus:border-brand focus:bg-white/10 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/45 transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-control border border-critical/40 bg-critical/15 px-3 py-2 font-body text-[12px] font-medium text-red-200"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "group flex h-12 w-full items-center justify-center gap-2 rounded-control bg-brand font-body text-[13.5px] font-semibold text-white shadow-[0_10px_30px_rgba(14,169,139,0.35)] transition-all duration-300",
                submitting ? "cursor-wait opacity-90" : "hover:brightness-110",
              )}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                <>
                  Giriş Yap
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>

          <div className="flex items-start gap-2 rounded-control border border-white/12 bg-white/5 px-3.5 py-2.5">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-brand" aria-hidden />
            <p className="font-body text-[11.5px] leading-relaxed text-white/55">
              Demo: <span className="font-mono text-white/80">agent</span> /{" "}
              <span className="font-mono text-white/80">takımlideri</span> /{" "}
              <span className="font-mono text-white/80">bolgemuduru</span> /{" "}
              <span className="font-mono text-white/80">admin</span> ·{" "}
              şifre <span className="font-mono text-white/80">123456</span>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
