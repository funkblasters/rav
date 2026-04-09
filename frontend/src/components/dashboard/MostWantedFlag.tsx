import { useQuery, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QueryStateRenderer } from "@/components/QueryStateRenderer";

const MOST_WANTED_FLAG = gql`
  query MostWantedFlag {
    mostWantedFlag {
      id
      name
      imageUrl
      acquiredAt
      description
    }
  }
`;

export function MostWantedFlag() {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useQuery(MOST_WANTED_FLAG);
  const flag = data?.mostWantedFlag;

  useEffect(() => {
    const handleFocus = () => refetch();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetch]);

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-base font-semibold">{t("dashboard.mostWantedFlag")}</CardTitle>
        <CardDescription>{t("dashboard.mostWantedSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0 overflow-hidden flex flex-col">
        <QueryStateRenderer
          loading={loading}
          error={error}
          empty={!flag && !loading}
          emptyMessage={t("common.noData")}
        >
          {flag && (
            <div className="flex flex-col h-full min-h-0">
              {/* Top: Flag image — 3/4 of height */}
              <div className="flex-1 min-h-0 overflow-hidden rounded-t-lg">
                {flag.imageUrl ? (
                  <img
                    src={flag.imageUrl}
                    alt={flag.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-6xl">
                    🏳️
                  </div>
                )}
              </div>

              {/* Bottom: Metadata — 1/4 of height with padding */}
              <div className="p-4 border-t space-y-2 shrink-0">
                <p className="font-semibold text-base line-clamp-1">{flag.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {flag.description || t("dashboard.noDescription")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(flag.acquiredAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </QueryStateRenderer>
      </CardContent>
    </Card>
  );
}
