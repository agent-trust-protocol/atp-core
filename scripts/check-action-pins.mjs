import { readdirSync, readFileSync } from 'node:fs';
const failures = [];
for (const file of readdirSync('.github/workflows').filter(f => /\.ya?ml$/.test(f))) {
  for (const match of readFileSync(`.github/workflows/${file}`, 'utf8').matchAll(/uses:\s*([^\s#]+)/g)) {
    const ref = match[1];
    if (!ref.startsWith('./') && !/^[\w.-]+\/[\w./-]+@[a-f0-9]{40}$/.test(ref)) failures.push(`${file}: ${ref}`);
  }
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('All workflow action references use immutable commit SHAs.');
