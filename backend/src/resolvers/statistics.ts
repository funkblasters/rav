import type { AppContext } from "../context.js";
import { users } from "./auth.js";
import { flags } from "./flags.js";

export const statisticsResolvers = {
  Query: {
    topMembers: (_: unknown, args: { limit?: number }, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const stats = users
        .map((u) => ({
          id: u.id,
          displayName: u.displayName,
          flagsCount: flags.filter((f) => f.addedBy === u.id).length,
        }))
        .sort((a, b) => b.flagsCount - a.flagsCount);
      return args.limit ? stats.slice(0, args.limit) : stats;
    },
  },
};
