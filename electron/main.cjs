const startupOrigin = Date.now();
const startupTimings = { processStart: 0 };

function markStartup(name) {
  startupTimings[name] = Date.now() - startupOrigin;
  if (process.env.CLINIC_DESK_STARTUP_LOG === '1') {
    console.log(`[startup] ${name}: ${startupTimings[name]}ms`);
  }
}

const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const http = require('http');

markStartup('main:modules-loaded');

const isDev = process.env.ELECTRON_DEV === '1';
const shouldRunSuperAdminReset = process.argv.includes('--reset-super-admin');
const shouldNukeDatabase = process.argv.includes('--nuke-database');
const FORCE_LOCAL_SUPER_ADMIN_ENV_NAME = 'CLINIC_DESK_FORCE_LOCAL_SUPER_ADMIN';
let nextProcess = null;
let activePort = null;
let maintenanceModule = null;

if (!isDev) {
  app.commandLine.appendSwitch('disable-background-networking');
  app.commandLine.appendSwitch('disable-component-update');
  app.commandLine.appendSwitch('disable-domain-reliability');
  app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion,MediaRouter,DialMediaRouteProvider');
}

function getMaintenanceModule() {
  if (!maintenanceModule) {
    maintenanceModule = require('./reset-super-admin.cjs');
    markStartup('maintenance:module-loaded');
  }

  return maintenanceModule;
}

function getRuntimeAppPath() {
  return app.isPackaged ? path.join(process.resourcesPath, 'app.asar.unpacked') : app.getAppPath();
}

function getRuntimeNodePath() {
  const nodePaths = [
    path.join(getRuntimeAppPath(), '.next', 'standalone', 'node_modules'),
    path.join(getRuntimeAppPath(), 'node_modules'),
    path.join(app.getAppPath(), '.next', 'standalone', 'node_modules'),
    path.join(app.getAppPath(), 'node_modules'),
    process.env.NODE_PATH,
  ].filter(Boolean);

  return nodePaths.join(path.delimiter);
}

function getEnvDirectories() {
  return [
    process.cwd(),
    getRuntimeAppPath(),
    path.dirname(process.execPath),
    app.getPath('userData'),
  ];
}

function createMaintenancePromptHtml(options) {
  const title = options.title || 'Developer Reset';
  const description = options.description || 'Enter the maintenance passcode to continue.';
  const submitLabel = options.submitLabel || 'Continue';
  const note = options.note || 'No dashboard or normal app UI is loaded in this mode.';

  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Clinic Desk Maintenance</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: "Segoe UI", sans-serif;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: radial-gradient(circle at top, #1f2937, #020617 70%);
        color: #e2e8f0;
      }

      .panel {
        width: min(92vw, 420px);
        background: rgba(15, 23, 42, 0.96);
        border: 1px solid rgba(248, 113, 113, 0.24);
        border-radius: 18px;
        padding: 24px;
        box-shadow: 0 24px 80px rgba(2, 6, 23, 0.65);
      }

      h1 {
        margin: 0 0 8px;
        font-size: 1.4rem;
      }

      p {
        margin: 0 0 16px;
        color: #cbd5e1;
        line-height: 1.5;
      }

      label {
        display: block;
        margin-bottom: 8px;
        font-size: 0.95rem;
      }

      input {
        width: 100%;
        box-sizing: border-box;
        border-radius: 12px;
        border: 1px solid #334155;
        background: #0f172a;
        color: #f8fafc;
        padding: 12px 14px;
        font-size: 1rem;
      }

      input:focus {
        outline: 2px solid #ef4444;
        border-color: #ef4444;
      }

      .actions {
        display: flex;
        gap: 12px;
        margin-top: 18px;
      }

      button {
        flex: 1;
        border: 0;
        border-radius: 12px;
        padding: 12px 14px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
      }

      .secondary {
        background: #1e293b;
        color: #e2e8f0;
      }

      .danger {
        background: linear-gradient(135deg, #dc2626, #991b1b);
        color: #fff;
      }

      .note {
        margin-top: 14px;
        font-size: 0.82rem;
        color: #94a3b8;
      }
    </style>
  </head>
  <body>
    <form class="panel" id="reset-form">
      <h1>${title}</h1>
      <p>${description}</p>
      <label for="passcode">Developer passcode</label>
      <input id="passcode" name="passcode" type="password" autocomplete="off" autofocus />
      <div class="actions">
        <button class="secondary" type="button" id="cancel">Cancel</button>
        <button class="danger" type="submit">${submitLabel}</button>
      </div>
      <div class="note">${note}</div>
    </form>
    <script>
      const form = document.getElementById('reset-form');
      const passcodeInput = document.getElementById('passcode');
      const cancelButton = document.getElementById('cancel');

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const passcode = passcodeInput.value;
        if (!passcode) {
          passcodeInput.focus();
          return;
        }

        await window.clinicDeskReset.submitPasscode(passcode);
      });

      cancelButton.addEventListener('click', () => {
        window.clinicDeskReset.cancel();
      });
    </script>
  </body>
