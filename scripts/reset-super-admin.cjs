const path = require('path');
const readline = require('readline');
const {
  PASSCODE_ENV_NAME,
  loadEnvFiles,
  resolveDatabasePath,
  resetSuperAdminAtPath,
} = require('../electron/reset-super-admin.cjs');

loadEnvFiles({ directories: [process.cwd()] });

function parsePasscodeArg(argv) {
  const passcodeArg = argv.find((arg) => arg.startsWith('--passcode='));
  if (!passcodeArg) {
    return null;
  }

  return passcodeArg.slice('--passcode='.length);
}

function promptForPasscode() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    const originalWrite = rl._writeToOutput.bind(rl);
    rl._writeToOutput = (value) => {
      if (rl.stdoutMuted) {
        rl.output.write('*');
        return;
      }

      originalWrite(value);
    };

    rl.stdoutMuted = true;
    rl.question('Developer passcode: ', (answer) => {
      rl.history = rl.history.slice(1);
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function main() {
  const expectedPasscode = process.env[PASSCODE_ENV_NAME];
  if (!expectedPasscode) {
    throw new Error(`${PASSCODE_ENV_NAME} is not set. Add it to your .env file first.`);
  }

  const providedPasscode = parsePasscodeArg(process.argv.slice(2)) ||
    (process.stdin.isTTY ? await promptForPasscode() : null);

  if (!providedPasscode) {
    throw new Error('No passcode provided. Run with --passcode=... or use an interactive terminal.');
  }

  if (providedPasscode !== expectedPasscode) {
    throw new Error('Invalid passcode. Super admin reset aborted.');
  }

  const dbPath = resolveDatabasePath({ cwd: process.cwd() });
  const result = resetSuperAdminAtPath(dbPath, process.env);

  console.log(`Database: ${dbPath}`);
  console.log(`Deleted persisted super admin rows: ${result.deletedRows}`);

  if (result.insertedBootstrapAdmin) {
    console.log('Bootstrap credentials restored: admin / admin123');
  } else if (result.hasEnvironmentCredentials) {
    console.log('No bootstrap admin inserted because SUPER_ADMIN_USERNAME and SUPER_ADMIN_PASSWORD are configured.');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});