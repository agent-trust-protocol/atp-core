import { readFileSync, existsSync, readdirSync } from 'node:fs';
const inventory = JSON.parse(readFileSync('docs/security/package-inventory.json', 'utf8'));
const recorded = new Set(inventory.map(p => p.directory));
const failures = [];
for (const dir of readdirSync('packages')) {
  if (existsSync(`packages/${dir}/package.json`) && !recorded.has(`packages/${dir}`)) failures.push(`Unclassified package: ${dir}`);
}
for (const pkg of inventory) {
  if (pkg.independentInstall && !existsSync(pkg.lockfile)) failures.push(`Missing lock: ${pkg.directory}`);
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`All ${inventory.length} independently installed packages have lockfiles and classifications.`);
