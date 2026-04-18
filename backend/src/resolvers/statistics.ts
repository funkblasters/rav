import type { AppContext } from "../context.js";
import { prisma } from "../db.js";

export const statisticsResolvers = {
  Query: {
    topMembers: async (_: unknown, args: { limit?: number }, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const users = await prisma.user.findMany({
        select: {
          id: true,
          displayName: true,
          clubRole: true,
          avatarUrl: true,
          _count: {
            select: {
              contributedFlags: { where: { isPublic: true } },
            },
          },
          contributedFlags: {
            where: { isPublic: true },
            select: { acquiredAt: true },
          },
        },
      });

      users.sort((a, b) => {
        const countDiff = b._count.contributedFlags - a._count.contributedFlags;
        if (countDiff !== 0) return countDiff;
        const maxDate = (flags: { acquiredAt: Date }[]) =>
          flags.reduce((max, f) => (f.acquiredAt > max ? f.acquiredAt : max), new Date(0));
        return maxDate(b.contributedFlags).getTime() - maxDate(a.contributedFlags).getTime();
      });

      const result = users.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        clubRole: u.clubRole,
        flagsCount: u._count.contributedFlags,
        avatarUrl: u.avatarUrl,
      }));

      return args.limit ? result.slice(0, args.limit) : result;
    },

    globalStats: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const [totalFlags, membersCount, registeredCount, lgbtFlags, historicFlags, notRecognizedFlags, religiousFlags] = await Promise.all([
        prisma.flag.count({ where: { isPublic: true } }),
        prisma.user.count({ where: { contributedFlags: { some: { isPublic: true } } } }),
        prisma.user.count({ where: { status: "REGISTERED" } }),
        prisma.flag.count({ where: { isPublic: true, properties: { path: ["lgbt"], equals: true } } }),
        prisma.flag.count({ where: { isPublic: true, properties: { path: ["historic"], equals: true } } }),
        prisma.flag.count({ where: { isPublic: true, properties: { path: ["notRecognized"], equals: true } } }),
        prisma.flag.count({ where: { isPublic: true, properties: { path: ["religious"], equals: true } } }),
      ]);
      return { totalFlags, membersCount, registeredCount, lgbtFlags, historicFlags, notRecognizedFlags, religiousFlags };
    },

    globalContinentsBreakdown: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const flags = await prisma.flag.findMany({
        where: { isPublic: true },
        select: { continent: true },
      });
      const counts: Record<string, number> = {};
      for (const flag of flags) {
        const c = (flag.continent ?? "unknown").toLowerCase();
        counts[c] = (counts[c] ?? 0) + 1;
      }
      return Object.entries(counts)
        .map(([continent, count]) => ({ continent, count }))
        .sort((a, b) => b.count - a.count);
    },

    globalYearlyActivity: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const flags = await prisma.flag.findMany({
        where: { isPublic: true },
        select: {
          acquiredAt: true,
          addedBy: { select: { id: true, displayName: true } },
          contributors: { select: { id: true, displayName: true } },
        },
      });
      const map = new Map<string, { year: number; groupKey: string; contributors: { id: string; displayName: string }[]; count: number }>();
      for (const flag of flags) {
        const year = new Date(flag.acquiredAt).getFullYear();
        // Fall back to addedBy for flags imported before the contributors relation was populated
        const contribs = flag.contributors.length > 0 ? flag.contributors : [flag.addedBy];
        const sorted = [...contribs].sort((a, b) => a.id.localeCompare(b.id));
        const groupKey = sorted.map((c) => c.id).join(",");
        const key = `${year}-${groupKey}`;
        const existing = map.get(key);
        if (existing) {
          existing.count++;
        } else {
          map.set(key, { year, groupKey, contributors: sorted, count: 1 });
        }
      }
      return Array.from(map.values()).sort((a, b) => a.year - b.year);
    },
  },
};
