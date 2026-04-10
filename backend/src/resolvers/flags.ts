import { randomUUID } from "crypto";
import type { AppContext } from "../context.js";
import { prisma } from "../db.js";

export const flagResolvers = {
  Query: {
    flags: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      return prisma.flag.findMany({ where: { isPublic: true }, include: { togetherWith: true } });
    },
    allFlags: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      return prisma.flag.findMany({ include: { togetherWith: true }, orderBy: { name: "asc" } });
    },
    flagsGeo: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      return prisma.flag.findMany({
        where: { isPublic: true, subdivisionCode: null },
        select: { countryCode: true },
      });
    },
    flag: async (_: unknown, args: { id: string }, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const flag = await prisma.flag.findUnique({ where: { id: args.id }, include: { togetherWith: true } });
      if (!flag) return null;
      if (!flag.isPublic && flag.addedById !== ctx.user.id && ctx.user.role !== "ADMIN")
        return null;
      return flag;
    },
    lastFlag: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const flag = await prisma.flag.findFirst({
        where: { isPublic: true, publishedAt: { not: null } },
        orderBy: [{ acquiredAt: "desc" }, { publishedAt: "desc" }],
        include: { togetherWith: true },
      });
      return flag;
    },
    mostWantedFlag: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const settings = await prisma.settings.findUnique({ where: { id: "app" } });
      if (!settings?.mostWantedName) return null;
      return {
        id: "most-wanted-custom",
        name: settings.mostWantedName,
        imageUrl: settings.mostWantedImageUrl,
        acquiredAt: settings.mostWantedAcquiredAt,
        description: settings.mostWantedDescription,
        addedBy: { id: "system", displayName: "System" },
        togetherWith: [],
      };
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
        include: { togetherWith: true },
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
        acquiredAt: number;
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

      // Check if user already has a flag with this exact country/subdivision combination
      const countryCode = args.countryCode ?? "XX";
      const subdivisionCode = args.subdivisionCode ?? null;
      const existingFlag = await prisma.flag.findFirst({
        where: {
          addedById: ownerId,
          countryCode: countryCode,
          subdivisionCode: subdivisionCode,
        },
      });
      if (existingFlag) {
        throw new Error("Hai già questa bandiera nella tua collezione");
      }

      const isPublic = args.isPublic ?? true;
      return prisma.flag.create({
        data: {
          id: randomUUID(),
          name: args.name,
          countryCode: args.countryCode ?? "XX",
          subdivisionCode: args.subdivisionCode,
          city: args.city,
          latitude: args.latitude,
          longitude: args.longitude,
          imageUrl: args.imageUrl,
          acquiredAt: new Date(args.acquiredAt * 1000),
          isPublic,
          description: args.description,
          continent: args.continent,
          addedById: ownerId,
          publishedAt: isPublic ? new Date() : null,
          togetherWith: args.togetherWithUserIds?.length ? { connect: args.togetherWithUserIds.map((id) => ({ id })) } : undefined,
        },
        include: { addedBy: true, togetherWith: true },
      });
    },
    updateFlagImageUrl: async (
      _: unknown,
      args: { id: string; imageUrl?: string },
      ctx: AppContext
    ) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      const flag = await prisma.flag.findUnique({ where: { id: args.id } });
      if (!flag) throw new Error("Flag not found");
      return prisma.flag.update({
        where: { id: args.id },
        data: { imageUrl: args.imageUrl ?? null },
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
      return prisma.flag.update({
        where: { id: args.flagId },
        data: {
          isPublic: true,
          publishedAt: flag.publishedAt ?? new Date(),
        },
        include: { addedBy: true, togetherWith: true },
      });
    },
    setMostWanted: async (
      _: unknown,
      args: { name: string; imageUrl?: string; acquiredAt: number; description?: string },
      ctx: AppContext
    ) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      const settings = await prisma.settings.upsert({
        where: { id: "app" },
        update: {
          mostWantedName: args.name,
          mostWantedImageUrl: args.imageUrl,
          mostWantedAcquiredAt: new Date(args.acquiredAt * 1000),
          mostWantedDescription: args.description,
        },
        create: {
          id: "app",
          mostWantedName: args.name,
          mostWantedImageUrl: args.imageUrl,
          mostWantedAcquiredAt: new Date(args.acquiredAt * 1000),
          mostWantedDescription: args.description,
        },
      });
      return {
        id: "most-wanted-custom",
        name: settings.mostWantedName!,
        imageUrl: settings.mostWantedImageUrl,
        acquiredAt: settings.mostWantedAcquiredAt,
        description: settings.mostWantedDescription,
        addedBy: { id: "system", displayName: "System" },
        togetherWith: [],
      };
    },
    clearMostWanted: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      await prisma.settings.upsert({
        where: { id: "app" },
        update: {
          mostWantedName: null,
          mostWantedImageUrl: null,
          mostWantedAcquiredAt: null,
          mostWantedDescription: null,
        },
        create: { id: "app" },
      });
      return true;
    },
  },
  Flag: {
    addedBy: (flag: { addedById: string }) =>
      prisma.user.findUnique({ where: { id: flag.addedById } }),
    togetherWith: (flag: { togetherWith?: { id: string; displayName: string }[] }) =>
      flag.togetherWith ?? [],
  },
};
