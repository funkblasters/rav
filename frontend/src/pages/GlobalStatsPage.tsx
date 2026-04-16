import { useQuery, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ContinentsPieChart } from "@/components/stats/ContinentsPieChart";
import { GlobalStackedBarChart } from "@/components/stats/GlobalStackedBarChart";

const GLOBAL_STATS = gql`
  query GlobalStats {
    globalStats {
      totalFlags
      membersCount
      registeredCount
    }
  }
`;

function StatCard({ title, subtitle, value }: { title: string; subtitle: string; value: number | undefined }) {
  return (
    <Card className="flex-1">
      <CardContent className="flex items-center justify-between px-6 py-5">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold leading-tight">{title}</span>
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </div>
        <span className="text-5xl font-bold tabular-nums">
          {value ?? "—"}
        </span>
      </CardContent>
    </Card>
  );
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

export function GlobalStatsPage() {
  const { t } = useTranslation();
  const { data } = useQuery(GLOBAL_STATS);
  const stats = data?.globalStats;
  const isDesktop = useIsDesktop();

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-6 px-4 pb-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{t("global.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("global.subtitle")}</p>
        </div>

        {/* Stat Cards — stack on mobile, side by side from sm up */}
        <div className="flex flex-col sm:flex-row gap-4">
          <StatCard
            title={t("global.totalFlags")}
            subtitle={t("global.totalFlagsSubtitle")}
            value={stats?.totalFlags}
          />
          <StatCard
            title={t("global.registeredMembers")}
            subtitle={t("global.registeredMembersSubtitle")}
            value={stats?.registeredCount}
          />
          <StatCard
            title={t("global.contributors")}
            subtitle={t("global.contributorsSubtitle")}
            value={stats?.membersCount}
          />
        </div>

        {/* Charts — stacked on mobile/tablet, side by side on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[340px] lg:h-[480px]">
            <ContinentsPieChart
              global
              innerRadius={isDesktop ? 70 : 50}
              outerRadius={isDesktop ? 115 : 80}
            />
          </div>
          <div className="h-[480px]">
            <GlobalStackedBarChart />
          </div>
        </div>
      </div>
    </div>
  );
}
