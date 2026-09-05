// Generated resource, not a second hand-maintained trip plan.
const fs = require('node:fs');
const path = require('node:path');
const { companionFeed } = require('../lib/companion-feed');
const target = path.resolve(__dirname, '../companion/Roadbook/Resources/plans.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(companionFeed(), null, 2) + '\n');
console.log('Bundled companion plan exported.');
