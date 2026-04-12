const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const PASSCODE_ENV_NAME = 'SUPER_ADMIN_RESET_PASSCODE';
const DEFAULT_SUPER_ADMIN_USERNAME = 'admin';
const DEFAULT_SUPER_ADMIN_PASSWORD = 'admin123';

function parseEnvFile(contents) {
  const env = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function getEnvFileNames(nodeEnv) {
  return [
    `.env.${nodeEnv}.local`,
    '.env.local',
    `.env.${nodeEnv}`,
    '.env',
  ];
}

function loadEnvFiles(options = {}) {
  const env = options.env || process.env;
  const nodeEnv = env.NODE_ENV || options.nodeEnv || 'development';
  const directories = Array.from(
    new Set((options.directories || [process.cwd()]).filter(Boolean))
  );

  for (const directory of directories) {
    for (const fileName of getEnvFileNames(nodeEnv)) {
      const absolutePath = path.join(directory, fileName);
      if (!fs.existsSync(absolutePath)) {
        continue;
      }

      const parsed = parseEnvFile(fs.readFileSync(absolutePath, 'utf8'));
      for (const [key, value] of Object.entries(parsed)) {
        if (env[key] === undefined) {
          env[key] = value;
        }
      }
    }
  }

  return env;
}

function resolveDatabasePath(options = {}) {
  const env = options.env || process.env;
  if (env.DATABASE_PATH) {
    return env.DATABASE_PATH;
  }

  if (options.userDataPath) {
    return path.join(options.userDataPath, 'clinic-desk.db');
  }

  return path.join(options.cwd || process.cwd(), 'data', 'clinic-desk.db');
}

function ensureSuperAdminsTable(db) {
  const table = db
    .prepare("select name from sqlite_master where type = 'table' and name = 'super_admins'")
    .get();

  if (!table) {
    throw new Error('super_admins table not found in the target database');
  }
}

function resetSuperAdminInDatabase(db, env = process.env) {
  ensureSuperAdminsTable(db);

  const hasEnvironmentCredentials = Boolean(
    env.SUPER_ADMIN_USERNAME && env.SUPER_ADMIN_PASSWORD
  );

  const now = new Date().toISOString();
  const deleteResult = db.prepare('delete from super_admins').run();

  let insertedBootstrapAdmin = false;

  if (!hasEnvironmentCredentials) {
    db.prepare(
      `insert into super_admins (
        id,
        username,
        password_hash,
        must_change_credentials,
        used_default_credentials,
        login_history,
        created_at,
        updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      crypto.randomUUID(),
      DEFAULT_SUPER_ADMIN_USERNAME,
      bcrypt.hashSync(DEFAULT_SUPER_ADMIN_PASSWORD, 10),
      1,
      1,
      '[]',
      now,
      now
    );

    insertedBootstrapAdmin = true;
  }

  return {
    deletedRows: deleteResult.changes,
    insertedBootstrapAdmin,
    hasEnvironmentCredentials,
  };
}

function resetSuperAdminAtPath(dbPath, env = process.env) {
  const dbDirectory = path.dirname(dbPath);
  if (!fs.existsSync(dbDirectory)) {
    throw new Error(`Database directory not found: ${dbDirectory}`);
  }

  const db = new Database(dbPath);
  try {
    return resetSuperAdminInDatabase(db, env);
  } finally {
    db.close();
  }
}

module.exports = {
  PASSCODE_ENV_NAME,
  loadEnvFiles,
  resolveDatabasePath,
  resetSuperAdminAtPath,
};