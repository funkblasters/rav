import type { AppContext } from "../context.js";
import { prisma } from "../db.js";

type ClubRole = "CHAIRMAN" | "VICE_CHAIRMAN" | "HONORARY_CHAIRMAN" | "TREASURER" | "SECRETARY" | "ORDINARY_ASSOCIATE";

export const inviteResolvers = {
  Query: {
    invites: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      return prisma.invite.findMany();
    },
  },
  Mutation: {
    addInvite: async (
      _: unknown,
      args: { email: string; clubRole: ClubRole; cardNumber?: string },
      ctx: AppContext
    ) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      const email = args.email.trim().toLowerCase();
      return prisma.invite.upsert({
        where: { email },
        update: { clubRole: args.clubRole, cardNumber: args.cardNumber },
        create: { email, clubRole: args.clubRole, cardNumber: args.cardNumber, createdById: ctx.user.id },
      });
    },
    removeInvite: async (_: unknown, args: { email: string }, ctx: AppContext) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      const email = args.email.trim().toLowerCase();
      await prisma.invite.delete({ where: { email } });
      return true;
    },
  },
};
