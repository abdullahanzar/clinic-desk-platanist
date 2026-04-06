import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import { hashPasswordSync } from "@/lib/auth/password";

let _db: ReturnType<typeof drizzle> | null = null;
let _sqlite: Database.Database | null = null;
let _migrationsApplied = false;
let _defaultSuperAdminEnsured = false;

const DEFAULT_SUPER_ADMIN_USERNAME = "admin";
const DEFAULT_SUPER_ADMIN_PASSWORD = "admin123";

declare global {
  // eslint-disable-next-line no-var
  var _drizzleDb: ReturnType<typeof drizzle> | undefined;
  // eslint-disable-next-line no-var
  var _sqliteInstance: Database.Database | undefined;
  // eslint-disable-next-line no-var
  var _sqliteMigrationsApplied: boolean | undefined;
  // eslint-disable-next-line no-var
  var _sqliteDefaultSuperAdminEnsured: boolean | undefined;
}

function getDatabasePath(): string {
  const dbPath = process.env.DATABASE_PATH;
  if (dbPath) {
    return dbPath;
  }
  // Default path for development
  return path.join(process.cwd(), "data", "clinic-desk.db");
}

function createDb() {
  const dbPath = getDatabasePath();

  // Ensure the directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  sqlite.pragma("journal_mode = WAL");
  // Enable foreign keys
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });
  ensureMigrations(db);
  ensureDefaultSuperAdmin(db);

  return { db, sqlite };
}

function ensureMigrations(db: ReturnType<typeof drizzle>) {
  if (process.env.NODE_ENV === "development") {
    if (global._sqliteMigrationsApplied) {
      return;
    }
  } else if (_migrationsApplied) {
    return;
  }

  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (!fs.existsSync(migrationsFolder)) {
    throw new Error(
      `Drizzle migrations folder not found at ${migrationsFolder}. Ensure the drizzle directory is included in the runtime build.`
    );
  }

  migrate(db, { migrationsFolder });

  if (process.env.NODE_ENV === "development") {
    global._sqliteMigrationsApplied = true;
    return;
  }

  _migrationsApplied = true;
}

function ensureDefaultSuperAdmin(db: ReturnType<typeof drizzle>) {
  if (process.env.NODE_ENV === "development") {
    if (global._sqliteDefaultSuperAdminEnsured) {
      return;
    }
  } else if (_defaultSuperAdminEnsured) {
    return;
  }

  const hasEnvironmentCredentials = Boolean(
    process.env.SUPER_ADMIN_USERNAME && process.env.SUPER_ADMIN_PASSWORD
  );

  const existingSuperAdmin = db.select({ id: schema.superAdmins.id })
    .from(schema.superAdmins)
    .get();

  if (!existingSuperAdmin && !hasEnvironmentCredentials) {
    const now = new Date().toISOString();
    db.insert(schema.superAdmins)
      .values({
        username: DEFAULT_SUPER_ADMIN_USERNAME,
        passwordHash: hashPasswordSync(DEFAULT_SUPER_ADMIN_PASSWORD),
        mustChangeCredentials: true,
        usedDefaultCredentials: true,
        loginHistory: [],
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }

  if (process.env.NODE_ENV === "development") {
    global._sqliteDefaultSuperAdminEnsured = true;
    return;
  }

  _defaultSuperAdminEnsured = true;
}

export function getDb() {
  if (process.env.NODE_ENV === "development") {
    // In development, use global variables to preserve across HMR
    if (!global._drizzleDb || !global._sqliteInstance) {
      const { db, sqlite } = createDb();
      global._drizzleDb = db;
      global._sqliteInstance = sqlite;
    }
    return global._drizzleDb;
  }

  // In production, use module-level singleton
  if (!_db || !_sqlite) {
    const { db, sqlite } = createDb();
    _db = db;
    _sqlite = sqlite;
  }
  return _db;
}

export function getSqlite(): Database.Database {
  if (process.env.NODE_ENV === "development") {
    if (!global._sqliteInstance) {
      getDb(); // This initializes both
    }
    return global._sqliteInstance!;
  }

  if (!_sqlite) {
    getDb(); // This initializes both
  }
  return _sqlite!;
}

export { schema };
