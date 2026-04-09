import type { AppContext } from "../context.js";
import { prisma } from "../db.js";

export const statisticsResolvers = {
  Query: {
    topMembers: async (_: unknown, args: { limit?: number }, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const users = await prisma.user.findMany({
        include: {
          flagsAdded: {
            where: { isPublic: true },
            select: { id: true },
          },
        },
        orderBy: {
          flagsAdded: {
            _count: "desc",
          },
        },
        take: args.limit ?? undefined,
      });
      return users.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        clubRole: u.clubRole,
        flagsCount: u.flagsAdded.length,
      }));
    },
  },
};
