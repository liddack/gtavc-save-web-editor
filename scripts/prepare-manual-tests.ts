import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { exportRetailSave, parseRetailSave } from '../src/core/retail.ts';
import type { Changes } from '../src/core/types.ts';
const path =
  process.env.RETAIL_SAVE_PATH ?? '/private/tmp/Downloads/GTAVCsf1.b';
const bytes = new Uint8Array(await readFile(path));
const doc = parseRetailSave(bytes);
const root = resolve('.local/manual-tests');
await mkdir(root, { recursive: true });
const cases: Record<string, Changes> = {
  '00-identical': {},
  '01-money': { 'player.money': 50000 },
  '02-attributes': { 'player.health': 90, 'player.armor': 50 },
  '03-world': { 'world.hour': 12, 'world.minute': 0, 'world.forcedWeather': 4 },
  '04-weapons': { 'weapon.5.type': 22, 'weapon.5.ammo': 150 },
};
const manifest: {
  case: string;
  changes: Changes;
  changedBytes: number;
  sha256: string;
}[] = [];
for (const [name, changes] of Object.entries(cases)) {
  const result = exportRetailSave(doc, changes);
  const dir = join(root, name);
  await mkdir(dir, { recursive: true });
  // Never write into the input directory or overwrite an existing test case.
  await writeFile(join(dir, 'GTAVCsf2.b'), result.bytes, { flag: 'wx' });
  manifest.push({
    case: name,
    changes,
    changedBytes: result.changedBytes,
    sha256: createHash('sha256').update(result.bytes).digest('hex'),
  });
}
await writeFile(
  join(root, 'manifest.json'),
  JSON.stringify(
    {
      sourceSha256: createHash('sha256').update(bytes).digest('hex'),
      runtimeValidation: 'pending',
      cases: manifest,
    },
    null,
    2,
  ) + '\n',
  { flag: 'wx' },
);
console.log(
  `Prepared ${manifest.length} private test copies in ${root}. The input file was not changed.`,
);
