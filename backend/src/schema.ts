import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load the shared schema from the models folder
export const typeDefs = readFileSync(
  join(__dirname, "../../models/schema.graphql"),
  "utf-8"
);
