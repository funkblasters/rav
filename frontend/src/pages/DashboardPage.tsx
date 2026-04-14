import { useQuery, gql, useApolloClient } from "@apollo/client";
import { useEffect } from "react";
import { LastFlagAdded } from "@/components/dashboard/LastFlagAdded";
import { MostWantedFlag } from "@/components/dashboard/MostWantedFlag";
import { FlagNews } from "@/components/dashboard/FlagNews";
import { Statistics } from "@/components/dashboard/Statistics";
import { DashboardCountryMap } from "@/components/dashboard/DashboardCountryMap";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

// ISO 3166-1 alpha-2 to numeric ID mapping - Complete list
const COUNTRY_CODE_TO_NUMERIC: Record<string, string> = {
  // Europe
  IT: "380", FR: "250", ES: "724", DE: "276", GB: "826", PT: "620", NL: "528", BE: "056", CH: "756", AT: "040",
  SE: "752", NO: "578", DK: "208", FI: "246", PL: "616", CZ: "203", Czechia: "203", HU: "348", RO: "642", GR: "300", IE: "372",
  IS: "352", LU: "442", MT: "470", CY: "196", SI: "705", HR: "191", BA: "070", RS: "688", ME: "499", MK: "807",
  AD: "020", LI: "438", MC: "492", SM: "674", VA: "336", RU: "643",
  BG: "100", AL: "008", XK: "999", SK: "703", LT: "440", LV: "428", EE: "233", BY: "112", UA: "804", MD: "498",
  GE: "268", AM: "051", AZ: "031",
  // Asia - East & Southeast
  JP: "392", CN: "156", KR: "410", KP: "408", MN: "496", TW: "158", HK: "344", MO: "446",
  TH: "764", VN: "704", KH: "116", LA: "418", MM: "104", MY: "458", SG: "702", ID: "360", PH: "608", BN: "096",
  TL: "626",
  // Asia - South
  IN: "356", PK: "586", BD: "050", LK: "144", NP: "524", BT: "064", MV: "462", AF: "004",
  // Asia - Middle East & Central
  IR: "364", IQ: "368", SY: "760", LB: "422", IL: "376", PS: "275", JO: "400", SA: "682", YE: "887", OM: "512",
  AE: "784", QA: "634", BH: "048", KW: "414", TR: "792", KZ: "398", UZ: "860", TM: "795", TJ: "762", KG: "417",
  // Americas - North
  US: "840", CA: "124", MX: "484",
  // Americas - Central
  GT: "320", BZ: "084", SV: "222", HN: "340", NI: "558", CR: "188", PA: "591",
  // Americas - South
  BR: "076", CO: "170", VE: "862", EC: "218", PE: "604", BO: "068", PY: "600", CL: "152", AR: "032", UY: "858",
  SR: "740", GY: "328",
  // Americas - Caribbean
  CU: "192", DO: "214", HT: "332", JM: "388", TT: "780", BS: "044", BB: "052", LC: "662", GD: "308", AG: "028",
  DM: "212", PR: "630", KN: "659", VC: "670",
  // Africa - North
  EG: "818", LY: "434", TN: "788", DZ: "012", MA: "504",
  // Africa - West
  NG: "566", GH: "288", CI: "384", SN: "686", ML: "466", MR: "478", BJ: "204", TG: "768", LR: "430", SL: "694",
  GN: "324", GW: "624", GM: "270", BF: "854", NE: "562", CV: "132",
  // Africa - Central & East
  SD: "729", SS: "728", ET: "231", KE: "404", TZ: "834", UG: "800", RW: "646", BI: "108", DJ: "262", SO: "706",
  ER: "232", CM: "120", GA: "266", CG: "178", CD: "180", CF: "140", TD: "148",
  // Africa - South
  ZA: "710", ZW: "716", ZM: "894", BW: "072", NA: "516", AO: "024", MZ: "508", MW: "454", MG: "450", MU: "480",
  SC: "690", SZ: "748", LS: "426", KM: "174", GQ: "226", ST: "678",
  // Oceania - Australia & NZ
  AU: "036", NZ: "554",
  // Oceania - Melanesia
  FJ: "242", PG: "598", SB: "090", VU: "548",
  // Oceania - Polynesia
  WS: "882", TO: "776", KI: "296", TV: "798", PF: "258", WF: "876",
  // Oceania - Micronesia
  FM: "583", PW: "585", MH: "584", NR: "520", GU: "316",
  // Other
  XX: "000", XM: "999",
};

const FLAGS_GEO = gql`
  query FlagsGeo {
    flagsGeo {
      countryCode
    }
    flagsGeoAll {
      countryCode
    }
  }
`;

export function DashboardPage() {
  const { t } = useTranslation();
  const client = useApolloClient();
  const { data, refetch } = useQuery(FLAGS_GEO);

  // Refetch all dashboard queries on mount and window focus
  useEffect(() => {
    refetch();
    // Refetch other dashboard queries
    client.refetchQueries({
      include: ["LastFlag", "MostWantedFlag", "FlagNews", "Statistics", "TopMembers", "MyProfile", "GetFlags"],
    });

    const handleFocus = () => {
      refetch();
      client.refetchQueries({
        include: ["LastFlag", "MostWantedFlag", "FlagNews", "Statistics", "TopMembers", "MyProfile", "GetFlags"],
      });
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetch, client]);

  // Map ISO alpha-2 country codes to numeric IDs for highlighting
  // National flags only (default view)
  const nationalFlagsNumericIds = new Set<string>(
    (data?.flagsGeo ?? [])
      .map((flag: { countryCode: string }) => COUNTRY_CODE_TO_NUMERIC[flag.countryCode])
      .filter(Boolean)
  );

  // All countries with any flags including regional (toggled view)
  const allFlagsNumericIds = new Set<string>(
    (data?.flagsGeoAll ?? [])
      .map((flag: { countryCode: string }) => COUNTRY_CODE_TO_NUMERIC[flag.countryCode])
      .filter(Boolean)
  );

  return (
    <div className="space-y-8">
      {/* Latest Addition and Statistics — side by side, half width each */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 sm:h-96 lg:h-[28rem]"><LastFlagAdded /></div>
        <div className="h-[26rem] sm:h-96 lg:h-[28rem]"><Statistics /></div>
      </div>

      {/* Most Wanted and News — stack on mobile, side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 sm:h-96 lg:h-[28rem]"><MostWantedFlag /></div>
        <div className="h-80 sm:h-96 lg:h-[28rem]"><FlagNews /></div>
      </div>

      {/* Country map — full width, taller */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {t("dashboard.maps.countries")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[28rem] sm:h-[36rem] md:h-[40rem] lg:h-[44rem]">
            <DashboardCountryMap
              nationalFlagsNumericIds={nationalFlagsNumericIds}
              allFlagsNumericIds={allFlagsNumericIds}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
