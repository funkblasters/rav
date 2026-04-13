/**
 * Flag import logic — parses an Excel buffer and writes to the database.
 *
 * Security notes:
 *  - Caller must verify the requesting user is ADMIN before calling importFlags().
 *  - Input is read only from the in-memory buffer; no disk I/O.
 *  - All string inputs are trimmed and validated before touching the DB.
 *  - Each row failure is isolated: one bad row never aborts the whole import.
 *  - Failed rows are persisted to DB so admins can review them later.
 */

import ExcelJS from "exceljs";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { prisma } from "./db.js";
import { countryNameToISOCode, subdivisionToCountryCode } from "./countryCodeMappings.js";

// ── Flag data lookup (image URL) ────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));

interface FlagMetadata {
  imageUrl: string | null;
}

let _flagDataMap: Map<string, FlagMetadata> | null = null;

function getFlagDataMap(): Map<string, FlagMetadata> {
  if (_flagDataMap) return _flagDataMap;

  const map = new Map<string, FlagMetadata>();
  try {
    const raw = readFileSync(
      join(__dirname, "../../frontend/src/lib/flags_complete.json"),
      "utf-8"
    );
    const data = JSON.parse(raw);

    const add = (name: unknown, url: unknown) => {
      if (typeof name === "string" && name) {
        map.set(name.trim().toLowerCase(), {
          imageUrl: (typeof url === "string" && url) ? url : null,
        });
      }
    };

    for (const [continentName, continent] of Object.entries(data.continents ?? {})) {
      for (const [countryName, countryData] of Object.entries(continent as Record<string, unknown>)) {
        if (Array.isArray(countryData)) {
          // cultural flags array
          for (const f of countryData) add(f.name, f.link_flag);
          continue;
        }
        const c = countryData as Record<string, unknown>;
        const nat = c.national as Record<string, unknown> | undefined;
        if (nat) add(nat.name, nat.link_flag);
        const subs = c.subdivisions as Record<string, unknown>[] | undefined;
        if (Array.isArray(subs)) {
          for (const s of subs) {
            add(s.name, s.link_flag);
          }
        }
      }
    }

    for (const f of Object.values(data.lgbtFlags ?? {})) {
      const flag = f as Record<string, unknown>;
      add(flag.name, flag.link_flag);
    }
  } catch {
    // JSON not found in this environment — will use defaults
  }

  _flagDataMap = map;
  return map;
}

function lookupFlagImageUrl(flagName: string): string | null {
  const data = getFlagDataMap().get(flagName.trim().toLowerCase());
  return data?.imageUrl ?? null;
}

function lookupCountryCode(countryName: string): string {
  return countryNameToISOCode[countryName.trim()] ?? "XX";
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmail(s: string): boolean {
  return EMAIL_RE.test(s);
}

function parseBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  if (typeof val === "string") {
    return ["true", "yes", "1", "si", "sì"].includes(val.trim().toLowerCase());
  }
  return false;
}

/**
 * Parse a cell value into a UTC-midnight Date.
 *
 * Supported formats:
 *  - JS Date object (from exceljs date cells) — local y/m/d extracted, stored as UTC midnight
 *  - Integer 1900-2100 treated as a year → Jan 1 of that year (UTC)
 *  - ISO string "YYYY-MM-DD[...]"
 *  - DD/MM/YYYY string
 *  - Excel date serial (large integers, e.g. 44927 = Jan 1, 2023)
 *  - Plain year string "YYYY" → Jan 1 of that year (UTC)
 */
function parseDate(val: unknown): Date | null {
  // ExcelJS returns Date objects for date-formatted cells (local time)
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    // Extract local calendar date to avoid timezone shifting during storage
    return new Date(Date.UTC(val.getFullYear(), val.getMonth(), val.getDate()));
  }

  if (typeof val === "number") {
    // Year-only (e.g. 2020) — integer in plausible year range
    if (Number.isInteger(val) && val >= 1900 && val <= 2100) {
      return new Date(Date.UTC(val, 0, 1));
    }
    // Excel date serial: 25569 = days between Excel epoch (Jan 1, 1900) and Unix epoch
    const ms = (val - 25569) * 86_400_000;
    const d = new Date(ms);
    if (isNaN(d.getTime())) return null;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return null;

    // Year-only string "YYYY"
    if (/^\d{4}$/.test(s)) {
      const year = Number(s);
      if (year >= 1900 && year <= 2100) return new Date(Date.UTC(year, 0, 1));
      return null;
    }

    // ISO date "YYYY-MM-DD" or datetime "YYYY-MM-DDT..."
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (iso) {
      return new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
    }

    // DD/MM/YYYY
    const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
    if (dmy) {
      return new Date(Date.UTC(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])));
    }

    // DD-MM-YYYY
    const dmyDash = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(s);
    if (dmyDash) {
      return new Date(Date.UTC(Number(dmyDash[3]), Number(dmyDash[2]) - 1, Number(dmyDash[1])));
    }

    return null;
  }

  return null;
}

