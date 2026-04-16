import { useQuery, gql } from "@apollo/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import { useId } from "react";

const GLOBAL_YEARLY_ACTIVITY = gql`
  query GlobalYearlyActivity {
    globalYearlyActivity {
      year
      groupKey
      contributors {
        id
        displayName
      }
      count
    }
  }
`;

type Contributor = { id: string; displayName: string };
type Entry = { year: number; groupKey: string; contributors: Contributor[]; count: number };

const USER_COLORS = [
  // Base 12
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
  "#06b6d4", "#84cc16", "#a855f7", "#0ea5e9",
  // Lighter variants of the same 12
  "#93c5fd", "#fca5a5", "#6ee7b7", "#fcd34d",
  "#c4b5fd", "#f9a8d4", "#5eead4", "#fdba74",
  "#67e8f9", "#d9f99d", "#d8b4fe", "#7dd3fc",
];

function getUserColor(index: number): string {
  return USER_COLORS[index % USER_COLORS.length];
}

const STRIPE_WIDTH = 6; // px per user stripe in the pattern

function groupLabel(contributors: Contributor[]) {
  return contributors.map((c) => c.displayName).join(" + ");
}

function buildChartData(entries: Entry[]) {
  const currentYear = new Date().getFullYear();

  // Stable color + name per unique user (first-seen order)
  const userColorMap = new Map<string, string>();
  const userNameMap = new Map<string, string>();
  entries.forEach((e) =>
    e.contributors.forEach((c) => {
      if (!userColorMap.has(c.id)) {
        userColorMap.set(c.id, getUserColor(userColorMap.size));
        userNameMap.set(c.id, c.displayName);
      }
    })
  );

  // User index for sorting
  const userOrder = new Map<string, number>();
  let idx = 0;
  for (const uid of userColorMap.keys()) userOrder.set(uid, idx++);

  // Groups: keyed by groupKey, unsorted for now
  const groups = new Map<string, { contributors: Contributor[]; stripeColors: string[] }>();
  entries.forEach((e) => {
    if (!groups.has(e.groupKey))
      groups.set(e.groupKey, {
        contributors: e.contributors,
        stripeColors: e.contributors.map((c) => userColorMap.get(c.id)!),
      });
  });

  // Sort groups:
  //   primary key   = index of first contributor
  //   secondary key = -1 for solo (sorts before any multi), else index of second contributor
  //   tertiary key  = contributor count descending (A+B+C before A+B when primary+secondary match)
  const sortedGroupKeys = [...groups.keys()].sort((a, b) => {
    const ca = groups.get(a)!.contributors;
    const cb = groups.get(b)!.contributors;
    const p1 = userOrder.get(ca[0].id) ?? 999;
    const p2 = userOrder.get(cb[0].id) ?? 999;
    if (p1 !== p2) return p1 - p2;
    const s1 = ca.length === 1 ? -1 : (userOrder.get(ca[1].id) ?? 999);
    const s2 = cb.length === 1 ? -1 : (userOrder.get(cb[1].id) ?? 999);
    if (s1 !== s2) return s1 - s2;
    return cb.length - ca.length; // more contributors first within same primary+secondary
  });

  const years: number[] = [];
  for (let y = 2010; y <= currentYear; y++) years.push(y);

  const data = years.map((year) => {
    const row: Record<string, number | string> = { year };
    for (const key of sortedGroupKeys) {
      const match = entries.find((e) => e.year === year && e.groupKey === key);
      row[key] = match?.count ?? 0;
    }
    return row;
  });

  return { data, groups, sortedGroupKeys, userColorMap, userNameMap };
}

function StripePatternDefs({
  prefix,
  sortedGroupKeys,
  groups,
}: {
  prefix: string;
  sortedGroupKeys: string[];
  groups: Map<string, { stripeColors: string[] }>;
}) {
  return (
    <defs>
      {sortedGroupKeys.map((key, i) => {
        const { stripeColors } = groups.get(key)!;
        const n = stripeColors.length;
        const size = n * STRIPE_WIDTH;
        return (
          <pattern
            key={key}
            id={`${prefix}-${i}`}
            patternUnits="userSpaceOnUse"
            width={size}
            height={size}
            patternTransform="rotate(45 0 0)"
          >
            {stripeColors.map((color, j) => (
              <rect key={j} x={j * STRIPE_WIDTH} y={0} width={STRIPE_WIDTH} height={size} fill={color} />
            ))}
          </pattern>
        );
      })}
    </defs>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
  groups,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  label?: string;
  groups: Map<string, { contributors: Contributor[]; stripeColors: string[] }>;
}) {
  if (!active || !payload?.length) return null;
  const nonZero = payload.filter((p) => p.value > 0).reverse();
  if (!nonZero.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
      <p className="font-semibold mb-1">{label}</p>
      {nonZero.map((p) => {
        const colors = groups.get(p.dataKey)?.stripeColors ?? [];
        return (
          <div key={p.dataKey} className="flex items-center gap-2">
            <div className="flex shrink-0 rounded-full overflow-hidden h-2.5">
              {colors.map((c, i) => (
                <span key={i} className="inline-block h-2.5 w-2.5" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium">{p.value}</span>
          </div>
        );
      })}
    </div>
  );
}

export function GlobalStackedBarChart() {
  const { t } = useTranslation();
  const { data, loading } = useQuery(GLOBAL_YEARLY_ACTIVITY);
  const patternPrefix = useId().replace(/:/g, "");

  if (loading) {
    return (
      <Card className="flex flex-col h-full overflow-hidden">
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="text-sm font-semibold">{t("global.yearlyActivity")}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 flex items-center justify-center text-xs text-muted-foreground">
          {t("common.loading")}
        </CardContent>
      </Card>
    );
  }

  const entries: Entry[] = data?.globalYearlyActivity ?? [];
  const { data: chartData, groups, sortedGroupKeys: groupKeys, userColorMap, userNameMap } = buildChartData(entries);

  const chartConfig = Object.fromEntries(
    [...groups.entries()].map(([key, { contributors, stripeColors }]) => [
      key,
      { label: groupLabel(contributors), color: stripeColors[0] },
    ])
  );

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm font-semibold">{t("global.yearlyActivity")}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col gap-2 px-2 pb-2">
        <ChartContainer config={chartConfig} className="flex-1 min-h-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <StripePatternDefs prefix={patternPrefix} sortedGroupKeys={groupKeys} groups={groups} />
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                interval={Math.max(0, Math.floor(chartData.length / 8))}
                height={20}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                allowDecimals={false}
                width={28}
              />
              <Tooltip
                content={(props) => <CustomTooltip {...props} groups={groups} />}
                cursor={false}
              />
              {groupKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={groupLabel(groups.get(key)!.contributors)}
                  stackId="a"
                  fill={`url(#${patternPrefix}-${i})`}
                  isAnimationActive={false}
                  radius={i === groupKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        {/* Legend — one entry per unique user */}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 shrink-0">
          {[...userColorMap.entries()].map(([userId, color]) => (
            <div key={userId} className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-muted-foreground">{userNameMap.get(userId)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
