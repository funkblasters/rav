import { useQuery, gql } from "@apollo/client";
import { LastFlagAdded } from "@/components/dashboard/LastFlagAdded";
import { MostWantedFlag } from "@/components/dashboard/MostWantedFlag";
import { FlagNews } from "@/components/dashboard/FlagNews";
import { Statistics } from "@/components/dashboard/Statistics";
import { CountryChoropleth } from "@/components/dashboard/CountryChoropleth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

// ISO 3166-1 alpha-2 to numeric ID mapping
const COUNTRY_CODE_TO_NUMERIC: Record<string, string> = {
  IT: "380",
  FR: "250",
  ES: "724",
  DE: "276",
  GB: "826",
  PT: "620",
  NL: "528",
  BE: "056",
  CH: "756",
  AT: "040",
  SE: "752",
  NO: "578",
  DK: "208",
  FI: "246",
  PL: "616",
  CZ: "203",
  HU: "348",
  RO: "642",
  GR: "300",
  US: "840",
  CA: "124",
};

const FLAGS_GEO = gql`
  query FlagsGeo {
    flags {
      id
      countryCode
    }
  }
`;

export function DashboardPage() {
  const { t } = useTranslation();
  const { data } = useQuery(FLAGS_GEO);

  // Map ISO alpha-2 country codes to numeric IDs for highlighting
  const countryNumericIds = new Set<string>(
    (data?.flags ?? [])
      .map((flag: { countryCode: string }) => COUNTRY_CODE_TO_NUMERIC[flag.countryCode])
      .filter(Boolean)
  );

  return (
    <div className="space-y-8">
      {/* Latest Addition and Statistics — side by side, half width each */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto sm:h-96 lg:h-[28rem]">
        <LastFlagAdded />
        <Statistics />
      </div>

      {/* Most Wanted and News — stack on mobile, side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto sm:h-96 lg:h-[28rem]">
        <MostWantedFlag />
        <FlagNews />
      </div>

      {/* Country map — full width, taller */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {t("dashboard.maps.countries")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[28rem] sm:h-[36rem] lg:h-[44rem]">
            <CountryChoropleth highlightedNumericIds={countryNumericIds} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
