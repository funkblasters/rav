import { useQuery, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QueryStateRenderer } from "@/components/QueryStateRenderer";

const NEWS_ITEMS = gql`
  query NewsItems {
    newsItems(limit: 4) {
      title
      link
      pubDate
      source
    }
  }
`;

export function FlagNews() {
  const { t } = useTranslation();
  const { data, loading, error } = useQuery(NEWS_ITEMS);

  const items: Array<{
    title: string;
    link: string;
    pubDate: string;
    source?: string;
  }> = data?.newsItems ?? [];

  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{t("dashboard.flagNews")}</CardTitle>
        <CardDescription>{t("dashboard.flagNewsSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto">
        <QueryStateRenderer
          loading={loading}
          error={error}
          empty={!items.length && !loading}
        >
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.link}>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-1 px-4 py-3 hover:bg-accent transition-colors group"
                >
                  <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-accent-foreground">
                    {item.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {item.source && <span>{item.source} · </span>}
                      {new Date(item.pubDate).toLocaleDateString()}
                    </p>
                    <ExternalLink size={12} className="text-muted-foreground shrink-0" />
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </QueryStateRenderer>
      </CardContent>
    </Card>
  );
}
