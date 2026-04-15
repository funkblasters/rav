import type { AppContext } from "../context.js";
import { prisma } from "../db.js";

export const newsResolvers = {
  Query: {
    newsItems: async (_: unknown, args: { limit?: number }, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const items = await prisma.newsItem.findMany({
        orderBy: { pubDate: "desc" },
        ...(args.limit ? { take: args.limit } : {}),
      });
      return items.map((item) => ({
        id: item.id,
        title: item.title,
        link: item.link,
        pubDate: item.pubDate.toISOString(),
        source: item.source,
        imageUrl: item.imageUrl,
      }));
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
        body: settings.featuredNewsBody,
      };
    },
  },

  Mutation: {
    createNewsItem: async (
      _: unknown,
      args: { title: string; link: string; imageUrl?: string; source?: string; pubDate: string },
      ctx: AppContext
    ) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      const item = await prisma.newsItem.create({
        data: {
          title: args.title,
          link: args.link,
          imageUrl: args.imageUrl ?? null,
          source: args.source ?? null,
          pubDate: new Date(args.pubDate),
        },
      });
      return {
        id: item.id,
        title: item.title,
        link: item.link,
        pubDate: item.pubDate.toISOString(),
        source: item.source,
        imageUrl: item.imageUrl,
      };
    },

    deleteNewsItem: async (_: unknown, args: { id: string }, ctx: AppContext) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      await prisma.newsItem.delete({ where: { id: args.id } });
      return true;
    },

    setFeaturedNews: async (
      _: unknown,
      args: { title: string; link: string; imageUrl?: string; body?: string },
      ctx: AppContext
    ) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      const settings = await prisma.settings.upsert({
        where: { id: "app" },
        update: {
          featuredNewsTitle: args.title,
          featuredNewsLink: args.link,
          featuredNewsImageUrl: args.imageUrl,
          featuredNewsBody: args.body,
        },
        create: {
          id: "app",
          featuredNewsTitle: args.title,
          featuredNewsLink: args.link,
          featuredNewsImageUrl: args.imageUrl,
          featuredNewsBody: args.body,
        },
      });
      return {
        title: settings.featuredNewsTitle!,
        link: settings.featuredNewsLink || "",
        pubDate: new Date().toISOString(),
        imageUrl: settings.featuredNewsImageUrl,
        body: settings.featuredNewsBody,
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
