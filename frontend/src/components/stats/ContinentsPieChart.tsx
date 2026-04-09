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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{t("stats.continents")}</CardTitle>
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
        <CardTitle className="text-sm font-semibold">{t("stats.continents")}</CardTitle>
        <CardDescription className="text-xs">
          {continents.reduce((sum, c) => sum + c.count, 0)} {t("stats.flagsTotal")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
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
      </CardContent>
    </Card>
  );
}
