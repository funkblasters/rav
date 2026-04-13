import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import jwt from "jsonwebtoken";
import { ApolloServer, HeaderMap } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import http from "http";
import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers/index.js";
import { buildContext } from "./context.js";
import { importFlags } from "./import.js";

const port = Number(process.env.PORT ?? 4000);
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

const app = express();
const httpServer = http.createServer(app);

app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// ── File upload endpoint for flag import (admin only) ──────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.toLowerCase();
    const allowedMimes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    const allowedExts = [".xlsx", ".xls"];
    const hasAllowedMime = allowedMimes.includes(file.mimetype);
    const hasAllowedExt = allowedExts.some((e) => ext.endsWith(e));
    if (hasAllowedMime || hasAllowedExt) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files (.xlsx, .xls) are accepted"));
    }
  },
});

app.post(
  "/api/import-flags",
  upload.single("file"),
  async (req: express.Request, res: express.Response) => {
    // Authenticate: require a valid ADMIN access token
    const auth = (req.headers["authorization"] as string) ?? "";
    if (!auth.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }
    let caller: { id: string; role: string };
    try {
      const secret = process.env.JWT_SECRET ?? "dev-secret";
      caller = jwt.verify(auth.slice(7), secret) as { id: string; role: string };
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    if (caller.role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    try {
      const result = await importFlags(req.file.buffer);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      res.status(400).json({ error: message });
    }
  }
);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
await server.start();

app.use("/graphql", async (req, res) => {
  const headers = new HeaderMap();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  const httpGraphQLResponse = await server.executeHTTPGraphQLRequest({
    httpGraphQLRequest: {
      method: req.method.toUpperCase(),
      headers,
      search: req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "",
      body: req.body,
    },
    context: async () => buildContext(req, res),
  });

  for (const [key, value] of httpGraphQLResponse.headers) {
    res.setHeader(key, value);
  }
  res.status(httpGraphQLResponse.status ?? 200);

  if (httpGraphQLResponse.body.kind === "complete") {
    res.send(httpGraphQLResponse.body.string);
  } else {
    for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
      res.write(chunk);
    }
    res.end();
  }
});

await new Promise<void>((resolve) => httpServer.listen(port, resolve));
console.log(`GraphQL server ready at http://localhost:${port}/graphql`);
