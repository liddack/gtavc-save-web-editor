import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import {
  exportRetailSave,
  parseRetailSave,
  readField,
} from '../src/core/retail';
const path =
  process.env.RETAIL_SAVE_PATH ?? '/private/tmp/Downloads/GTAVCsf1.b';
it.skipIf(!existsSync(path))(
  'round-trips the private Retail save and checks known attributes',
  () => {
    const b = new Uint8Array(readFileSync(path)),
      doc = parseRetailSave(b);
    expect(exportRetailSave(doc, {}).bytes).toEqual(b);
    // Pin known expectations only for the reference file; other local saves still get a round trip.
    if (
      createHash('sha256').update(b).digest('hex') ===
      '324b5cff7aa4fd1588ec95a723bcf87076bb1da10a1da66e1184d92b1881ecf4'
    ) {
      expect(doc.inspection.name).toBe('Hit the Courier');
      const get = (id: string) =>
        readField(
          b,
          doc.fields.find((f) => f.id === id)!,
        );
      expect(get('player.money')).toBe(26983);
      expect(get('player.health')).toBe(100);
      expect(get('garage.6.model')).toBe(145);
      expect(get('garage.10.model')).toBe(191);
      expect(get('garage.22.model')).toBe(132);
    }
    const exported = exportRetailSave(doc, {
      'player.money': 50000,
      'player.health': 90,
      'world.hour': 12,
    });
    const reopened = parseRetailSave(exported.bytes);
    expect(
      readField(
        exported.bytes,
        reopened.fields.find((f) => f.id === 'player.money')!,
      ),
    ).toBe(50000);
    expect(doc.original).toEqual(b);
  },
);
