import { useQuery, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ContinentsPieChart } from "@/components/stats/ContinentsPieChart";
import { GlobalStackedBarChart } from "@/components/stats/GlobalStackedBarChart";

const GLOBAL_STATS = gql`
  query GlobalStats {
    globalStats {
      totalFlags
      membersCount
      registeredCount
      lgbtFlags
      historicFlags
      notRecognizedFlags
      religiousFlags
    }
  }
`;

function useCountUp(target: number | undefined, duration = 400) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (target === undefined) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return count;
}

function StatCard({ title, subtitle, value }: { title: string; subtitle: string; value: number | undefined }) {
  const count = useCountUp(value);
  return (
    <Card className="flex-1">
      <CardContent className="flex items-center justify-between px-6 py-8">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold leading-tight">{title}</span>
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </div>
        <span className="text-5xl font-bold tabular-nums shrink-0">
          {value === undefined ? "—" : count}
        </span>
      </CardContent>
    </Card>
  );
}

function PropertyStatCard({ title, subtitle, value, imageUrl }: { title: string; subtitle: string; value: number | undefined; imageUrl: string }) {
  const count = useCountUp(value);
  return (
    <Card className="flex-1">
      {/* Mobile: title on top, then image + number side by side */}
      <CardContent className="px-4 py-4 sm:py-6">
        {/* Mobile layout */}
        <div className="flex flex-col gap-2 sm:hidden">
          <span className="text-sm font-semibold leading-tight">{title}</span>
          <div className="flex items-center justify-between">
            <img
              src={imageUrl}
              alt={title}
              className="w-10 h-10 rounded-full object-cover shrink-0 border"
            />
            <span className="text-4xl font-bold tabular-nums">
              {value === undefined ? "—" : count}
            </span>
          </div>
        </div>
        {/* Desktop layout */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={imageUrl}
              alt={title}
              className="w-10 h-10 rounded-full object-cover shrink-0 border"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold leading-tight">{title}</span>
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            </div>
          </div>
          <span className="text-4xl font-bold tabular-nums shrink-0 ml-3">
            {value === undefined ? "—" : count}
          </span>
        </div>
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

        {/* Property Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <PropertyStatCard
            title={t("global.lgbtFlags")}
            subtitle={t("global.lgbtFlagsSubtitle")}
            value={stats?.lgbtFlags}
            imageUrl="https://upload.wikimedia.org/wikipedia/commons/4/48/Gay_Pride_Flag.svg"
          />
          <PropertyStatCard
            title={t("global.historicFlags")}
            subtitle={t("global.historicFlagsSubtitle")}
            value={stats?.historicFlags}
            imageUrl="https://upload.wikimedia.org/wikipedia/commons/5/52/Roundel_of_the_Republic_of_the_Congo_%281970%E2%80%931992%29.svg"
          />
          <PropertyStatCard
            title={t("global.notRecognizedFlags")}
            subtitle={t("global.notRecognizedFlagsSubtitle")}
            value={stats?.notRecognizedFlags}
            imageUrl="https://upload.wikimedia.org/wikipedia/commons/8/82/Flag_of_Biafra.svg"
          />
          <PropertyStatCard
            title={t("global.religiousFlags")}
            subtitle={t("global.religiousFlagsSubtitle")}
            value={stats?.religiousFlags}
            imageUrl="https://upload.wikimedia.org/wikipedia/commons/1/17/Yin_yang.svg"
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
