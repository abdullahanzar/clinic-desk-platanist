const fs = require('fs');
const path = require('path');

const appRoot = path.resolve(__dirname, '..');
const rootStaticDir = path.join(appRoot, '.next', 'static');
const standaloneNextDir = path.join(appRoot, '.next', 'standalone', '.next');
const standaloneStaticDir = path.join(standaloneNextDir, 'static');

if (!fs.existsSync(rootStaticDir)) {
  throw new Error(`Missing Next static assets at ${rootStaticDir}. Run next build first.`);
}

if (!fs.existsSync(standaloneNextDir)) {
  throw new Error(
    `Missing standalone Next output at ${standaloneNextDir}. Ensure output: "standalone" is enabled.`
  );
}

fs.mkdirSync(standaloneStaticDir, { recursive: true });
fs.cpSync(rootStaticDir, standaloneStaticDir, { recursive: true, force: true });

console.log(`Copied Next static assets into standalone bundle: ${standaloneStaticDir}`);