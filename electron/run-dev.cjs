const { spawn } = require('child_process');

const electronBinary = require('electron');
const child = spawn(electronBinary, ['.', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_DEV: '1',
  },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
