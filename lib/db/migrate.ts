import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getDb } from "./sqlite";
import path from "path";

export function runMigrations() {
  const db = getDb();
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  migrate(db, { migrationsFolder });
  console.log("✅ Database migrations applied");
}
