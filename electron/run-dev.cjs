const { spawn } = require('child_process');

const cmd = process.platform === 'win32' ? 'electron.cmd' : 'electron';
const child = spawn(cmd, ['.'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_DEV: '1',
  },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
