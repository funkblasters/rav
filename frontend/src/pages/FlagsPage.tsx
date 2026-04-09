import { useQuery, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

const GET_FLAGS = gql`
  query GetFlags {
    flags {
      id
      name
      imageUrl
    }
  }
`;

interface Flag {
  id: string;
  name: string;
  imageUrl?: string;
}

export function FlagsPage() {
  const { t } = useTranslation();
  const { data, loading, refetch } = useQuery(GET_FLAGS);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Deduplicate flags by name, keeping first occurrence
  const allFlags: Flag[] = data?.flags ?? [];
  const seenFlagNames = new Set<string>();
  const flags = allFlags.filter((flag) => {
    if (seenFlagNames.has(flag.name)) return false;
    seenFlagNames.add(flag.name);
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("flags.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("flags.subtitle")}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="aspect-[3/2] rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      ) : flags.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("flags.noFlags")}</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="group relative rounded-md overflow-hidden border bg-muted/30 aspect-[3/2] cursor-default"
              title={flag.name}
            >
              {flag.imageUrl ? (
                <img
                  src={flag.imageUrl}
                  alt={flag.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs text-muted-foreground text-center px-1 leading-tight">
                    {flag.name}
                  </span>
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1">
                <span className="text-white text-[10px] font-medium text-center leading-tight line-clamp-2">
                  {flag.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
