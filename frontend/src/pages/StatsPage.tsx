import { MyFlagsList } from "@/components/stats/MyFlagsList";
import { ContinentsPieChart } from "@/components/stats/ContinentsPieChart";
import { PlaceholderChart } from "@/components/stats/PlaceholderChart";
import { CollectingActivityLineChart } from "@/components/stats/CollectingActivityLineChart";

export function StatsPage() {

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[calc(100vh-120px)]">
      {/* Left: My Flags List */}
      <div className="lg:col-span-1">
        <MyFlagsList />
      </div>

      {/* Right: Charts Grid */}
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 content-start">
        {/* Top-left: Continents Pie Chart */}
        <ContinentsPieChart />

        {/* Top-right: Placeholder Chart */}
        <PlaceholderChart />

        {/* Bottom: Collecting Activity Line Chart (spans 2 columns) */}
        <div className="sm:col-span-2">
          <CollectingActivityLineChart />
        </div>
      </div>
    </div>
  );
}
