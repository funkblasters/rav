import { useQuery, gql } from "@apollo/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";

const MY_FLAGS = gql`
  query GetMyFlags {
    myFlags {
      id
      acquiredAt
    }
  }
`;

type Flag = {
  id: string;
  acquiredAt: string;
};

type ChartDataPoint = {
  year: number;
  count: number;
};

const chartConfig = {
  count: {
    label: "Flags Collected",
    color: "#3b82f6",
  },
};

export function YearlyActivityHistogram() {
  const { t } = useTranslation();
  const { data, loading } = useQuery(MY_FLAGS);

  const flags: Flag[] = data?.myFlags ?? [];

  const chartData: ChartDataPoint[] = (() => {
    const yearCounts: Record<number, number> = {};
    const currentYear = new Date().getFullYear();

    // Initialize all years from 2010 to current year
    for (let year = 2010; year <= currentYear; year++) {
      yearCounts[year] = 0;
    }

    // Count flags for each year
    flags.forEach((flag) => {
      const year = new Date(flag.acquiredAt).getFullYear();
      if (year >= 2010) {
        yearCounts[year]++;
      }
    });

    // Create chart data for all years (ensures every year has a bar)
    const data: ChartDataPoint[] = [];
    for (let year = 2010; year <= currentYear; year++) {
      data.push({
        year,
        count: yearCounts[year],
      });
    }
    return data;
  })();

  if (loading) {
    return (
      <Card className="flex flex-col h-full overflow-hidden">
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="text-sm font-semibold">{t("stats.yearlyActivity")}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 flex items-center justify-center text-xs text-muted-foreground">
          {t("common.loading")}
        </CardContent>
      </Card>
    );
  }

  const totalFlags = chartData.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm font-semibold">{t("stats.yearlyActivity")}</CardTitle>
        <CardDescription className="text-xs">
          {totalFlags} {t("stats.flagsTotal")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 px-2 pb-2">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                type="category"
                interval={Math.max(0, Math.floor(chartData.length / 8))}
                height={20}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                allowDecimals={false}
                width={28}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="count"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
