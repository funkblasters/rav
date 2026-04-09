import { useQuery, gql } from "@apollo/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
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
  date: string;
  count: number;
};

const chartConfig = {
  count: {
    label: "Flags Collected",
    color: "#3b82f6",
  },
};

export function CollectingActivityLineChart() {
  const { t } = useTranslation();
  const { data, loading } = useQuery(MY_FLAGS);

  const flags: Flag[] = data?.myFlags ?? [];

  // Create cumulative data by sorting flags by date
  const chartData: ChartDataPoint[] = (() => {
    const sortedFlags = [...flags].sort(
      (a, b) => new Date(a.acquiredAt).getTime() - new Date(b.acquiredAt).getTime()
    );

    return sortedFlags.map((flag, index) => ({
      date: new Date(flag.acquiredAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
      }),
      count: index + 1,
    }));
  })();

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{t("stats.collectingActivity")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">
          {t("common.loading")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{t("stats.collectingActivity")}</CardTitle>
        <CardDescription className="text-xs">
          {flags.length} flags collected
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