function cellText(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object" && "richText" in v) {
    return (v as ExcelJS.CellRichTextValue).richText.map((r) => r.text).join("").trim();
  }
  return String(v).trim();
}

// ── Public types ─────────────────────────────────────────────────────────────

export interface ImportFlagError {
  row: number;
  flagName: string;
  reason: string;
}

export interface ImportFlagsResult {
  flagsImported: number;
  usersCreated: number;
  errors: ImportFlagError[];
}

// ── Main import function ──────────────────────────────────────────────────────

export async function importFlags(buffer: Buffer): Promise<ImportFlagsResult> {
  // ── Parse workbook ──────────────────────────────────────────────────────────
  const workbook = new ExcelJS.Workbook();
  // exceljs types predate Node 22's generic Buffer — cast is safe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(buffer as any);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("No worksheet found in the file");

  // Read header row — map column name → column number (case-insensitive, spaces→underscores)
  const headerRow = sheet.getRow(1);
  const colIndex: Record<string, number> = {};
  headerRow.eachCell((cell, colNumber) => {
    const key = cellText(cell).toLowerCase().replace(/\s+/g, "_");
    colIndex[key] = colNumber;
  });

  const required = ["flag", "date", "contributors"];
  for (const col of required) {
    if (!colIndex[col]) throw new Error(`Missing required column: "${col}"`);
  }

  // ── Collect all rows ────────────────────────────────────────────────────────
  interface RawRow {
    rowNumber: number;
    flagName: string;
    dateRaw: unknown;
    contributors: string[];
    continent: string;
    isVariant: boolean;
  }

  const rawRows: RawRow[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const flagName = cellText(row.getCell(colIndex["flag"])).trim();
    if (!flagName) return;

    const rawContrib = cellText(row.getCell(colIndex["contributors"]));
    const contributors = rawContrib
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    rawRows.push({
      rowNumber,
      flagName,
      dateRaw: row.getCell(colIndex["date"]).value,
      contributors,
      continent: colIndex["continent"] ? cellText(row.getCell(colIndex["continent"])) : "",
      isVariant: colIndex["is_variant"] ? parseBool(row.getCell(colIndex["is_variant"]).value) : false,
    });
  });

  // ── Phase 1: create / find all users ────────────────────────────────────────
  const emailIdentifiers = new Set<string>();
  const nameIdentifiers = new Set<string>();

  for (const row of rawRows) {
    for (const contrib of row.contributors) {
      if (isEmail(contrib)) emailIdentifiers.add(contrib.toLowerCase());
      else nameIdentifiers.add(contrib);
    }
  }

  const identifierToUserId = new Map<string, string>();
  let usersCreated = 0;

  for (const email of emailIdentifiers) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      identifierToUserId.set(email, existing.id);
    } else {
      const newUser = await prisma.user.create({
        data: {
          id: randomUUID(),
          email,
          displayName: email.split("@")[0],
          status: "PENDING",
          role: "MEMBER",
          clubRole: "ORDINARY_ASSOCIATE",
        },
      });
      identifierToUserId.set(email, newUser.id);
      usersCreated++;
    }
  }

  for (const name of nameIdentifiers) {
    const existing = await prisma.user.findFirst({
      where: { displayName: { equals: name, mode: "insensitive" }, status: "EXTERNAL" },
    });
    if (existing) {
      identifierToUserId.set(name, existing.id);
    } else {
      const newUser = await prisma.user.create({
        data: {
          id: randomUUID(),
          displayName: name,
          status: "EXTERNAL",
          role: "MEMBER",
          clubRole: "ORDINARY_ASSOCIATE",
        },
      });
      identifierToUserId.set(name, newUser.id);
      usersCreated++;
    }
  }

  // ── Phase 2: create flags ───────────────────────────────────────────────────
  const errors: ImportFlagError[] = [];
  let flagsImported = 0;

  for (const row of rawRows) {
    const { rowNumber, flagName, dateRaw, contributors, continent, isVariant } = row;

    const rawDataJson = JSON.stringify({
      date: typeof dateRaw === "object" && dateRaw instanceof Date
        ? dateRaw.toISOString()
        : dateRaw,
      contributors,
      continent,
      isVariant,
    });

    // Parse date
    const acquiredAt = parseDate(dateRaw);
    if (!acquiredAt) {
      const err: ImportFlagError = {
        row: rowNumber,
        flagName,
        reason: `Invalid or missing date: "${dateRaw}"`,
      };
      errors.push(err);
      await prisma.failedImport.create({
        data: { id: randomUUID(), row: rowNumber, flagName, reason: err.reason, rawData: rawDataJson },
      });
      continue;
    }

    // Need at least one contributor
    if (contributors.length === 0) {
      const err: ImportFlagError = { row: rowNumber, flagName, reason: "No contributors listed" };
      errors.push(err);
      await prisma.failedImport.create({
        data: { id: randomUUID(), row: rowNumber, flagName, reason: err.reason, rawData: rawDataJson },
      });
      continue;
    }

    // Resolve contributors → user IDs
    const contributorIds: string[] = [];
    let resolveError: string | null = null;
    for (const contrib of contributors) {
      const key = isEmail(contrib) ? contrib.toLowerCase() : contrib;
      const uid = identifierToUserId.get(key);
      if (!uid) { resolveError = `Could not resolve contributor: "${contrib}"`; break; }
      if (!contributorIds.includes(uid)) contributorIds.push(uid);
    }
    if (resolveError) {
      errors.push({ row: rowNumber, flagName, reason: resolveError });
      await prisma.failedImport.create({
        data: { id: randomUUID(), row: rowNumber, flagName, reason: resolveError, rawData: rawDataJson },
      });
      continue;
    }

    const ownerId = contributorIds[0];

    // Match addFlag behavior: check for duplicate by countryCode + subdivisionCode + addedById
    try {
      let countryCode: string;
      let subdivisionCode: string | null;

      // Check if this is a known subdivision first
      const subdivCountryCode = subdivisionToCountryCode[flagName.trim()];
      if (subdivCountryCode) {
        // This is a subdivision flag
        countryCode = subdivCountryCode;
        subdivisionCode = flagName.trim(); // Use flag name as unique subdivision identifier
      } else {
        // Try to get country code from flag name first, only use continent as fallback
        countryCode = lookupCountryCode(flagName);
        if (countryCode === "XX" && continent) {
          countryCode = lookupCountryCode(continent);
        }

        // If we couldn't find a country code (mapped to "XX"), use flag name as subdivision
        // This prevents all unknown flags from conflicting with each other
        if (countryCode === "XX") {
          subdivisionCode = flagName.trim();
        } else {
          subdivisionCode = null;
        }
      }

      // Check for duplicate: same country/subdivision for same user (match addFlag logic)
      const existingFlag = await prisma.flag.findFirst({
        where: {
          addedById: ownerId,
          countryCode,
          subdivisionCode,
        },
      });
      if (existingFlag) {
        errors.push({ row: rowNumber, flagName, reason: "Already exists in collection" });
        continue;
      }

      const imageUrl = lookupFlagImageUrl(flagName);
      const isPublic = true;

      await prisma.flag.create({
        data: {
          id: randomUUID(),
          name: flagName,
          countryCode,
          subdivisionCode,
          acquiredAt,
          isPublic,
          isVariant,
          continent: continent || null,
          publishedAt: isPublic ? new Date() : null, // Match addFlag behavior
          imageUrl,
          addedById: ownerId,
          contributors: { connect: contributorIds.map((id) => ({ id })) },
        },
      });
      flagsImported++;
    } catch (err) {
      const reason = `Database error: ${err instanceof Error ? err.message : String(err)}`;
      errors.push({ row: rowNumber, flagName, reason });
      await prisma.failedImport.create({
        data: { id: randomUUID(), row: rowNumber, flagName, reason, rawData: rawDataJson },
      });
    }
  }

  return { flagsImported, usersCreated, errors };
}
