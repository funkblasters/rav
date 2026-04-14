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

const COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

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

export function ContinentsPieChart() {
  const { t } = useTranslation();
  const { data, loading } = useQuery(MY_PROFILE);

  const continents: ContinentData[] = data?.myProfile?.contributionsByContinent ?? [];

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
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {continents.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 shrink-0">
          {continents.map((c, index) => (
            <div key={c.continent} className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs text-muted-foreground">{c.continent}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
