/** CLI wrapper around the same verified reset operation used by the web editor. */
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { exportRetailSave, parseRetailSave } from '../src/core/retail.ts';

import {
  CONE_RESET_ACTION,
  coneCrazyResetPlan,
  verifyConeCrazyGameData,
} from '../src/core/coneCrazy.ts';
export {
  CONE_MISSION_SHA256,
  verifyConeCrazyGameData,
} from '../src/core/coneCrazy.ts';
const hash = (bytes: Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex');

export async function prepareConeCrazyResetTest(
  save: Uint8Array,
  gameData: Uint8Array,
) {
  const profile = await verifyConeCrazyGameData(gameData);
  const doc = parseRetailSave(save),
    plan = coneCrazyResetPlan(doc, profile);
  const { bytes } = exportRetailSave(doc, { [CONE_RESET_ACTION]: 1 }, profile);
  return {
    bytes,
    manifest: {
      status:
        'script profile validated by owner gameplay and post-save inspection; newly generated copy not yet played',
      missionSha256: profile.missionSha256,
      sourceSha256: hash(save),
      outputSha256: hash(bytes),
      changedOffsets: [...save.keys()]
        .filter((i) => save[i] !== bytes[i])
        .map((i) => `0x${i.toString(16)}`),
      ...plan,
      purpose:
        'Full Cone Crazy reset. Restore initial record, tutorial, difficulty and reward; revoke one completion credit. Preserve money and unrelated state.',
    },
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const [dataPath, savePath] = process.argv.slice(2);
  if (!dataPath || !savePath)
    throw new Error(
      'Usage: npm run prepare:cone-test -- /path/game.data /path/save.b',
    );
  const result = await prepareConeCrazyResetTest(
    new Uint8Array(await readFile(savePath)),
    new Uint8Array(await readFile(dataPath)),
  );
  const out = resolve('.local/cone-crazy-full-reset-test');
  await mkdir(out, { recursive: true });
  await writeFile(join(out, 'GTAVCsf2.b'), result.bytes, { flag: 'wx' });
  await writeFile(
    join(out, 'manifest.json'),
    JSON.stringify(result.manifest, null, 2) + '\n',
    { flag: 'wx' },
  );
  console.log(
    `Private test copy prepared in ${out}. Source save and game assets were not changed.`,
  );
}
