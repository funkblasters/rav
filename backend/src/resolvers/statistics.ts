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
  },
};
