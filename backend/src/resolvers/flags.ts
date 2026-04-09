import type { AppContext } from "../context.js";
import { users } from "./auth.js";

export interface Flag {
  id: string;
  name: string;
  countryCode: string;
  subdivisionCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  acquiredAt: string;
  addedBy: string; // user id
}

export const flags: Flag[] = [];
let nextId = 1;

export const flagResolvers = {
  Query: {
    flags: (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      return flags;
    },
    flag: (_: unknown, args: { id: string }, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      return flags.find((f) => f.id === args.id) ?? null;
    },
    lastFlag: (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      if (flags.length === 0) return null;
      return flags.reduce((a, b) => (a.acquiredAt > b.acquiredAt ? a : b));
    },
    mostWantedFlag: (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      if (flags.length === 0) return null;
      // Return the oldest flag in the collection — the club's longest-held acquisition
      return flags.reduce((a, b) => (a.acquiredAt < b.acquiredAt ? a : b));
    },
  },
  Mutation: {
    addFlag: (
      _: unknown,
      args: Omit<Flag, "id" | "addedBy">,
      ctx: AppContext
    ) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const flag: Flag = { id: String(nextId++), ...args, addedBy: ctx.user.id };
      flags.push(flag);
      return flag;
    },
    deleteFlag: (_: unknown, args: { id: string }, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      const idx = flags.findIndex((f) => f.id === args.id);
      if (idx === -1) throw new Error("Flag not found");
      if (flags[idx].addedBy !== ctx.user.id && ctx.user.role !== "ADMIN")
        throw new Error("Forbidden");
      flags.splice(idx, 1);
      return true;
    },
  },
  Flag: {
    addedBy: (flag: Flag) => users.find((u) => u.id === flag.addedBy) ?? null,
  },
};
