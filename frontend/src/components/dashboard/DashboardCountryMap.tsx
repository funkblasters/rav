import { useState } from "react";
import { CountryChoropleth } from "@/components/dashboard/CountryChoropleth";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

interface Props {
  /** ISO 3166-1 numeric codes of countries with national flags only */
  nationalFlagsNumericIds?: Set<string>;
  /** ISO 3166-1 numeric codes of countries with any flags (national + regional) */
  allFlagsNumericIds?: Set<string>;
}

export function DashboardCountryMap({
  nationalFlagsNumericIds = new Set(),
  allFlagsNumericIds = new Set(),
}: Props) {
  const { t } = useTranslation();
  const [showRegionalFlags, setShowRegionalFlags] = useState(false);

  const activeHighlights = showRegionalFlags ? allFlagsNumericIds : nationalFlagsNumericIds;

  return (
    <div className="w-full h-full rounded overflow-hidden bg-muted/30 flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-border/40 shrink-0">
        <Switch id="show-regional-flags" checked={showRegionalFlags} onCheckedChange={setShowRegionalFlags} />
        <Label htmlFor="show-regional-flags" className="cursor-pointer text-sm font-medium">
          {t("dashboard.maps.showRegionalFlags")}
        </Label>
      </div>
      <div className="flex-1 overflow-hidden">
        <CountryChoropleth highlightedNumericIds={activeHighlights} />
      </div>
    </div>
  );
}
