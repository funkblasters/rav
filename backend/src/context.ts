import jwt from "jsonwebtoken";
import type { Request, Response } from "express";

export interface AuthUser {
  id: string;
  email: string;
  role: "ADMIN" | "MEMBER";
}

export interface AppContext {
  user: AuthUser | null;
  res: Response;
  refreshTokenCookie: string | undefined;
}

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // In development, warn but allow. In production, this should fail at startup
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is required in production");
    }
    console.warn("⚠️ JWT_SECRET not set, using unsafe default (development only)");
    return "dev-secret";
  }
  if (secret === "dev-secret" && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET cannot be 'dev-secret' in production");
  }
  return secret;
}

export function buildContext(req: Request, res: Response): AppContext {
  const auth = (req.headers["authorization"] as string) ?? "";

  let user: AuthUser | null = null;
  if (auth.startsWith("Bearer ")) {
    try {
      const secret = getJWTSecret();
      user = jwt.verify(auth.slice(7), secret) as AuthUser;
    } catch {}
  }

  return {
    user,
    res,
    refreshTokenCookie: req.cookies?.refreshToken,
  };
}
