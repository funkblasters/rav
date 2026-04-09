import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export function FlagsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{t("nav.flags")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("common.noData")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
