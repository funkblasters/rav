import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import type { AppContext } from "../context.js";
import { prisma } from "../db.js";
import { countryNameToISOCode, subdivisionToCountryCode } from "../countryCodeMappings.js";
import { validateString, validateOptionalFloat, INPUT_LIMITS } from "../validation.js";

export const flagResolvers = {
  Query: {
    flags: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      return prisma.flag.findMany({ where: { isPublic: true }, include: { contributors: true }, orderBy: { acquiredAt: "desc" } });
    },
    allFlags: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      return prisma.flag.findMany({ include: { contributors: true }, orderBy: { name: "asc" } });
    },
    flagsGeo: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      return prisma.flag.findMany({
        where: { isPublic: true, subdivisionCode: null },
        select: { countryCode: true },
      });
    },
    flagsGeoAll: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      return prisma.flag.findMany({
        where: { isPublic: true },
        select: { countryCode: true },
      });
    },
    flag: async (_: unknown, args: { id: string }, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const flag = await prisma.flag.findUnique({ where: { id: args.id }, include: { contributors: true } });
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
        include: { contributors: true },
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
        where: { contributors: { some: { id: ctx.user.id } } },
        include: { contributors: true },
        orderBy: { acquiredAt: "desc" },
      });
    },
    flagsByUser: async (_: unknown, args: { userId: string }, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const user = await prisma.user.findUnique({ where: { id: args.userId }, select: { id: true } });
      if (!user) throw new Error("User not found");
      return prisma.flag.findMany({
        where: { isPublic: true, contributors: { some: { id: args.userId } } },
        include: { contributors: true },
        orderBy: { acquiredAt: "desc" },
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

      // Validate inputs
      validateString(args.name, INPUT_LIMITS.name, "name", true);
      if (args.city) validateString(args.city, INPUT_LIMITS.city, "city");
      if (args.description) validateString(args.description, INPUT_LIMITS.description, "description");
      if (args.imageUrl) validateString(args.imageUrl, INPUT_LIMITS.imageUrl, "imageUrl");
      if (args.latitude !== undefined) validateOptionalFloat(args.latitude, "latitude", -90, 90);
      if (args.longitude !== undefined) validateOptionalFloat(args.longitude, "longitude", -180, 180);

      let ownerId = ctx.user.id;
      if (args.addedByUserId) {
        if (ctx.user.role !== "ADMIN") throw new Error("Forbidden");
        const target = await prisma.user.findUnique({ where: { id: args.addedByUserId } });
        if (!target) throw new Error("User not found");
        ownerId = target.id;
      }

      // Resolve country/subdivision codes (match import logic)
      let countryCode: string;
      let subdivisionCode: string | null;

      if (args.countryCode && args.subdivisionCode) {
        // Both provided explicitly
        countryCode = args.countryCode;
        subdivisionCode = args.subdivisionCode;
      } else if (args.countryCode) {
        // Only country code provided
        countryCode = args.countryCode;
        subdivisionCode = args.subdivisionCode ?? null;
      } else {
        // Try to lookup from flag name (match import behavior)
        const subdivCountryCode = subdivisionToCountryCode[args.name.trim()];
        if (subdivCountryCode) {
          // This is a known subdivision
          countryCode = subdivCountryCode;
          subdivisionCode = args.name.trim();
        } else {
          // Try to lookup as a country
          countryCode = countryNameToISOCode[args.name.trim()] ?? "XX";
          // If unknown (mapped to "XX"), use flag name as subdivision to avoid conflicts
          subdivisionCode = countryCode === "XX" ? args.name.trim() : (args.subdivisionCode ?? null);
        }
      }
      // If a flag with the same identity already exists, add the new people as
      // contributors to that record rather than inserting a duplicate row.
      const existingFlag = await prisma.flag.findFirst({
        where: { countryCode, subdivisionCode },
        include: { contributors: { select: { id: true } } },
      });

      if (existingFlag) {
        const alreadyContributor = existingFlag.contributors.some((c) => c.id === ownerId);
        if (alreadyContributor) {
          throw new Error("Hai già questa bandiera nella tua collezione");
        }

        const newContributorIds = [
          ownerId,
          ...(args.togetherWithUserIds ?? []),
        ];
        return prisma.flag.update({
          where: { id: existingFlag.id },
          data: {
            contributors: {
              connect: newContributorIds.map((id) => ({ id })),
            },
          },
          include: { addedBy: true, contributors: true },
        });
      }

      const isPublic = args.isPublic ?? true;
      return prisma.flag.create({
        data: {
          id: randomUUID(),
          name: args.name,
          countryCode,
          subdivisionCode,
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
          contributors: {
            connect: [
              { id: ownerId },
              ...(args.togetherWithUserIds?.map((id) => ({ id })) ?? []),
            ],
          },
        },
        include: { addedBy: true, contributors: true },
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
        include: { addedBy: true, contributors: true },
      });
    },
    updateFlag: async (
      _: unknown,
      args: { id: string; name?: string; imageUrl?: string; countryCode?: string; subdivisionCode?: string; continent?: string; contributorIds?: string[]; properties?: { lgbt?: boolean | null; notRecognized?: boolean | null; religious?: boolean | null; historic?: boolean | null } | null },
      ctx: AppContext
    ) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      const flag = await prisma.flag.findUnique({ where: { id: args.id } });
      if (!flag) throw new Error("Flag not found");

      const updateData: Prisma.FlagUpdateInput = {};
      if (args.name !== undefined) updateData.name = args.name;
      if (args.imageUrl !== undefined) updateData.imageUrl = args.imageUrl ?? null;
      if (args.countryCode !== undefined) updateData.countryCode = args.countryCode;
      if (args.subdivisionCode !== undefined) updateData.subdivisionCode = args.subdivisionCode || null;
      if (args.continent !== undefined) updateData.continent = args.continent || null;
      if (args.properties !== undefined) updateData.properties = args.properties ?? Prisma.DbNull;

      if (args.contributorIds !== undefined) {
        if (args.contributorIds.length === 0) throw new Error("contributorIds must not be empty");
        if (args.contributorIds.length > 50) throw new Error("Too many contributors");
        const uniqueIds = [...new Set(args.contributorIds)];
        const found = await prisma.user.findMany({ where: { id: { in: uniqueIds } }, select: { id: true } });
        if (found.length !== uniqueIds.length) throw new Error("One or more contributor IDs not found");
        updateData.contributors = { set: uniqueIds.map((id) => ({ id })) };
      }

      return prisma.flag.update({
        where: { id: args.id },
        data: updateData,
        include: { addedBy: true, contributors: true },
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
        include: { addedBy: true, contributors: true },
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
    togetherWith: (flag: { addedById: string; contributors?: { id: string; displayName: string }[] }) =>
      (flag.contributors ?? []).filter((c) => c.id !== flag.addedById),
    contributors: (flag: { contributors?: { id: string; displayName: string }[] }) =>
      flag.contributors ?? [],
    properties: (flag: { properties?: unknown }) => {
      if (!flag.properties || typeof flag.properties !== "object") return null;
      const p = flag.properties as Record<string, unknown>;
      return {
        lgbt: p.lgbt ?? null,
        notRecognized: p.notRecognized ?? null,
        religious: p.religious ?? null,
        historic: p.historic ?? null,
      };
    },
  },
};
