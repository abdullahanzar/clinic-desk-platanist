const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const http = require('http');

const isDev = process.env.ELECTRON_DEV === '1';
let nextProcess = null;

function findFreePort(start = 3000) {
  return new Promise((resolve, reject) => {
    const tryPort = (port) => {
      const server = net.createServer();
      server.once('error', () => tryPort(port + 1));
      server.once('listening', () => {
        server.close(() => resolve(port));
      });
      server.listen(port, '127.0.0.1');
    };

    try {
      tryPort(start);
    } catch (error) {
      reject(error);
    }
  });
}

function waitForServer(url, timeoutMs = 120000) {
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

        setTimeout(check, 500);
      });

      request.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error('Timed out while waiting for Next.js server to start.'));
          return;
        }
        setTimeout(check, 500);
      });
    };

    check();
  });
}

function startNextServer(port) {
  if (isDev) {
    const cmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
    nextProcess = spawn(cmd, ['dev', '-p', String(port)], {
      cwd: app.getAppPath(),
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: String(port),
      },
    });
    return;
  }

  const serverPath = path.join(app.getAppPath(), '.next', 'standalone', 'server.js');

  nextProcess = spawn(process.execPath, [serverPath], {
    cwd: app.getAppPath(),
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
      ELECTRON_RUN_AS_NODE: '1',
    },
  });
}

function stopNextServer() {
  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill();
  }
}

async function createWindow() {
  const port = await findFreePort(3000);
  const url = `http://127.0.0.1:${port}`;

  startNextServer(port);
  await waitForServer(url);

  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  await mainWindow.loadURL(url);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(async () => {
  try {
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
      'Failed to launch Clinic Desk. Please check your configuration and try again.'
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
  stopNextServer();
});
