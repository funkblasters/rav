import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load the schema copied locally by the prebuild/predev script
export const typeDefs = readFileSync(
  join(__dirname, "schema.graphql"),
  "utf-8"
);
