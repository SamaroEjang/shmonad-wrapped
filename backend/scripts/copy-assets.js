const { cpSync, mkdirSync } = require('fs');
const { dirname } = require('path');

const assets = [
  { from: 'src/db/schema.sql', to: 'dist/db/schema.sql' },
  { from: 'src/data', to: 'dist/data', dir: true },
];

for (const { from, to, dir } of assets) {
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, dir ? { recursive: true } : undefined);
  console.log(`copied ${from} → ${to}`);
}
