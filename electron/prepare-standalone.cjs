const fs = require('fs');
const path = require('path');

const appRoot = path.resolve(__dirname, '..');
const rootStaticDir = path.join(appRoot, '.next', 'static');
const standaloneRootDir = path.join(appRoot, '.next', 'standalone');
const standaloneNextDir = path.join(appRoot, '.next', 'standalone', '.next');
const standaloneStaticDir = path.join(standaloneNextDir, 'static');
const standaloneNodeModulesDir = path.join(standaloneRootDir, 'node_modules');
const standaloneServerNodeModulesDir = path.join(standaloneNextDir, 'server', 'node_modules');

function collectHashedExternalPackages(rootDir) {
  const hashedPackages = new Set();
  const hashSuffixPattern = /require\("([^"]+-[0-9a-f]{16})"\)|e\.y\("([^"]+-[0-9a-f]{16})"\)/g;

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      if (!entry.isFile() || !absolutePath.endsWith('.js')) {
        continue;
      }

      const contents = fs.readFileSync(absolutePath, 'utf8');
      for (const match of contents.matchAll(hashSuffixPattern)) {
        const packageName = match[1] || match[2];
        if (packageName) {
          hashedPackages.add(packageName);
        }
      }
    }
  }

  walk(rootDir);

  return Array.from(hashedPackages).sort();
}

function getCanonicalPackageName(hashedPackageName) {
  return hashedPackageName.replace(/-[0-9a-f]{16}$/, '');
}

function ensureExternalPackageAliases() {
  const hashedPackages = collectHashedExternalPackages(path.join(standaloneNextDir, 'server'));
  const createdAliases = [];
  const aliasRootDirs = [
    standaloneNodeModulesDir,
    standaloneServerNodeModulesDir,
  ];

  for (const hashedPackageName of hashedPackages) {
    const canonicalPackageName = getCanonicalPackageName(hashedPackageName);
    for (const aliasRootDir of aliasRootDirs) {
      const aliasDir = path.join(aliasRootDir, hashedPackageName);
      const packageJsonPath = path.join(aliasDir, 'package.json');
      const indexPath = path.join(aliasDir, 'index.js');

      fs.mkdirSync(aliasDir, { recursive: true });
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(
          {
            name: hashedPackageName,
            private: true,
            main: 'index.js',
          },
          null,
          2
        ) + '\n'
      );
      fs.writeFileSync(indexPath, `module.exports = require(${JSON.stringify(canonicalPackageName)});\n`);
    }

    createdAliases.push({ hashedPackageName, canonicalPackageName });
  }

  return createdAliases;
}

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

const aliasPackages = ensureExternalPackageAliases();

console.log(`Copied Next static assets into standalone bundle: ${standaloneStaticDir}`);
if (aliasPackages.length > 0) {
  console.log(
    `Created standalone external package aliases: ${aliasPackages
      .map((entry) => `${entry.hashedPackageName} -> ${entry.canonicalPackageName}`)
      .join(', ')}`
  );
}