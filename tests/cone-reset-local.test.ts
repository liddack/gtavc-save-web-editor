import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  prepareConeCrazyResetTest,
  verifyConeCrazyGameData,
} from '../scripts/prepare-cone-crazy-test';
import { checksum, parseRetailSave, readField } from '../src/core/retail';
const gamePath =
  process.env.RETAIL_GAME_DATA_PATH ??
  '/Users/liddack/Downloads/gtavc/game/vcbr/vc-sky-en-v6.data';
const savePath =
  process.env.RETAIL_SAVE_PATH ?? '/private/tmp/Downloads/GTAVCsf1.b';
describe.skipIf(!existsSync(gamePath) || !existsSync(savePath))(
  'private WASM Cone Crazy full reset',
  () => {
    // No game assets are bundled. These tests run only when the owner's local files exist.
    const game = existsSync(gamePath)
      ? new Uint8Array(readFileSync(gamePath))
      : new Uint8Array();
    const original = existsSync(savePath)
      ? new Uint8Array(readFileSync(savePath))
      : new Uint8Array();
    const postSavePath = '.local/validation/cone-crazy-42s.b';
    it.skipIf(!existsSync(postSavePath))(
      'verifies the real post-game 42-second save, single completion credit and repeat-reset accounting',
      async () => {
        const bytes = new Uint8Array(readFileSync(postSavePath));
        const doc = parseRetailSave(bytes),
          view = new DataView(bytes.buffer);
        const value = (id: string) =>
          readField(
            bytes,
            doc.fields.find((f) => f.id === id)!,
          );
        expect(value('stats.race19')).toBe(42);
        expect(value('progress.current')).toBe(63);
        expect(value('progress.total')).toBe(154);
        expect(value('player.money')).toBe(27583);
        for (const [index, expected] of [
          [351, 1],
          [352, 42],
          [1615, 10000],
          [7925, 10],
          [7926, 400],
        ])
          expect(view.getInt32(0xf8 + index * 4, true)).toBe(expected);
        const reset = await prepareConeCrazyResetTest(bytes, game);
        expect(reset.manifest.before.progress).toBe(63);
        expect(reset.manifest.after.progress).toBe(62);
        const nextDoc = parseRetailSave(reset.bytes);
        expect(
          readField(
            reset.bytes,
            nextDoc.fields.find((f) => f.id === 'player.money')!,
          ),
        ).toBe(27583);
      },
    );
    const fix = (b: Uint8Array) =>
      new DataView(b.buffer).setUint32(b.length - 4, checksum(b), true);
    it('restores initial challenge state, revokes one credit and preserves money and all unrelated bytes', async () => {
      const snapshot = original.slice(),
        doc = parseRetailSave(original),
        view = new DataView(original.buffer);
      const { bytes, manifest } = await prepareConeCrazyResetTest(
          original,
          game,
        ),
        out = new DataView(bytes.buffer);
      for (const [index, value] of [
        [346, 0],
        [350, 0],
        [351, 0],
        [352, 120],
        [1615, 12000],
        [7892, 0],
        [7925, 12],
        [7926, 200],
        [7927, 0],
      ])
        expect(out.getInt32(0xf8 + index * 4, true)).toBe(value);
      const stat = doc.fields.find((f) => f.id === 'stats.race19')!,
        progress = doc.fields.find((f) => f.id === 'progress.current')!;
      expect(out.getUint32(stat.offset, true)).toBe(0);
      expect(out.getFloat32(progress.offset, true)).toBe(
        view.getFloat32(progress.offset, true) - 1,
      );
      const allowed = new Set([
        ...Array.from({ length: 4 }, (_, i) => stat.offset + i),
        ...Array.from({ length: 4 }, (_, i) => progress.offset + i),
        ...Array.from({ length: 4 }, (_, i) => bytes.length - 4 + i),
        ...[346, 350, 351, 352, 1615, 7892, 7925, 7926, 7927].flatMap((n) =>
          Array.from({ length: 4 }, (_, i) => 0xf8 + n * 4 + i),
        ),
      ]);
      expect(
        [...bytes.keys()].every(
          (i) => bytes[i] === original[i] || allowed.has(i),
        ),
      ).toBe(true);
      expect(
        readField(
          bytes,
          doc.fields.find((f) => f.id === 'player.money')!,
        ),
      ).toBe(
        readField(
          original,
          doc.fields.find((f) => f.id === 'player.money')!,
        ),
      );
      expect(parseRetailSave(bytes).inspection.valid).toBe(true);
      expect(original).toEqual(snapshot);
      expect(manifest.after.reward).toBe(200);
      expect(manifest.after.checkpointBonusSeconds).toBe(12);
    });
    it('refuses a second reset and saves inside the active challenge', async () => {
      const first = (await prepareConeCrazyResetTest(original, game)).bytes;
      await expect(prepareConeCrazyResetTest(first, game)).rejects.toThrow(
        'notCompleted',
      );
      const active = original.slice(),
        v = new DataView(active.buffer),
        end = 0xf8 + v.getUint32(0xf4, true);
      const firstName = end + 4 + v.getUint32(end, true) + 4 + 8;
      active.set(Buffer.from('CARPRK1\0'), firstName);
      fix(active);
      await expect(prepareConeCrazyResetTest(active, game)).rejects.toThrow(
        'activeChallenge',
      );
    });
    it('rejects unknown game packages and mismatched save metadata', async () => {
      await expect(
        verifyConeCrazyGameData(new Uint8Array(1024)),
      ).rejects.toThrow();
      const changed = original.slice(),
        v = new DataView(changed.buffer),
        end = 0xf8 + v.getUint32(0xf4, true),
        count = end + 4 + v.getUint32(end, true);
      v.setUint32(count - 12, 204600, true);
      fix(changed);
      await expect(prepareConeCrazyResetTest(changed, game)).rejects.toThrow(
        'saveProfile',
      );
    });
  },
);
