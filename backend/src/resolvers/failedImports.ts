import type { AppContext } from "../context.js";
import { prisma } from "../db.js";

export const failedImportsResolvers = {
  Query: {
    failedImports: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      return prisma.failedImport.findMany({ orderBy: { createdAt: "desc" } });
    },
  },
  Mutation: {
    clearFailedImport: async (_: unknown, args: { id: string }, ctx: AppContext) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      await prisma.failedImport.delete({ where: { id: args.id } });
      return true;
    },
    clearAllFailedImports: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      await prisma.failedImport.deleteMany();
      return true;
    },
  },
};
