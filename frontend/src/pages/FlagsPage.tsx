import { useQuery, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";

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

    const handleFocus = () => {
      refetch();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetch]);

  // Deduplicate flags by name, keeping first occurrence
  const allFlags: Flag[] = data?.flags ?? [];
  const seenFlagNames = new Set<string>();
  const flags = allFlags.filter((flag) => {
    if (seenFlagNames.has(flag.name)) return false;
    seenFlagNames.add(flag.name);
    return true;
  });

  const [proportional, setProportional] = useState(false);
  const [cellHeight, setCellHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = (width: number) => {
      const cols = width >= 1024 ? 8 : width >= 768 ? 6 : width >= 640 ? 4 : 3;
      const gap = 12;
      const cellWidth = (width - (cols - 1) * gap) / cols;
      setCellHeight(Math.round(cellWidth * (2 / 3)));
    };
    const ro = new ResizeObserver(([entry]) => compute(entry.contentRect.width));
    ro.observe(el);
    compute(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("flags.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("flags.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <button
            type="button"
            role="switch"
            aria-checked={proportional}
            onClick={() => setProportional((v) => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
              proportional ? "bg-primary" : "bg-muted-foreground/40"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                proportional ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{t("flags.realProportions")}</span>
        </div>
      </div>

      {loading ? (
        <div ref={containerRef} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="aspect-[3/2] rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      ) : flags.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("flags.noFlags")}</p>
      ) : proportional ? (
        <div ref={containerRef} className="flex flex-wrap gap-3">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="group relative overflow-hidden shrink-0 cursor-default"
              style={{ height: cellHeight || undefined }}
              title={flag.name}
            >
              {flag.imageUrl ? (
                <img
                  src={flag.imageUrl}
                  alt={flag.name}
                  loading="lazy"
                  className="h-full w-auto object-contain"
                />
              ) : (
                <div className="h-full px-2 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground text-center leading-tight">
                    {flag.name}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1">
                <span className="text-white text-[10px] font-medium text-center leading-tight line-clamp-2">
                  {flag.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div ref={containerRef} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
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
