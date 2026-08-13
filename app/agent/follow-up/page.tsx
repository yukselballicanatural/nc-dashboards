import { T } from "@/components/i18n/T";
import { DashboardHeader } from "@/components/agent/dashboard/DashboardHeader";
import { ActionCenter } from "@/components/agent/dashboard/ActionCenter";
import { FollowUpTable } from "@/components/agent/dashboard/FollowUpTable";

/**
 * Follow-up Listesi — v2 4.4.
 * Aksiyon bekleyen tüm lead'ler, öncelik sırasıyla; filtre + arama.
 *
 * "Bugün yapman gerekenler" özeti (ActionCenter, CLAUDE.md 4.3) Dashboard dört
 * ana alana indirildiği için buraya taşındı — doğal evi burası: özet üstte,
 * tam liste altında.
 */
export default function FollowUpPage() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <DashboardHeader
        title={<T tr="Follow-up Listesi" en="Follow-up List" />}
        subtitle={
          <T
            tr="Aksiyon bekleyen lead'lerin — en acil en üstte, her satırda bir sonraki adım yazıyor."
            en="Your leads awaiting action — most urgent on top, each row shows the next step."
          />
        }
      />
      <ActionCenter />
      <FollowUpTable />
    </div>
  );
}
