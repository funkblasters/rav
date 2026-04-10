import { useTranslation } from "react-i18next";
import { MyFlagsList } from "@/components/stats/MyFlagsList";
import { ContinentsPieChart } from "@/components/stats/ContinentsPieChart";
import { YearlyActivityHistogram } from "@/components/stats/YearlyActivityHistogram";
import { UserFlagsChoropleth } from "@/components/stats/UserFlagsChoropleth";

export function StatsPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Page Title */}
      <div className="px-4 py-6 shrink-0">
        <h1 className="text-2xl font-bold">{t("stats.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("stats.subtitle")}</p>
      </div>

      {/* Mobile Layout — stacked */}
      <div className="flex-1 min-h-0 flex flex-col gap-6 px-4 pb-4 overflow-y-auto lg:hidden">
        <div className="min-h-[250px]">
          <ContinentsPieChart />
        </div>
        <div className="min-h-[250px]">
          <YearlyActivityHistogram />
        </div>
        <div className="min-h-[300px]">
          <UserFlagsChoropleth />
        </div>
        <div className="min-h-[300px] flex-1">
          <MyFlagsList />
        </div>
      </div>

      {/* Desktop Layout — grid with areas */}
      <div
        className="hidden lg:grid flex-1 min-h-0 gap-6 px-4 pb-4 overflow-hidden"
        style={{
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gridTemplateAreas: `"list pie bar" "list map map"`,
        }}
      >
        {/* Left: My Flags List */}
        <div style={{ gridArea: "list" }} className="min-h-0 overflow-hidden">
          <MyFlagsList />
        </div>

        {/* Top-left: Continents Pie Chart */}
        <div style={{ gridArea: "pie" }} className="min-h-0 overflow-hidden">
          <ContinentsPieChart />
        </div>

        {/* Top-right: Yearly Activity Histogram */}
        <div style={{ gridArea: "bar" }} className="min-h-0 overflow-hidden">
          <YearlyActivityHistogram />
        </div>

        {/* Bottom: User Flags Choropleth */}
        <div style={{ gridArea: "map" }} className="min-h-0 overflow-hidden">
          <UserFlagsChoropleth />
        </div>
      </div>
    </div>
  );
}
