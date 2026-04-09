import type { AppContext } from "../context.js";
import { prisma } from "../db.js";

let customMostWanted: { id: string; name: string; imageUrl?: string; acquiredAt: string; description?: string; addedBy: string } | null = null;

export const flagResolvers = {
  Query: {
    flags: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      return prisma.flag.findMany({ where: { isPublic: true } });
    },
    flag: async (_: unknown, args: { id: string }, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const flag = await prisma.flag.findUnique({ where: { id: args.id } });
      if (!flag) return null;
      if (!flag.isPublic && flag.addedById !== ctx.user.id && ctx.user.role !== "ADMIN")
        return null;
      return flag;
    },
    lastFlag: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const flag = await prisma.flag.findFirst({
        where: { isPublic: true },
        orderBy: { acquiredAt: "desc" },
      });
      return flag;
    },
    mostWantedFlag: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      if (customMostWanted) return customMostWanted;
      const flag = await prisma.flag.findFirst({
        where: { isPublic: true },
        orderBy: { acquiredAt: "asc" },
      });
      return flag;
    },
    myFlags: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      return prisma.flag.findMany({
        where: {
          OR: [
            { addedById: ctx.user.id },
            { togetherWith: { some: { id: ctx.user.id } } },
          ],
        },
      });
    },
  },
  Mutation: {
    addFlag: async (
      _: unknown,
      args: {
        name: string;
        countryCode?: string;
        subdivisionCode?: string;
        city?: string;
        latitude?: number;
        longitude?: number;
        imageUrl?: string;
        acquiredAt: string;
        isPublic?: boolean;
        description?: string;
        continent?: string;
        addedByUserId?: string;
        togetherWithUserIds?: string[];
      },
      ctx: AppContext
    ) => {
      if (!ctx.user) throw new Error("Unauthenticated");

      let ownerId = ctx.user.id;
      if (args.addedByUserId) {
        if (ctx.user.role !== "ADMIN") throw new Error("Forbidden");
        const target = await prisma.user.findUnique({ where: { id: args.addedByUserId } });
        if (!target) throw new Error("User not found");
        ownerId = target.id;
      }

      return prisma.flag.create({
        data: {
          name: args.name,
          countryCode: args.countryCode ?? "XX",
          subdivisionCode: args.subdivisionCode,
          city: args.city,
          latitude: args.latitude,
          longitude: args.longitude,
          imageUrl: args.imageUrl,
          acquiredAt: args.acquiredAt,
          isPublic: args.isPublic ?? true,
          description: args.description,
          continent: args.continent,
          addedById: ownerId,
          togetherWith: args.togetherWithUserIds?.length ? { connect: args.togetherWithUserIds.map((id) => ({ id })) } : undefined,
        },
        include: { addedBy: true, togetherWith: true },
      });
    },
    deleteFlag: async (_: unknown, args: { id: string }, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const flag = await prisma.flag.findUnique({ where: { id: args.id } });
      if (!flag) throw new Error("Flag not found");
      if (flag.addedById !== ctx.user.id && ctx.user.role !== "ADMIN")
        throw new Error("Forbidden");
      await prisma.flag.delete({ where: { id: args.id } });
      return true;
    },
    makePublic: async (_: unknown, args: { flagId: string }, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const flag = await prisma.flag.findUnique({ where: { id: args.flagId } });
      if (!flag) throw new Error("Flag not found");
      if (flag.addedById !== ctx.user.id && ctx.user.role !== "ADMIN")
        throw new Error("Forbidden");
      return prisma.flag.update({ where: { id: args.flagId }, data: { isPublic: true } });
    },
    setMostWanted: async (
      _: unknown,
      args: { name: string; imageUrl?: string; acquiredAt: string; description?: string },
      ctx: AppContext
    ) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      customMostWanted = {
        id: "most-wanted-custom",
        name: args.name,
        imageUrl: args.imageUrl,
        acquiredAt: args.acquiredAt,
        description: args.description,
        addedBy: ctx.user.id,
      };
      return customMostWanted;
    },
    clearMostWanted: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      customMostWanted = null;
      return true;
    },
  },
};
