import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export function StatsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.statistics")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("common.noData")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
