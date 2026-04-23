const fs = require('fs');
const path = require('path');

const HASHED_EXTERNAL_PATTERN = /require\("([^"]+-[0-9a-f]{16})"\)|e\.y\("([^"]+-[0-9a-f]{16})"\)/g;

function collectHashedExternalPackages(rootDir) {
  const hashedPackages = new Set();

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
      for (const match of contents.matchAll(HASHED_EXTERNAL_PATTERN)) {
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

function writeAliasPackage(aliasRootDir, hashedPackageName, canonicalPackageName) {
  const aliasDir = path.join(aliasRootDir, hashedPackageName);
  fs.mkdirSync(aliasDir, { recursive: true });
  fs.writeFileSync(
    path.join(aliasDir, 'package.json'),
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
  fs.writeFileSync(
    path.join(aliasDir, 'index.js'),
    `module.exports = require(${JSON.stringify(canonicalPackageName)});\n`
  );
}

async function afterPack(context) {
  const unpackedRoot = path.join(context.appOutDir, 'resources', 'app.asar.unpacked');
  const serverDir = path.join(unpackedRoot, '.next', 'standalone', '.next', 'server');

  if (!fs.existsSync(serverDir)) {
    return;
  }

  const hashedPackages = collectHashedExternalPackages(serverDir);
  const aliasRootDirs = [
    path.join(unpackedRoot, 'node_modules'),
    path.join(serverDir, 'node_modules'),
  ];

  for (const hashedPackageName of hashedPackages) {
    const canonicalPackageName = getCanonicalPackageName(hashedPackageName);
    for (const aliasRootDir of aliasRootDirs) {
      writeAliasPackage(aliasRootDir, hashedPackageName, canonicalPackageName);
    }
  }

  if (hashedPackages.length > 0) {
    console.log(
      `afterPack restored external package aliases: ${hashedPackages
        .map((hashedPackageName) => `${hashedPackageName} -> ${getCanonicalPackageName(hashedPackageName)}`)
        .join(', ')}`
    );
  }
}

module.exports = afterPack;
