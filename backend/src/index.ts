import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { ApolloServer, HeaderMap } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import http from "http";
import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers/index.js";
import { buildContext } from "./context.js";
import { prisma } from "./db.js";

const port = Number(process.env.PORT ?? 4000);
const frontendUrl = process.env.FRONTEND_URL;

// Validate required environment variables
if (!frontendUrl && process.env.NODE_ENV === "production") {
  throw new Error("FRONTEND_URL must be set in production");
}

// Default to localhost in development
const defaultFrontendUrl = frontendUrl || "http://localhost:5173";

const app = express();
const httpServer = http.createServer(app);

// ── CORS Configuration ──────────────────────────────────────────────────
const allowedOrigins = [defaultFrontendUrl];

// Development-only origins (ngrok, localhost tunnels, etc.)
if (process.env.NODE_ENV === "development" && process.env.DEV_ORIGINS) {
  const devOrigins = process.env.DEV_ORIGINS.split(",").map(o => o.trim()).filter(o => o);
  allowedOrigins.push(...devOrigins);
  console.log(`✅ Dev mode: Added ${devOrigins.length} dev origin(s)`);
} else if (process.env.DEV_ORIGINS && process.env.NODE_ENV === "production") {
  console.error("⚠️ ERROR: DEV_ORIGINS cannot be used in production!");
  throw new Error("DEV_ORIGINS is only allowed in development mode");
}

console.log(`📋 CORS allowed origins:`, allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked: "${origin}" not in allowed list:`, allowedOrigins);
      callback(new Error(`CORS not allowed. Origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}));

// ── Security Headers ────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
  }
  next();
});

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

// ── Rate Limiting ──────────────────────────────────────────────────────
// Only rate limit file uploads (high-risk operation)
// GraphQL auth mutations are rate limited at resolver level (in-memory)
const fileUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 file uploads per windowMs
  message: "Too many file upload attempts, please try again later",
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── File upload endpoint for flag import (admin only) ──────────────────────
// Validate Excel file format (must be ZIP with specific structure)
function validateExcelBuffer(buffer: Buffer): boolean {
  // Excel files are ZIP archives, first 4 bytes are ZIP signature
  if (buffer.length < 4) return false;
  const zipSignature = [0x50, 0x4b, 0x03, 0x04]; // PK\x03\x04
  return buffer[0] === zipSignature[0] &&
    buffer[1] === zipSignature[1] &&
    buffer[2] === zipSignature[2] &&
    buffer[3] === zipSignature[3];
}

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

    // Both MIME type AND extension must match (not OR)
    const hasAllowedMime = allowedMimes.includes(file.mimetype);
    const hasAllowedExt = allowedExts.some((e) => ext.endsWith(e));

    if (hasAllowedExt && hasAllowedMime) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files (.xlsx, .xls) with correct MIME type are accepted"));
    }
  },
});

app.post(
  "/api/import-flags",
  fileUploadLimiter,
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
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        res.status(500).json({ error: "Server configuration error" });
        return;
      }
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

    // Validate file content
    if (!validateExcelBuffer(req.file.buffer)) {
      res.status(400).json({ error: "Invalid Excel file format" });
      return;
    }

    try {
      const { importFlags } = await import("./import.js");
      const result = await importFlags(req.file.buffer);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      res.status(400).json({ error: message });
    }
  }
);

// ── Export flags endpoint (admin only) ────────────────────────────────────────
app.get(
  "/api/export-flags",
  async (req: express.Request, res: express.Response) => {
    const auth = (req.headers["authorization"] as string) ?? "";
    if (!auth.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }

    let caller: { id: string; role: string };
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) { res.status(500).json({ error: "Server configuration error" }); return; }
      caller = jwt.verify(auth.slice(7), secret) as { id: string; role: string };
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    if (caller.role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    try {
      const flags = await prisma.flag.findMany({
        include: { contributors: { select: { displayName: true } } },
        orderBy: { acquiredAt: "asc" },
      });

      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Flags");

      sheet.columns = [
        { header: "flag",         key: "flag",         width: 40 },
        { header: "date",         key: "date",         width: 12 },
        { header: "contributors", key: "contributors", width: 40 },
        { header: "continent",    key: "continent",    width: 16 },
        { header: "is_variant",   key: "is_variant",   width: 12 },
      ];

      for (const flag of flags) {
        const date = flag.acquiredAt.toISOString().slice(0, 10); // YYYY-MM-DD
        const contributors = flag.contributors.map((c) => c.displayName).join(", ");
        const isVariant = flag.subdivisionCode != null ? "TRUE" : "FALSE";
        sheet.addRow({
          flag: flag.name,
          date,
          contributors,
          continent: flag.continent ?? "",
          is_variant: isVariant,
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `rav-flags-${new Date().toISOString().slice(0, 10)}.xlsx`;
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(Buffer.from(buffer));
    } catch (err) {
      console.error("Export failed:", err);
      res.status(500).json({ error: "Export failed" });
    }
  }
);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
await server.start();

// GraphQL endpoint - rate limiting handled at resolver level
app.use("/graphql", async (req, res) => {
  if (process.env.NODE_ENV !== "production" && process.env.DEV_DELAY_MS) {
    await new Promise((r) => setTimeout(r, Number(process.env.DEV_DELAY_MS)));
  }
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
