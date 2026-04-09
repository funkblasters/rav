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

export function buildContext(req: Request, res: Response): AppContext {
  const auth = (req.headers["authorization"] as string) ?? "";

  let user: AuthUser | null = null;
  if (auth.startsWith("Bearer ")) {
    try {
      const secret = process.env.JWT_SECRET ?? "dev-secret";
      user = jwt.verify(auth.slice(7), secret) as AuthUser;
    } catch {}
  }

  return {
    user,
    res,
    refreshTokenCookie: req.cookies?.refreshToken,
  };
}
