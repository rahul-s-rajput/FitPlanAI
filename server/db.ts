import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";
import { config } from "./config";

neonConfig.fetchConnectionCache = true;

const sql = neon(config.database.url);

export const db = drizzle(sql, { schema });

export type Database = typeof db;