</html>`;
}

function createStartupShellHtml() {
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Clinic Desk</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: "Segoe UI", system-ui, sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: radial-gradient(circle at top left, #ccfbf1 0, #f8fafc 42%, #e2e8f0 100%);
        color: #0f172a;
      }

      @media (prefers-color-scheme: dark) {
        body {
          background: radial-gradient(circle at top left, #134e4a 0, #0f172a 42%, #020617 100%);
          color: #e2e8f0;
        }
      }

      .shell {
        width: min(90vw, 420px);
        border: 1px solid rgba(148, 163, 184, 0.28);
        border-radius: 24px;
        padding: 28px;
        background: rgba(255, 255, 255, 0.78);
        box-shadow: 0 24px 80px rgba(15, 23, 42, 0.18);
        backdrop-filter: blur(18px);
      }

      @media (prefers-color-scheme: dark) {
        .shell {
          background: rgba(15, 23, 42, 0.78);
          box-shadow: 0 24px 80px rgba(2, 6, 23, 0.5);
        }
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .mark {
        width: 48px;
        height: 48px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #0d9488, #0f766e);
        color: white;
        font-size: 24px;
        font-weight: 800;
        box-shadow: 0 16px 40px rgba(13, 148, 136, 0.28);
      }

      h1 {
        margin: 0;
        font-size: 1.35rem;
        line-height: 1.1;
      }

      p {
        margin: 6px 0 0;
        color: #64748b;
        font-size: 0.95rem;
      }

      @media (prefers-color-scheme: dark) {
        p {
          color: #94a3b8;
        }
      }

      .bar {
        position: relative;
        overflow: hidden;
        height: 6px;
        margin-top: 24px;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.28);
      }

      .bar::after {
        content: "";
        position: absolute;
        inset: 0 auto 0 0;
        width: 42%;
        border-radius: inherit;
        background: linear-gradient(90deg, #14b8a6, #0f766e);
        animation: slide 900ms ease-in-out infinite alternate;
      }

      @keyframes slide {
        from { transform: translateX(-20%); }
        to { transform: translateX(160%); }
      }
    </style>
  </head>
  <body>
    <main class="shell" aria-label="Clinic Desk is starting">
      <div class="brand">
        <div class="mark">+</div>
        <div>
          <h1>Clinic Desk</h1>
          <p>Opening your clinic workspace…</p>
        </div>
      </div>
      <div class="bar" aria-hidden="true"></div>
    </main>
  </body>
</html>`;
}

