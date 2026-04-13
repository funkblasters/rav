import type { AppContext } from "../context.js";
import { prisma } from "../db.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const adminResolvers = {
  Mutation: {
    assignExternalEmail: async (
      _: unknown,
      args: { userId: string; email: string },
      ctx: AppContext
    ) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");

      const normalizedEmail = args.email.trim().toLowerCase();

      if (!EMAIL_RE.test(normalizedEmail)) {
        throw new Error("Invalid email format");
      }

      const user = await prisma.user.findUnique({ where: { id: args.userId } });
      if (!user) throw new Error("User not found");
      if (user.status !== "EXTERNAL") {
        throw new Error("User is not an external member");
      }

      const conflict = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (conflict) throw new Error("Email is already associated with another account");

      return prisma.user.update({
        where: { id: args.userId },
        data: { email: normalizedEmail, status: "PENDING" },
      });
    },
  },
};
