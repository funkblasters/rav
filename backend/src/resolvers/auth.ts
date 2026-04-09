import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { AppContext, AuthUser } from "../context.js";

// In-memory store — replace with a real DB (e.g. Supabase/Postgres)
const users: Array<{
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: "ADMIN" | "MEMBER";
  clubRole: "CHAIRMAN" | "VICE_CHAIRMAN" | "HONORARY_CHAIRMAN" | "TREASURER" | "SECRETARY" | "ORDINARY_ASSOCIATE";
  cardNumber: string;
  createdAt: string;
}> = [];

let nextId = 1;

function signToken(user: AuthUser): string {
  const secret = process.env.JWT_SECRET ?? "dev-secret";
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: "7d" }
  );
}

export { users };

export const authResolvers = {
  Query: {
    me: (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.user) return null;
      return users.find((u) => u.id === ctx.user!.id) ?? null;
    },
    users: (_: unknown, __: unknown, ctx: AppContext) => {
      if (ctx.user?.role !== "ADMIN") throw new Error("Forbidden");
      return users;
    },
  },
  Mutation: {
    register: async (
      _: unknown,
      args: { email: string; password: string; displayName: string }
    ) => {
      if (users.find((u) => u.email === args.email)) {
        throw new Error("Email already in use");
      }
      const passwordHash = await bcrypt.hash(args.password, 10);
      const cardNumber = "RAV-" + String(nextId).padStart(4, "0");
      const user = {
        id: String(nextId++),
        email: args.email,
        passwordHash,
        displayName: args.displayName,
        role: (users.length === 0 ? "ADMIN" : "MEMBER") as "ADMIN" | "MEMBER",
        clubRole: "ORDINARY_ASSOCIATE" as const,
        cardNumber,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      return { token: signToken(user), user };
    },
    login: async (
      _: unknown,
      args: { email: string; password: string }
    ) => {
      const user = users.find((u) => u.email === args.email);
      if (!user) throw new Error("Invalid credentials");
      const valid = await bcrypt.compare(args.password, user.passwordHash);
      if (!valid) throw new Error("Invalid credentials");
      return { token: signToken(user), user };
    },
  },
};