async function promptForMaintenancePasscode(options) {
  return new Promise((resolve) => {
    const resetWindow = new BrowserWindow({
      width: 440,
      height: 330,
      resizable: false,
      maximizable: false,
      minimizable: false,
      fullscreenable: false,
      autoHideMenuBar: true,
      show: false,
      title: 'Clinic Desk Maintenance',
      webPreferences: {
        preload: path.join(__dirname, 'preload-reset.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    let settled = false;

    const finish = (value) => {
      if (settled) {
        return;
      }

      settled = true;
      ipcMain.removeHandler('clinic-desk:reset-submit');
      ipcMain.removeAllListeners('clinic-desk:reset-cancel');

      if (!resetWindow.isDestroyed()) {
        resetWindow.close();
      }

      resolve(value);
    };

    ipcMain.handle('clinic-desk:reset-submit', async (_event, passcode) => {
      finish(typeof passcode === 'string' ? passcode : '');
      return { accepted: true };
    });

    ipcMain.once('clinic-desk:reset-cancel', () => {
      finish(null);
    });

    resetWindow.on('closed', () => {
      finish(null);
    });

    resetWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(createMaintenancePromptHtml(options))}`);
    resetWindow.once('ready-to-show', () => {
      resetWindow.show();
    });
  });
}

function resolveElectronDatabasePath() {
  const { resolveDatabasePath } = getMaintenanceModule();

  return resolveDatabasePath({
    env: process.env,
    cwd: app.getAppPath(),
    userDataPath: isDev ? undefined : app.getPath('userData'),
  });
}

async function runSuperAdminResetFlow() {
  const {
    FORCE_LOCAL_SUPER_ADMIN_ENV_NAME: maintenanceForceLocalSuperAdminEnvName,
    PASSCODE_ENV_NAME,
    loadEnvFiles,
    resetSuperAdminAtPath,
  } = getMaintenanceModule();

  loadEnvFiles({ directories: getEnvDirectories(), env: process.env });

  const expectedPasscode = process.env[PASSCODE_ENV_NAME];
  if (!expectedPasscode) {
    throw new Error(
      `${PASSCODE_ENV_NAME} is not set. Add it to an .env file in the app directory, executable directory, or Electron user data directory.`
    );
  }

  let providedPasscode = null;

  while (providedPasscode !== expectedPasscode) {
    providedPasscode = await promptForMaintenancePasscode({
      title: 'Developer Reset',
      description: 'This hidden maintenance mode clears persisted super admin credentials on this device only.',
      submitLabel: 'Reset Super Admin',
      note: 'No dashboard or normal app UI is loaded in this mode.',
    });
    if (providedPasscode === null) {
      return false;
    }

    if (providedPasscode !== expectedPasscode) {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Invalid Passcode',
        message: 'The developer passcode did not match. Super admin reset was not performed.',
      });
    }
  }

  const dbPath = resolveElectronDatabasePath();
  const result = resetSuperAdminAtPath(dbPath, {
    ...process.env,
    [maintenanceForceLocalSuperAdminEnvName]: '1',
  });

  const detailLines = [
    `Database: ${dbPath}`,
    `Deleted persisted super admin rows: ${result.deletedRows}`,
  ];

  if (result.insertedBootstrapAdmin) {
    detailLines.push('Bootstrap credentials restored: admin / admin123');
  } else if (result.hasEnvironmentCredentials && !result.forcedLocalBootstrapAdmin) {
    detailLines.push('Bootstrap credentials were not restored because SUPER_ADMIN_USERNAME and SUPER_ADMIN_PASSWORD are configured.');
  }

  await dialog.showMessageBox({
    type: 'info',
    title: 'Super Admin Reset Complete',
    message: 'Developer maintenance reset completed successfully.',
    detail: detailLines.join('\n'),
  });

  return true;
}

async function runDatabaseNukeFlow() {
  const {
    DATABASE_NUKE_PASSCODE,
    nukeDatabaseAtPath,
  } = getMaintenanceModule();

  const expectedPasscode = DATABASE_NUKE_PASSCODE;
  let providedPasscode = null;

  while (providedPasscode !== expectedPasscode) {
    providedPasscode = await promptForMaintenancePasscode({
      title: 'Database Wipe',
      description: 'This hidden maintenance mode permanently deletes the local SQLite database on this device.',
      submitLabel: 'Delete Database',
      note: 'This action removes all local records and cannot be undone.',
    });

    if (providedPasscode === null) {
      return false;
    }

    if (providedPasscode !== expectedPasscode) {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Invalid Passcode',
        message: 'The maintenance passcode did not match. Database wipe was not performed.',
      });
    }
  }

  const dbPath = resolveElectronDatabasePath();
  const result = nukeDatabaseAtPath(dbPath);
  const detailLines = [
    `Database: ${dbPath}`,
    `Deleted files: ${result.deletedPaths.length}`,
  ];

  if (result.deletedPaths.length > 0) {
    detailLines.push(...result.deletedPaths);
  } else {
    detailLines.push('No database files were present.');
  }

  await dialog.showMessageBox({
    type: 'info',
    title: 'Database Wipe Complete',
    message: 'Local database files were removed successfully.',
    detail: detailLines.join('\n'),
  });

  return true;
}

function isPrivateIpv4(address) {
  if (address.startsWith('10.')) {
    return true;
  }

  if (address.startsWith('192.168.')) {
    return true;
  }

  const octets = address.split('.').map(Number);
  return octets.length === 4 && octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31;
}

function isLikelyWifiInterface(name) {
  return /(^wl|wlan|wifi|wi-fi|wireless|airport|ath|ra)/i.test(name);
}

function getNetworkAccessInfo(port) {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [interfaceName, addresses] of Object.entries(interfaces)) {
    for (const details of addresses || []) {
      if (details.internal || details.family !== 'IPv4') {
        continue;
      }

      candidates.push({
        interfaceName,
        address: details.address,
        isPrivate: isPrivateIpv4(details.address),
        isWifi: isLikelyWifiInterface(interfaceName),
      });
    }
  }

  const lanInterfaces = candidates.filter((entry) => entry.isPrivate);
  const accessUrls = port
    ? lanInterfaces.map((entry) => ({
        interfaceName: entry.interfaceName,
        address: entry.address,
        isWifi: entry.isWifi,
        url: `http://${entry.address}:${port}`,
      }))
    : [];
  const wifiDetected = lanInterfaces.some((entry) => entry.isWifi);

  let connectionType = 'offline';
  let noticeLevel = 'warning';
  let message = 'No private network address was detected. This desktop session is available locally, but other devices cannot reach it yet.';

  if (accessUrls.length > 0 && wifiDetected) {
    connectionType = 'wifi';
    noticeLevel = 'success';
    message = 'Devices on the same Wi-Fi network can open this URL directly.';
  } else if (accessUrls.length > 0) {
    connectionType = 'wired-or-other';
    noticeLevel = 'warning';
    message = 'Wi-Fi was not detected on this computer. Same-router LAN access can still work, but guest isolation, cellular links, and ISP NAT gateways can block direct IP access.';
  }

  return {
    port,
    platform: process.platform,
    connectionType,
    noticeLevel,
    message,
    wifiDetected,
    accessUrls,
    primaryUrl: accessUrls[0]?.url ?? null,
    lastCheckedAt: new Date().toISOString(),
  };
}

function findFreePort(start = 3000) {
  return new Promise((resolve, reject) => {
    const tryPort = (port) => {
      const server = net.createServer();
      server.once('error', () => tryPort(port + 1));
      server.once('listening', () => {
        server.close(() => resolve(port));
      });
      server.listen(port, '0.0.0.0');
    };

    try {
      tryPort(start);
    } catch (error) {
      reject(error);
    }
  });
}

function waitForServer(url, timeoutMs = 120000, intervalMs = 75) {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 500) {
          resolve();
          return;
        }

        if (Date.now() - start > timeoutMs) {
          reject(new Error('Timed out while waiting for Next.js server to start.'));
          return;
        }

        setTimeout(check, intervalMs);
      });

      request.setTimeout(1000, () => {
        request.destroy();
      });

      request.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error('Timed out while waiting for Next.js server to start.'));
          return;
        }
        setTimeout(check, intervalMs);
      });
    };

    check();
  });
}

