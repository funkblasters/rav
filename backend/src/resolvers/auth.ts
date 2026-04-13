import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import type { Response } from "express";
import type { AppContext, AuthUser } from "../context.js";
import { prisma } from "../db.js";

function signAccessToken(user: AuthUser): string {
  const secret = process.env.JWT_SECRET ?? "dev-secret";
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: "15m" }
  );
}

function signRefreshToken(userId: string): string {
  const secret = process.env.REFRESH_TOKEN_SECRET ?? "dev-refresh-secret";
  return jwt.sign({ id: userId }, secret, { expiresIn: "7d" });
}

function setRefreshCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function clearRefreshCookie(res: Response) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
}

export const authResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) return null;
      return prisma.user.findUnique({ where: { id: ctx.user.id } });
    },
    users: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) throw new Error("Unauthenticated");
      return prisma.user.findMany();
    },
  },
  Mutation: {
    register: async (
      _: unknown,
      args: { email: string; password: string; displayName: string },
      ctx: AppContext
    ) => {
      const normalizedEmail = args.email.trim().toLowerCase();

      const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

      if (existingUser?.status === "REGISTERED") {
        throw new Error("Email already in use");
      }

      // Count only REGISTERED users to determine isFirst
      const registeredCount = await prisma.user.count({ where: { status: "REGISTERED" } });
      const isFirst = registeredCount === 0;

      const invite = await prisma.invite.findUnique({ where: { email: normalizedEmail } });

      const passwordHash = await bcrypt.hash(args.password, 10);

      // PENDING user exists: convert to REGISTERED
      if (existingUser?.status === "PENDING" || existingUser?.status === "EXTERNAL") {
        if (!isFirst && !invite) {
          throw new Error("Registration is not open for this email address");
        }
        const cardNumber =
          existingUser.cardNumber ??
          invite?.cardNumber ??
          "RAV-" + String(registeredCount + 1).padStart(4, "0");

        const user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            passwordHash,
            status: "REGISTERED",
            displayName: args.displayName,
            role: isFirst ? "ADMIN" : "MEMBER",
            clubRole: isFirst ? "CHAIRMAN" : (invite?.clubRole ?? existingUser.clubRole),
            cardNumber,
          },
        });

        if (invite) {
          await prisma.invite.delete({ where: { email: normalizedEmail } });
        }

        setRefreshCookie(ctx.res, signRefreshToken(user.id));
        return { token: signAccessToken({ id: user.id, email: normalizedEmail, role: user.role }), user };
      }

      // Brand-new user
      if (!isFirst && !invite) {
        throw new Error("Registration is not open for this email address");
      }

      const cardNumber =
        invite?.cardNumber ?? "RAV-" + String(registeredCount + 1).padStart(4, "0");

      const user = await prisma.user.create({
        data: {
          id: randomUUID(),
          email: normalizedEmail,
          passwordHash,
          displayName: args.displayName,
          status: "REGISTERED",
          role: isFirst ? "ADMIN" : "MEMBER",
          clubRole: isFirst ? "CHAIRMAN" : (invite?.clubRole ?? "ORDINARY_ASSOCIATE"),
          cardNumber,
        },
      });

      if (invite) {
        await prisma.invite.delete({ where: { email: normalizedEmail } });
      }

      setRefreshCookie(ctx.res, signRefreshToken(user.id));
      return { token: signAccessToken({ id: user.id, email: normalizedEmail, role: user.role }), user };
    },

    login: async (
      _: unknown,
      args: { email: string; password: string },
      ctx: AppContext
    ) => {
      const normalizedEmail = args.email.trim().toLowerCase();
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      // Use the same error for all failure cases to avoid leaking account existence
      if (!user || user.status !== "REGISTERED" || !user.passwordHash) {
        throw new Error("Invalid credentials");
      }
      const valid = await bcrypt.compare(args.password, user.passwordHash);
      if (!valid) throw new Error("Invalid credentials");

      setRefreshCookie(ctx.res, signRefreshToken(user.id));
      return { token: signAccessToken({ id: user.id, email: normalizedEmail, role: user.role }), user };
    },

    resetUserPassword: async (
      _: unknown,
      args: { userId: string; newPassword: string },
      ctx: AppContext
    ) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      const user = await prisma.user.findUnique({ where: { id: args.userId } });
      if (!user || user.status !== "REGISTERED") throw new Error("User not found");
      const passwordHash = await bcrypt.hash(args.newPassword, 10);
      await prisma.user.update({ where: { id: args.userId }, data: { passwordHash } });
      return true;
    },

    refresh: async (_: unknown, __: unknown, ctx: AppContext) => {
      const token = ctx.refreshTokenCookie;
      if (!token) throw new Error("No refresh token");

      let payload: { id: string };
      try {
        const secret = process.env.REFRESH_TOKEN_SECRET ?? "dev-refresh-secret";
        payload = jwt.verify(token, secret) as { id: string };
      } catch {
        clearRefreshCookie(ctx.res);
        throw new Error("Invalid or expired refresh token");
      }

      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user || user.status !== "REGISTERED" || !user.email) {
        clearRefreshCookie(ctx.res);
        throw new Error("User not found");
      }

      setRefreshCookie(ctx.res, signRefreshToken(user.id));
      return { token: signAccessToken({ id: user.id, email: user.email, role: user.role }), user };
    },

    logout: (_: unknown, __: unknown, ctx: AppContext) => {
      clearRefreshCookie(ctx.res);
      return true;
    },
  },
};
