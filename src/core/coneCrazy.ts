import type { RetailDocument } from './types.ts';
export const CONE_RESET_ACTION = 'action.coneCrazyReset';
export const CONE_MISSION_SHA256 =
  '3287d0e9733ae1028dd877a6bd6273a56744b60a62cfe1057e8697a9d597af4e';
export const CONE_MAIN_SHA256 =
  '1b550a3a949409f6643805bb576934ded4c84f0e327ee1f8c5e6989b13194eed';
export interface ConeProfile {
  readonly id: 'retail-cone-v1';
  readonly missionSha256: string;
}
export interface ConeState {
  statsTime: number;
  comparisonTime: number;
  firstCompletion: number;
  checkpointBonusMs: number;
  checkpointBonusSeconds: number;
  reward: number;
  progress: number;
}
export class ConeError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = 'ConeError';
  }
}
const verified = new WeakSet<ConeProfile>();
const globalsStart = 0xf8;
const coneResetGlobals = new Map([
  [346, 0],
  [350, 0],
  [351, 0],
  [352, 120],
  [1615, 12000],
  [7892, 0],
  [7925, 12],
  [7926, 200],
  [7927, 0],
]);
function match(bytes: Uint8Array, offset: number, pattern: number[]) {
  return pattern.every((b, i) => bytes[offset + i] === b);
}
function coneGameSections(data: Uint8Array) {
  const signature = [2, 0, 1, 0x20, 0x86, 0, 0, 0x6d];
  let base = -1;
  for (let p = 0; p <= data.length - signature.length; p++)
    if (data[p] === 2 && match(data, p, signature)) {
      if (base !== -1) throw new ConeError('gameProfile');
      base = p;
    }
  if (base < 0 || base + 0x994c + 20 + 97 * 4 > data.length)
    throw new ConeError('gameProfile');
  const v = new DataView(data.buffer, data.byteOffset, data.byteLength);
  if (
    v.getUint32(base + 0x8623, true) !== 0x994c ||
    v.getUint32(base + 0x994f, true) !== 0x9ae4 ||
    v.getUint32(base + 0x9954, true) !== 204596 ||
    v.getUint16(base + 0x995c, true) !== 97
  )
    throw new ConeError('gameProfile');
  const table = base + 0x994c + 20,
    a = v.getUint32(table + 91 * 4, true),
    z = v.getUint32(table + 92 * 4, true);
  if (
    a !== 1220970 ||
    z !== 1225938 ||
    base + z > data.length ||
    !match(data, base + 0x10131, [4, 0, 2, 0x80, 5, 4, 120])
  )
    throw new ConeError('gameProfile');
  return {
    mission: data.subarray(base + a, base + z),
    main: data.subarray(base, base + 204596),
  };
}
export async function verifyConeCrazyGameData(
  data: Uint8Array,
): Promise<ConeProfile> {
  if (!globalThis.crypto?.subtle) throw new ConeError('secureContext');
  const { mission, main } = coneGameSections(data);
  const digest = async (bytes: Uint8Array) =>
    [
      ...new Uint8Array(
        await globalThis.crypto.subtle.digest('SHA-256', new Uint8Array(bytes)),
      ),
    ]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  const [hash, mainHash] = await Promise.all([digest(mission), digest(main)]);
  if (hash !== CONE_MISSION_SHA256 || mainHash !== CONE_MAIN_SHA256)
    throw new ConeError('gameProfile');
  const profile: ConeProfile = Object.freeze({
    id: 'retail-cone-v1',
    missionSha256: hash,
  });
  verified.add(profile);
  return profile;
}
export function inspectConeCrazySave(doc: RetailDocument): ConeState {
  const b = doc.original,
    v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (v.getUint32(0xf4, true) !== 34336) throw new ConeError('saveProfile');
  const end = globalsStart + 34336;
  if (
    end + 4 > doc.inspection.blocks[0].data + doc.inspection.blocks[0].size ||
    v.getUint32(end, true) !== 0x248
  )
    throw new ConeError('saveProfile');
  const countOffset = end + 4 + 0x248;
  if (
    countOffset + 4 >
      doc.inspection.blocks[0].data + doc.inspection.blocks[0].size ||
    v.getUint32(countOffset - 12, true) !== 204596 ||
    v.getUint32(countOffset - 8, true) !== 32408 ||
    v.getUint16(countOffset - 4, true) !== 97
  )
    throw new ConeError('saveProfile');
  const count = v.getUint32(countOffset, true),
    records = countOffset + 4;
  if (
    count > 128 ||
    records + count * 0x88 >
      doc.inspection.blocks[0].data + doc.inspection.blocks[0].size
  )
    throw new ConeError('saveProfile');
  for (let i = 0; i < count; i++) {
    const name = String.fromCharCode(
      ...b.subarray(records + i * 0x88 + 8, records + i * 0x88 + 16),
    )
      .split('\0')[0]
      .toLowerCase();
    if (['carprk1', 'carpark1', 'carpark_'].includes(name))
      throw new ConeError('activeChallenge');
  }
  const stat = doc.fields.find((f) => f.id === 'stats.race19')!,
    progress = doc.fields.find((f) => f.id === 'progress.current')!;
  const global = (n: number) => v.getInt32(globalsStart + n * 4, true);
  return {
    statsTime: v.getInt32(stat.offset, true),
    comparisonTime: global(352),
    firstCompletion: global(351),
    checkpointBonusMs: global(1615),
    checkpointBonusSeconds: global(7925),
    reward: global(7926),
    progress: v.getFloat32(progress.offset, true),
  };
}
export function coneCrazyResetPlan(doc: RetailDocument, profile?: ConeProfile) {
  if (!profile || !verified.has(profile)) throw new ConeError('verifyGame');
  const before = inspectConeCrazySave(doc);
  if (before.firstCompletion !== 1) throw new ConeError('notCompleted');
  if (!Number.isFinite(before.progress) || before.progress < 1)
    throw new ConeError('completionCredit');
  return {
    before,
    after: {
      statsTime: 0,
      comparisonTime: 120,
      firstCompletion: 0,
      checkpointBonusMs: 12000,
      checkpointBonusSeconds: 12,
      reward: 200,
      progress: before.progress - 1,
    } satisfies ConeState,
  };
}
/** Only used after a plan is checked against the original save and a verified game profile. */
export function applyConeCrazyReset(
  bytes: Uint8Array,
  doc: RetailDocument,
  profile?: ConeProfile,
) {
  const plan = coneCrazyResetPlan(doc, profile),
    v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (const [index, value] of coneResetGlobals)
    v.setInt32(globalsStart + index * 4, value, true);
  v.setInt32(doc.fields.find((f) => f.id === 'stats.race19')!.offset, 0, true);
  v.setFloat32(
    doc.fields.find((f) => f.id === 'progress.current')!.offset,
    plan.after.progress,
    true,
  );
  return plan;
}