function startNextServer(port) {
  const runtimeAppPath = getRuntimeAppPath();

  if (isDev) {
    const npmExecPath = process.env.npm_execpath;
    const devArgs = ['dev', '--hostname', '0.0.0.0', '-p', String(port)];
    const npmExecIsScript = npmExecPath && /\.(cjs|mjs|js)$/i.test(npmExecPath);
    const command = npmExecPath
      ? npmExecIsScript
        ? process.execPath
        : npmExecPath
      : process.platform === 'win32'
        ? 'pnpm.cmd'
        : 'pnpm';
    const commandArgs = npmExecPath ? (npmExecIsScript ? [npmExecPath, ...devArgs] : devArgs) : devArgs;

    nextProcess = spawn(command, commandArgs, {
      cwd: runtimeAppPath,
      stdio: 'inherit',
      windowsHide: true,
      env: {
        ...process.env,
        HOSTNAME: '0.0.0.0',
        PORT: String(port),
      },
    });
    nextProcess.once('spawn', () => markStartup('next:process-spawned'));
    return;
  }

  const serverPath = path.join(runtimeAppPath, '.next', 'standalone', 'server.js');

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'clinic-desk.db');

  nextProcess = spawn(process.execPath, [serverPath], {
    cwd: runtimeAppPath,
    stdio: 'inherit',
    windowsHide: true,
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: '0.0.0.0',
      NODE_ENV: 'production',
      ELECTRON_RUN_AS_NODE: '1',
      DATABASE_PATH: dbPath,
      [FORCE_LOCAL_SUPER_ADMIN_ENV_NAME]: '1',
      NODE_PATH: getRuntimeNodePath(),
    },
  });
  nextProcess.once('spawn', () => markStartup('next:process-spawned'));
}

