import jwt from "jsonwebtoken";

export interface AuthUser {
  id: string;
  email: string;
  role: "ADMIN" | "MEMBER";
}

export interface AppContext {
  user: AuthUser | null;
}

export function buildContext(req: { headers: Record<string, string | string[] | undefined> }): AppContext {
  const auth = req.headers["authorization"] ?? "";
  const token = Array.isArray(auth) ? auth[0] : auth;

  if (!token.startsWith("Bearer ")) return { user: null };

  try {
    const secret = process.env.JWT_SECRET ?? "dev-secret";
    const payload = jwt.verify(token.slice(7), secret) as AuthUser;
    return { user: payload };
  } catch {
    return { user: null };
  }
}
