import { useQuery, gql } from "@apollo/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";

const MY_PROFILE = gql`
  query MyProfile {
    myProfile {
      contributionsByContinent {
        continent
        count
      }
    }
  }
`;

const USER_PROFILE_CONTINENTS = gql`
  query UserProfileContinents($userId: ID!) {
    userProfile(userId: $userId) {
      contributionsByContinent {
        continent
        count
      }
    }
  }
`;

const GLOBAL_CONTINENTS = gql`
  query GlobalContinentsBreakdown {
    globalContinentsBreakdown {
      continent
      count
    }
  }
`;

const CONTINENT_COLORS: Record<string, string> = {
  "africa":        "#ef4444", // red
  "europe":        "#3b82f6", // blue
  "north america": "#10b981", // emerald
  "asia":          "#f59e0b", // amber
  "oceania":       "#8b5cf6", // violet
  "south america": "#ec4899", // pink
};

const DEFAULT_COLOR = "#14b8a6";

type ContinentData = {
  continent: string;
  count: number;
};

const chartConfig = {
  count: {
    label: "Flags",
    color: "#3b82f6",
  },
};

export function ContinentsPieChart({ userId, global: isGlobal, innerRadius = 50, outerRadius = 80 }: { userId?: string; global?: boolean; innerRadius?: number; outerRadius?: number }) {
  const { t } = useTranslation();

  const { data: myData, loading: myLoading } = useQuery(MY_PROFILE, { skip: !!userId || isGlobal });
  const { data: userData, loading: userLoading } = useQuery(USER_PROFILE_CONTINENTS, {
    variables: { userId },
    skip: !userId || isGlobal,
  });
  const { data: globalData, loading: globalLoading } = useQuery(GLOBAL_CONTINENTS, { skip: !isGlobal });

  const loading = isGlobal ? globalLoading : userId ? userLoading : myLoading;
  const continents: ContinentData[] = isGlobal
    ? (globalData?.globalContinentsBreakdown ?? [])
    : userId
    ? (userData?.userProfile?.contributionsByContinent ?? [])
    : (myData?.myProfile?.contributionsByContinent ?? []);

  if (loading) {
    return (
      <Card className="flex flex-col h-full overflow-hidden">
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="text-sm font-semibold">{t("stats.continents")}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 flex items-center justify-center text-xs text-muted-foreground">
          {t("common.loading")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm font-semibold">{t("stats.continents")}</CardTitle>
        <CardDescription className="text-xs">
          {continents.reduce((sum, c) => sum + c.count, 0)} {t("stats.flagsTotal")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col gap-2 px-2 pb-2">
        <ChartContainer config={chartConfig} className="flex-1 min-h-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={continents}
                dataKey="count"
                nameKey="continent"
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={2}
                isAnimationActive
                animationDuration={500}
                animationEasing="ease-out"
              >
                {continents.map((c) => (
                  <Cell key={`cell-${c.continent}`} fill={CONTINENT_COLORS[c.continent] ?? DEFAULT_COLOR} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 shrink-0">
          {continents.map((c) => (
            <div key={c.continent} className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: CONTINENT_COLORS[c.continent] ?? DEFAULT_COLOR }}
              />
              <span className="text-xs text-muted-foreground">{c.continent}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
