import type { AppContext } from "../context.js";
import { prisma } from "../db.js";
import { validateString, INPUT_LIMITS } from "../validation.js";

// Country code to continent mapping
const COUNTRY_TO_CONTINENT: Record<string, string> = {
  // Europe
  IT: "Europe",
  FR: "Europe",
  ES: "Europe",
  DE: "Europe",
  GB: "Europe",
  PT: "Europe",
  NL: "Europe",
  BE: "Europe",
  CH: "Europe",
  AT: "Europe",
  SE: "Europe",
  NO: "Europe",
  DK: "Europe",
  FI: "Europe",
  PL: "Europe",
  CZ: "Europe",
  HU: "Europe",
  RO: "Europe",
  GR: "Europe",
  IE: "Europe",
  HR: "Europe",
  SI: "Europe",
  SK: "Europe",
  BG: "Europe",
  RU: "Europe",
  UA: "Europe",
  TR: "Europe",

  // Americas
  US: "Americas",
  CA: "Americas",
  MX: "Americas",
  BR: "Americas",
  AR: "Americas",
  CL: "Americas",
  CO: "Americas",
  PE: "Americas",
  VE: "Americas",
  EC: "Americas",
  BO: "Americas",
  PY: "Americas",
  UY: "Americas",
  CR: "Americas",
  PA: "Americas",
  CU: "Americas",
  JM: "Americas",
  HT: "Americas",
  DO: "Americas",

  // Asia
  CN: "Asia",
  JP: "Asia",
  IN: "Asia",
  KR: "Asia",
  TH: "Asia",
  ID: "Asia",
  MY: "Asia",
  SG: "Asia",
  PH: "Asia",
  VN: "Asia",
  BD: "Asia",
  PK: "Asia",
  IR: "Asia",
  IQ: "Asia",
  SA: "Asia",
  AE: "Asia",
  IL: "Asia",
  KZ: "Asia",
  UZ: "Asia",
  TJ: "Asia",
  HK: "Asia",
  TW: "Asia",

  // Africa
  ZA: "Africa",
  EG: "Africa",
  NG: "Africa",
  ET: "Africa",
  KE: "Africa",
  GH: "Africa",
  UG: "Africa",
  TZ: "Africa",
  MA: "Africa",
  DZ: "Africa",
  SD: "Africa",
  LY: "Africa",
  TN: "Africa",
  AO: "Africa",
  ZM: "Africa",
  ZW: "Africa",
  MW: "Africa",
  RW: "Africa",
  CM: "Africa",
  CI: "Africa",

  // Oceania
  AU: "Oceania",
  NZ: "Oceania",
  FJ: "Oceania",
  PG: "Oceania",
  SB: "Oceania",

  // Other (SMOM, UN, etc)
  XM: "Other",
  XX: "Other",
};

function getContinent(countryCode: string | null | undefined): string {
  if (!countryCode) return "Other";
  return COUNTRY_TO_CONTINENT[countryCode] ?? "Other";
}

function getContinentFromFlag(countryCode: string | null | undefined, subdivisionCode: string | null | undefined): string {
  if (countryCode) return getContinent(countryCode);
  if (subdivisionCode) {
    const extractedCountry = subdivisionCode.split("-")[0];
    return getContinent(extractedCountry);
  }
  return "Other";
}

type FlagRow = { acquiredAt: Date; continent: string | null; countryCode: string; subdivisionCode: string | null };

function computeFlagStats(flags: FlagRow[]) {
  const lastContribution =
    flags.length > 0
      ? flags.reduce((latest, flag) =>
          flag.acquiredAt > latest.acquiredAt ? flag : latest
        ).acquiredAt
      : null;

  const continentMap = new Map<string, number>();
  flags.forEach((flag) => {
    const continent = flag.continent ?? getContinentFromFlag(flag.countryCode, flag.subdivisionCode);
    continentMap.set(continent, (continentMap.get(continent) ?? 0) + 1);
  });

  const contributionsByContinent = Array.from(continentMap.entries())
    .filter(([continent]) => continent !== "Other")
    .map(([continent, count]) => ({ continent, count }))
    .sort((a, b) => b.count - a.count);

  return { flagsCount: flags.length, lastContribution, contributionsByContinent };
}

export const userResolvers = {
  Query: {
    // SECURITY: Removed public "users" query that exposed all emails
    // This query was returning all user data to any authenticated user
    // Users can be enumerated and email list extracted

    userProfile: async (_: unknown, args: { userId: string }, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");

      const user = await prisma.user.findUnique({ where: { id: args.userId } });
      if (!user) return null;

      // Only count public flags for other users' profiles
      const allFlags = await prisma.flag.findMany({
        where: { contributors: { some: { id: user.id } }, isPublic: true },
      });

      const { flagsCount, lastContribution, contributionsByContinent } = computeFlagStats(allFlags);

      return {
        id: user.id,
        displayName: user.displayName,
        email: null,
        role: user.role,
        clubRole: user.clubRole,
        cardNumber: null,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        flagsCount,
        lastContribution,
        contributionsByContinent,
      };
    },

    myProfile: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");

      const user = await prisma.user.findUnique({ where: { id: ctx.user.id } });
      if (!user) return null;

      // All flags where this user is a contributor (including private)
      const allFlags = await prisma.flag.findMany({
        where: { contributors: { some: { id: user.id } } },
      });

      const { flagsCount, lastContribution, contributionsByContinent } = computeFlagStats(allFlags);

      return {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        clubRole: user.clubRole,
        cardNumber: user.cardNumber,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        flagsCount,
        lastContribution,
        contributionsByContinent,
      };
    },
  },

  Mutation: {
    updateMyDisplayName: async (_: unknown, args: { displayName: string }, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");

      validateString(args.displayName, INPUT_LIMITS.displayName, "displayName", true);

      const user = await prisma.user.update({
        where: { id: ctx.user.id },
        data: { displayName: args.displayName.trim() },
      });

      const allFlags = await prisma.flag.findMany({
        where: { contributors: { some: { id: user.id } } },
      });

      const { flagsCount, lastContribution, contributionsByContinent } = computeFlagStats(allFlags);

      return {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        clubRole: user.clubRole,
        cardNumber: user.cardNumber,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        flagsCount,
        lastContribution,
        contributionsByContinent,
      };
    },

    updateMyAvatar: async (_: unknown, args: { avatarUrl?: string | null }, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");

      const user = await prisma.user.update({
        where: { id: ctx.user.id },
        data: { avatarUrl: args.avatarUrl ?? null },
      });

      const allFlags = await prisma.flag.findMany({
        where: { contributors: { some: { id: user.id } } },
      });

      const { flagsCount, lastContribution, contributionsByContinent } = computeFlagStats(allFlags);

      return {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        clubRole: user.clubRole,
        cardNumber: user.cardNumber,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        flagsCount,
        lastContribution,
        contributionsByContinent,
      };
    },
  },
};
