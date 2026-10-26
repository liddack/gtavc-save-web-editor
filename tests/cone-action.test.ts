import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CONE_MAIN_SHA256,
  CONE_MISSION_SHA256,
  CONE_RESET_ACTION,
  coneCrazyResetPlan,
  verifyConeCrazyGameData,
  type ConeProfile,
} from '../src/core/coneCrazy';
import {
  checksum,
  exportRetailSave,
  parseRetailSave,
  validateChanges,
} from '../src/core/retail';
import { syntheticSave } from './fixture';
import { syntheticGameData, coneSave } from './cone-fixture';
async function mockVerifiedProfile() {
  vi.spyOn(crypto.subtle, 'digest').mockImplementation(
    async (_algorithm, data) => {
      const hash =
        data.byteLength === 4968 ? CONE_MISSION_SHA256 : CONE_MAIN_SHA256;
      return Uint8Array.from(hash.match(/../g)!, (b) => parseInt(b, 16)).buffer;
    },
  );
  return verifyConeCrazyGameData(syntheticGameData());
}
afterEach(() => vi.restoreAllMocks());
describe('atomic client-side Cone Crazy reset', () => {
  it('rejects missing or forged verification and unknown game code', async () => {
    const doc = parseRetailSave(coneSave()),
      changes = { [CONE_RESET_ACTION]: 1 };
    expect(() => exportRetailSave(doc, changes)).toThrow('verifyGame');
    expect(() =>
      exportRetailSave(doc, changes, {
        id: 'retail-cone-v1',
        missionSha256: CONE_MISSION_SHA256,
      } as ConeProfile),
    ).toThrow('verifyGame');
    await expect(verifyConeCrazyGameData(syntheticGameData())).rejects.toThrow(
      'gameProfile',
    );
    await expect(verifyConeCrazyGameData(new Uint8Array(3))).rejects.toThrow(
      'gameProfile',
    );
  });
  it('requires both the mission and MAIN digest', async () => {
    vi.spyOn(crypto.subtle, 'digest').mockImplementation(
      async (_algorithm, data) =>
        Uint8Array.from(
          (data.byteLength === 4968
            ? CONE_MISSION_SHA256
            : '0'.repeat(64)
          ).match(/../g)!,
          (b) => parseInt(b, 16),
        ).buffer,
    );
    await expect(verifyConeCrazyGameData(syntheticGameData())).rejects.toThrow(
      'gameProfile',
    );
  });
  it('combines reset with an unrelated edit, preserves opaque bytes and restores original on undo', async () => {
    const doc = parseRetailSave(coneSave()),
      profile = await mockVerifiedProfile();
    const reset = exportRetailSave(
      doc,
      { [CONE_RESET_ACTION]: 1, 'player.money': 50000 },
      profile,
    );
    const parsed = parseRetailSave(reset.bytes),
      v = new DataView(reset.bytes.buffer);
    expect(v.getInt32(0xf8 + 351 * 4, true)).toBe(0);
    expect(v.getInt32(0xf8 + 352 * 4, true)).toBe(120);
    expect(v.getInt32(0xf8 + 7926 * 4, true)).toBe(200);
    expect(
      v.getFloat32(
        parsed.fields.find((f) => f.id === 'progress.current')!.offset,
        true,
      ),
    ).toBe(62);
    expect(
      v.getInt32(
        parsed.fields.find((f) => f.id === 'player.money')!.offset,
        true,
      ),
    ).toBe(50000);
    expect(exportRetailSave(doc, {}, profile).bytes).toEqual(doc.original);
    const allowed = new Set([
      ...Array.from({ length: 4 }, (_, i) => doc.original.length - 4 + i),
      ...[346, 350, 351, 352, 1615, 7892, 7925, 7926, 7927].flatMap((n) =>
        Array.from({ length: 4 }, (_, i) => 0xf8 + n * 4 + i),
      ),
      ...['player.money', 'progress.current', 'stats.race19'].flatMap((id) => {
        const f = doc.fields.find((f) => f.id === id)!;
        return [f.offset, ...(f.mirrors ?? [])].flatMap((o) =>
          Array.from({ length: 4 }, (_, i) => o + i),
        );
      }),
    ]);
    expect(
      [...doc.original.keys()].every(
        (i) => reset.bytes[i] === doc.original[i] || allowed.has(i),
      ),
    ).toBe(true);
    expect(() => coneCrazyResetPlan(parsed, profile)).toThrow('notCompleted');
  });
  it('rejects conflicting record edits, wrong action values, insufficient credit and mismatched save layouts', async () => {
    const profile = await mockVerifiedProfile(),
      doc = parseRetailSave(coneSave());
    expect(
      validateChanges(
        doc,
        { [CONE_RESET_ACTION]: 1, 'stats.race19': 12 },
        profile,
      ),
    ).toContainEqual({ field: CONE_RESET_ACTION, code: 'resetConflict' });
    expect(() =>
      exportRetailSave(doc, { [CONE_RESET_ACTION]: 0 }, profile),
    ).toThrow('resetValue');
    const b = coneSave(),
      v = new DataView(b.buffer);
    v.setFloat32(
      doc.fields.find((f) => f.id === 'progress.current')!.offset,
      0,
      true,
    );
    v.setUint32(b.length - 4, checksum(b), true);
    expect(() =>
      exportRetailSave(parseRetailSave(b), { [CONE_RESET_ACTION]: 1 }, profile),
    ).toThrow('completionCredit');
    expect(() =>
      exportRetailSave(
        parseRetailSave(syntheticSave()),
        { [CONE_RESET_ACTION]: 1 },
        profile,
      ),
    ).toThrow('saveProfile');
  });
});
