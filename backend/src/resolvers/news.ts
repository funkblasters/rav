import { XMLParser } from "fast-xml-parser";
import type { AppContext } from "../context.js";
import { prisma } from "../db.js";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source?: string;
  imageUrl?: string;
}

// 15-minute cache so we don't hammer Google News
let cache: { items: NewsItem[]; ts: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;

// Political/geopolitical flag news — new national flags, changes, disputes, referendums.
// Excludes sports (NFL, football, team jerseys etc.).
// Biased toward Italian and broader international coverage.
const FEED_URL =
  "https://news.google.com/rss/search?q=" +
  encodeURIComponent(
    '(vexillology OR "national flag" OR "flag change" OR "flag redesign"' +
    ' OR "flag dispute" OR "flag referendum" OR "flag independence"' +
    ' OR "new flag" OR "bandiera" OR "drapeau national" OR "bandera nacional"' +
    ' OR "bandeira nacional")' +
    " -NFL -NBA -soccer -football -rugby -cricket -sport -jersey -team -league"
  ) +
  "&hl=en&gl=IT&ceid=IT:en";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => name === "item",
});

function cleanTitle(raw: string): string {
  // Google News appends " - Publisher Name" to titles
  return raw.replace(/\s*-\s*[^-]+$/, "").trim();
}

/** Extract first <img src="..."> from an HTML string */
function extractImg(html: string): string | undefined {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1];
}

async function fetchFeed(): Promise<NewsItem[]> {
  const res = await fetch(FEED_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; RAV-flag-club/1.0)" },
  });
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
  const xml = await res.text();
  const parsed = parser.parse(xml);
  const rawItems: Array<Record<string, unknown>> =
    parsed?.rss?.channel?.item ?? [];

  return rawItems.map((item) => {
    const sourceRaw = item["source"];
    let source: string | undefined;
    if (sourceRaw && typeof sourceRaw === "object") {
      source = String((sourceRaw as Record<string, unknown>)["#text"] ?? "");
    } else if (typeof sourceRaw === "string") {
      source = sourceRaw;
    }

    // Google News sometimes embeds a thumbnail in the <description> HTML
    const description = String(item["description"] ?? "");
    const imageUrl = extractImg(description);

    return {
      title: cleanTitle(String(item["title"] ?? "")),
      link: String(item["link"] ?? ""),
      pubDate: String(item["pubDate"] ?? ""),
      source,
      imageUrl,
    };
  });
}

export const newsResolvers = {
  Query: {
    newsItems: async (_: unknown, args: { limit?: number }, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const limit = args.limit ?? 8;
      const now = Date.now();
      if (cache && now - cache.ts < CACHE_TTL_MS) {
        return cache.items.slice(0, limit);
      }
      const items = await fetchFeed();
      cache = { items, ts: now };
      return items.slice(0, limit);
    },
    featuredNewsItem: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const settings = await prisma.settings.findUnique({ where: { id: "app" } });
      if (!settings?.featuredNewsTitle) return null;
      return {
        title: settings.featuredNewsTitle,
        link: settings.featuredNewsLink || "",
        pubDate: new Date().toISOString(),
        imageUrl: settings.featuredNewsImageUrl,
      };
    },
  },
  Mutation: {
    setFeaturedNews: async (
      _: unknown,
      args: { title: string; link: string; imageUrl?: string },
      ctx: AppContext
    ) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      const settings = await prisma.settings.upsert({
        where: { id: "app" },
        update: {
          featuredNewsTitle: args.title,
          featuredNewsLink: args.link,
          featuredNewsImageUrl: args.imageUrl,
        },
        create: {
          id: "app",
          featuredNewsTitle: args.title,
          featuredNewsLink: args.link,
          featuredNewsImageUrl: args.imageUrl,
        },
      });
      return {
        title: settings.featuredNewsTitle!,
        link: settings.featuredNewsLink || "",
        pubDate: new Date().toISOString(),
        imageUrl: settings.featuredNewsImageUrl,
      };
    },
    clearFeaturedNews: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      await prisma.settings.upsert({
        where: { id: "app" },
        update: {
          featuredNewsTitle: null,
          featuredNewsLink: null,
          featuredNewsImageUrl: null,
        },
        create: { id: "app" },
      });
      return true;
    },
  },
};
