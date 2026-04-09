import type { AppContext } from "../context.js";
import { prisma } from "../db.js";

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

function getContinent(countryCode: string): string {
  return COUNTRY_TO_CONTINENT[countryCode] ?? "Other";
}

export const userResolvers = {
  Query: {
    myProfile: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");

      const user = await prisma.user.findUnique({ where: { id: ctx.user.id } });
      if (!user) return null;

      // All flags by this user (public + private) — it's their own profile
      const userFlags = await prisma.flag.findMany({ where: { addedById: user.id } });

      // Compute stats
      const flagsCount = userFlags.length;
      const lastContribution =
        userFlags.length > 0
          ? userFlags.reduce((latest, flag) =>
              flag.acquiredAt > latest.acquiredAt ? flag : latest
            ).acquiredAt
          : null;

      // Group contributions by continent
      const continentMap = new Map<string, number>();
      userFlags.forEach((flag) => {
        const continent = flag.continent ?? getContinent(flag.countryCode);
        continentMap.set(continent, (continentMap.get(continent) ?? 0) + 1);
      });

      const contributionsByContinent = Array.from(continentMap.entries())
        .map(([continent, count]) => ({ continent, count }))
        .sort((a, b) => b.count - a.count);

      return {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        clubRole: user.clubRole,
        cardNumber: user.cardNumber,
        createdAt: user.createdAt.toISOString(),
        flagsCount,
        lastContribution,
        contributionsByContinent,
      };
    },
  },
};