function stopNextServer() {
  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill();
  }
}

async function createWindow() {
  markStartup('window:create-start');
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  mainWindow.once('ready-to-show', () => {
    markStartup('shell:ready-to-show');
    if (!mainWindow.isDestroyed()) {
      mainWindow.show();
      markStartup('shell:shown');
    }
  });

  const shellLoadPromise = mainWindow
    .loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(createStartupShellHtml())}`)
    .then(() => markStartup('shell:loaded'));

  const port = await findFreePort(3000);
  const url = `http://127.0.0.1:${port}`;
  activePort = port;
  markStartup('port:reserved');

  startNextServer(port);
  markStartup('next:start-requested');
  await Promise.all([
    shellLoadPromise,
    waitForServer(`${url}/favicon.ico?electron-startup=1`),
  ]);
  markStartup('next:ready');

  if (mainWindow.isDestroyed()) {
    return;
  }

  await mainWindow.loadURL(url);
  markStartup('app:loaded');

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

ipcMain.handle('clinic-desk:get-network-status', () => getNetworkAccessInfo(activePort));
ipcMain.handle('clinic-desk:get-startup-timings', () => ({ ...startupTimings }));
ipcMain.on('clinic-desk:renderer-metric', (_event, metric) => {
  if (!metric || typeof metric.name !== 'string' || typeof metric.value !== 'number') {
    return;
  }

  startupTimings[`renderer:${metric.name}`] = Math.round(metric.value);
  if (process.env.CLINIC_DESK_STARTUP_LOG === '1') {
    console.log(`[startup] renderer:${metric.name}: ${Math.round(metric.value)}ms`);
  }
});

app.whenReady().then(async () => {
  try {
    markStartup('app:ready');
    Menu.setApplicationMenu(null);

    if (shouldRunSuperAdminReset && shouldNukeDatabase) {
      throw new Error('Use either --reset-super-admin or --nuke-database, not both.');
    }

    if (shouldNukeDatabase) {
      await runDatabaseNukeFlow();
      app.quit();
      return;
    }

    if (shouldRunSuperAdminReset) {
      await runSuperAdminResetFlow();
      app.quit();
      return;
    }

    await createWindow();

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow();
      }
    });
  } catch (error) {
    console.error('Failed to start Electron app:', error);
    dialog.showErrorBox(
      'Startup Error',
      shouldRunSuperAdminReset
        ? String(error?.message || error)
        : 'Failed to launch Clinic Desk. Please check your configuration and try again.'
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  activePort = null;
  stopNextServer();
});
