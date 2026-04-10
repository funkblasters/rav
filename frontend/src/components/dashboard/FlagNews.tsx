import { useQuery, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
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
      imageUrl
    }
    featuredNewsItem {
      title
      link
      imageUrl
    }
  }
`;

export function FlagNews() {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useQuery(NEWS_ITEMS);

  useEffect(() => {
    const handleFocus = () => refetch();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetch]);

  const items: Array<{
    title: string;
    link: string;
    pubDate: string;
    source?: string;
    imageUrl?: string;
  }> = data?.newsItems ?? [];

  const featured = data?.featuredNewsItem;

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
          empty={!items.length && !featured && !loading}
        >
          <div className="divide-y flex flex-col h-full">
            {/* Featured News Item */}
            {featured && (
              <a
                href={featured.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 p-4 hover:bg-accent transition-colors group flex-shrink-0 border-b"
              >
                {featured.imageUrl && (
                  <img
                    src={featured.imageUrl}
                    alt={featured.title}
                    className="w-24 h-24 object-cover rounded shrink-0"
                  />
                )}
                <div className="flex flex-col justify-center min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug line-clamp-3 group-hover:text-accent-foreground">
                    {featured.title}
                  </p>
                  <ExternalLink size={12} className="text-muted-foreground shrink-0 mt-2" />
                </div>
              </a>
            )}

            {/* Regular News Items */}
            <ul className="divide-y flex-1 overflow-y-auto">
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
          </div>
        </QueryStateRenderer>
      </CardContent>
    </Card>
  );
}
