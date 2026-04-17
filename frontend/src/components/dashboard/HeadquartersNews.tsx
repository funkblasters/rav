import { useQuery, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QueryStateRenderer } from "@/components/QueryStateRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { FiavFlag } from "@/components/FiavFlag";

const HQ_NEWS = gql`
  query HeadquartersNews {
    headquartersNews {
      title
      excerpt
      imageUrl
      link
      pubDate
    }
  }
`;

export function HeadquartersNews() {
  const { t } = useTranslation();
  const { data, loading, error } = useQuery(HQ_NEWS);

  const news = data?.headquartersNews;

  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          {t("dashboard.headquartersNews")}
        </CardTitle>
        <CardDescription>{t("dashboard.headquartersNewsSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        <QueryStateRenderer
          loading={loading}
          error={error}
          empty={!news && !loading}
          skeleton={
            <div className="flex flex-col gap-3 p-4 h-full">
              <Skeleton className="w-full h-24 rounded" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full mt-1" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          }
        >
          {news && (
            <a
              href={news.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-3 p-4 hover:bg-accent transition-colors group h-full overflow-hidden"
            >
              {/* Image or FIAV placeholder */}
              <div className="w-full h-24 rounded border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {news.imageUrl ? (
                  <img
                    src={news.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <FiavFlag className="w-12 h-9" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-2 overflow-hidden">
                <p className="font-medium leading-snug line-clamp-2 group-hover:text-accent-foreground">
                  {news.title}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                  {news.excerpt}
                </p>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    {new Date(news.pubDate).toLocaleDateString()}
                  </span>
                  <ExternalLink size={12} className="text-muted-foreground" />
                </div>
              </div>
            </a>
          )}
        </QueryStateRenderer>
      </CardContent>
    </Card>
  );
}
