const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const appRoot = path.resolve(__dirname, "..");

function resolveCommand() {
  try {
    const drizzleMainPath = require.resolve("drizzle-kit", {
      paths: [appRoot],
    });
    const drizzleCliPath = path.join(path.dirname(drizzleMainPath), "bin.cjs");

    if (!fs.existsSync(drizzleCliPath)) {
      throw new Error("drizzle-kit bin.cjs was not found");
    }

    return {
      command: process.execPath,
      args: [drizzleCliPath, "generate", "--config", "drizzle.config.ts"],
    };
  } catch {
    const npmExecPath = process.env.npm_execpath;
    if (npmExecPath) {
      const isNodeScript = /\.(cjs|mjs|js)$/i.test(npmExecPath);

      return {
        command: isNodeScript ? process.execPath : npmExecPath,
        args: isNodeScript
          ? [
              npmExecPath,
              "exec",
              "drizzle-kit",
              "generate",
              "--config",
              "drizzle.config.ts",
            ]
          : ["exec", "drizzle-kit", "generate", "--config", "drizzle.config.ts"],
      };
    }

    throw new Error(
      "Unable to locate drizzle-kit CLI. Run pnpm install and retry."
    );
  }
}

const { command, args } = resolveCommand();

const result = spawnSync(
  command,
  args,
  {
    cwd: appRoot,
    stdio: "inherit",
    env: process.env,
  }
);

if (result.error) {
  throw result.error;
}

if (typeof result.status === "number" && result.status !== 0) {
  process.exit(result.status);
}

if (result.status === null) {
  process.exit(1);
}
