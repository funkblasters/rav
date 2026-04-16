import type { AppContext } from "../context.js";
import { prisma } from "../db.js";

export const statisticsResolvers = {
  Query: {
    topMembers: async (_: unknown, args: { limit?: number }, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const users = await prisma.user.findMany({
        include: {
          contributedFlags: {
            where: { isPublic: true },
            select: { id: true },
          },
        },
      });

      const usersWithCounts = users.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        clubRole: u.clubRole,
        flagsCount: u.contributedFlags.length,
        avatarUrl: u.avatarUrl,
      }));

      usersWithCounts.sort((a, b) => b.flagsCount - a.flagsCount);

      return args.limit ? usersWithCounts.slice(0, args.limit) : usersWithCounts;
    },

    globalStats: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const [totalFlags, membersCount, registeredCount] = await Promise.all([
        prisma.flag.count({ where: { isPublic: true } }),
        prisma.user.count({ where: { status: { not: "EXTERNAL" } } }),
        prisma.user.count({ where: { status: "REGISTERED" } }),
      ]);
      return { totalFlags, membersCount, registeredCount };
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
