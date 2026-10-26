import { describe, expect, it } from 'vitest';
import {
  checksum,
  exportRetailSave,
  inspectSave,
  parseRetailSave,
  readField,
  validateChanges,
} from '../src/core/retail';
import { garageVehicles, vehicles } from '../src/core/catalogs';
import type { Changes, Field, RetailDocument } from '../src/core/types';
import { syntheticSave } from './fixture';
const fixChecksum = (b: Uint8Array) =>
  new DataView(b.buffer, b.byteOffset, b.byteLength).setUint32(
    b.length - 4,
    checksum(b),
    true,
  );
const get = (doc: RetailDocument, id: string) =>
  doc.fields.find((f) => f.id === id)!;
function changedOffsets(a: Uint8Array, b: Uint8Array) {
  return [...a.keys()].filter((i) => a[i] !== b[i]);
}
function allowedOffsets(f: Field) {
  const width =
    f.type === 'name'
      ? 48
      : f.type === 'u8'
        ? 1
        : ['u16', 'i16'].includes(f.type)
          ? 2
          : 4;
  return [f.offset, ...(f.mirrors ?? [])].flatMap((p) =>
    Array.from({ length: width }, (_, i) => p + i),
  );
}
describe('Retail binary contract', () => {
  it('gives every field a unique ID and non-overlapping write locations', () => {
    const doc = parseRetailSave(syntheticSave());
    expect(new Set(doc.fields.map((f) => f.id)).size).toBe(doc.fields.length);
    const occupied = new Map<number, string>();
    for (const f of doc.fields.filter((f) => !f.readOnly))
      for (const offset of allowedOffsets(f)) {
        expect(
          occupied.get(offset),
          `${f.id} overlaps ${occupied.get(offset)}`,
        ).toBeUndefined();
        occupied.set(offset, f.id);
      }
  });
  it('recognises 23 blocks and produces an exact round trip including padding', () => {
    const bytes = syntheticSave(),
      doc = parseRetailSave(bytes);
    expect(doc.inspection.valid).toBe(true);
    expect(doc.inspection.blocks).toHaveLength(23);
    expect(doc.inspection.name).toBe('Synthetic workshop');
    expect(exportRetailSave(doc, {}).bytes).toEqual(bytes);
    const padded = new Uint8Array(bytes.length + 20);
    padded.set(bytes, 7);
    expect(
      parseRetailSave(padded.subarray(7, 7 + bytes.length)).inspection.valid,
    ).toBe(true);
  });
  it('updates both money values and only the declared bytes and checksum', () => {
    const doc = parseRetailSave(syntheticSave()),
      f = get(doc, 'player.money');
    const { bytes } = exportRetailSave(doc, { [f.id]: 123456 });
    expect(readField(bytes, f)).toBe(123456);
    expect(new DataView(bytes.buffer).getUint32(f.mirrors![0], true)).toBe(
      123456,
    );
    const allowed = new Set([
      ...allowedOffsets(f),
      ...Array.from({ length: 4 }, (_, i) => bytes.length - 4 + i),
    ]);
    expect(
      changedOffsets(doc.original, bytes).every((i) => allowed.has(i)),
    ).toBe(true);
    expect(inspectSave(bytes).valid).toBe(true);
  });
  it('does not normalise untouched unusual fields or unknown IDs', () => {
    const b = syntheticSave(),
      doc = parseRetailSave(b),
      f = get(doc, 'garage.6.model');
    new DataView(b.buffer).setUint32(f.offset, 50000, true);
    fixChecksum(b);
    const unknown = parseRetailSave(b);
    expect(exportRetailSave(unknown, {}).bytes).toEqual(b);
    expect(
      exportRetailSave(unknown, { 'player.money': 42 }).bytes.slice(
        f.offset,
        f.offset + 4,
      ),
    ).toEqual(b.slice(f.offset, f.offset + 4));
  });
  it('uses actual block boundaries when a variable block grows', () => {
    const old = syntheticSave(),
      doc = parseRetailSave(old),
      start = doc.inspection.blocks[5].header,
      end = doc.inspection.blocks[22].data + 748;
    const b = new Uint8Array(old);
    b.set(old.subarray(start, end), start + 4);
    const v = new DataView(b.buffer);
    // Grow block 4 by four bytes, move all following blocks and preserve the fixed file size.
    const b4 = doc.inspection.blocks[4];
    v.setUint32(b4.header, b4.size + 4, true);
    fixChecksum(b);
    const moved = parseRetailSave(b);
    expect(get(moved, 'player.money').offset).toBe(
      get(doc, 'player.money').offset + 4,
    );
    expect(
      readField(
        exportRetailSave(moved, { 'player.money': 99 }).bytes,
        get(moved, 'player.money'),
      ),
    ).toBe(99);
  });
  it('rejects wrong sizes, corrupt checksums, invalid sizes and bad signatures', () => {
    expect(inspectSave(new Uint8Array(5)).diagnostics).toContain('size');
    const b = syntheticSave();
    b[100] ^= 1;
    expect(inspectSave(b).diagnostics).toContain('checksum');
    expect(() => parseRetailSave(b)).toThrow();
    const bad = syntheticSave();
    new DataView(bad.buffer).setUint32(0, 0xffffffff, true);
    fixChecksum(bad);
    expect(inspectSave(bad).valid).toBe(false);
    const sig = syntheticSave(),
      d = parseRetailSave(sig);
    sig[d.inspection.blocks[13].data + 4] = 0;
    fixChecksum(sig);
    expect(inspectSave(sig).diagnostics).toContain('layout');
  });
  it('diagnoses Steam layout and rejects arbitrary renamed files', () => {
    const steam = syntheticSave();
    steam.set([83, 67, 82, 0], 0xf0);
    steam.fill(0, 0xec, 0xf0);
    fixChecksum(steam);
    expect(inspectSave(steam).format).toBe('steam');
    expect(inspectSave(steam).valid).toBe(false);
    expect(inspectSave(new Uint8Array(201828)).format).toBe('unsupported');
  });
  it('rejects forbidden, nonfinite, fractional, out of range and cross-field changes', () => {
    const doc = parseRetailSave(syntheticSave());
    const invalidCases: Changes[] = [
      { 'player.money': NaN },
      { 'player.money': Infinity },
      { 'player.money': 1.1 },
      { 'player.money': -1 },
      { 'world.hour': 24 },
      { 'world.minute': 60 },
      { 'player.health': 101 },
      { 'player.maxHealth': 99 },
      { 'progress.properties': 2 },
      { 'not-a-field': 1 },
      { 'spawn.0.minDelay': 3000 },
      { 'world.name': '~r~bad' },
      { 'world.name': 'Água' },
      { 'world.name': '' },
    ];
    for (const changes of invalidCases)
      expect(() => exportRetailSave(doc, changes)).toThrow();
    expect(
      validateChanges(doc, { 'player.health': 150, 'player.maxHealth': 150 }),
    ).toEqual([]);
  });
  it('resets associated weapon state and clamps clip ammunition', () => {
    const doc = parseRetailSave(syntheticSave()),
      f = get(doc, 'weapon.5.type');
    const changed = exportRetailSave(doc, {
      'weapon.5.type': 22,
      'weapon.5.ammo': 70,
    }).bytes;
    const v = new DataView(changed.buffer);
    expect(v.getUint32(f.offset, true)).toBe(22);
    expect(v.getUint32(f.offset + 4, true)).toBe(0);
    expect(v.getUint32(f.offset + 8, true)).toBe(1);
    expect(v.getUint32(f.offset + 12, true)).toBe(70);
    const reduced = exportRetailSave(doc, { 'weapon.5.ammo': 5 }).bytes;
    expect(new DataView(reduced.buffer).getUint32(f.offset + 8, true)).toBe(5);
    expect(() => exportRetailSave(doc, { 'weapon.5.type': 17 })).toThrow();
    expect(() => exportRetailSave(doc, { 'weapon.5.type': 0 })).toThrow();
    expect(() =>
      exportRetailSave(doc, { 'weapon.2.type': 13, 'weapon.2.ammo': 5 }),
    ).toThrow();
  });
  it('edits every supported scalar without touching unrelated bytes', () => {
    const doc = parseRetailSave(syntheticSave());
    const fields = doc.fields.filter(
      (f) =>
        !f.readOnly &&
        !f.id.startsWith('weapon.') &&
        !f.id.startsWith('player.max') &&
        !f.id.endsWith('.minDelay'),
    );
    for (const f of fields) {
      const before = readField(doc.original, f);
      let next =
        f.type === 'name'
          ? 'Changed'
          : (f.options?.find((o) => o.value !== before)?.value ??
            (Number(before) === f.min ? Number(before) + 1 : (f.min ?? 0)));
      if (f.id === 'player.health') next = 90;
      if (f.id === 'player.armor') next = 40;
      if (f.id.endsWith('.maxDelay')) next = 3000;
      const changes: Changes = { [f.id]: next };
      const result = exportRetailSave(doc, changes);
      expect(readField(result.bytes, f)).toBe(
        f.type === 'f32' ? Math.fround(Number(next)) : next,
      );
      const allowed = new Set([
        ...allowedOffsets(f),
        ...Array.from({ length: 4 }, (_, i) => result.bytes.length - 4 + i),
      ]);
      expect(
        changedOffsets(doc.original, result.bytes).every((i) => allowed.has(i)),
        f.id,
      ).toBe(true);
    }
  });
  it('cannot write arbitrary offsets through a forged field descriptor', () => {
    const doc = parseRetailSave(syntheticSave());
    const original = doc.original.slice();
    const forged = {
      ...doc,
      fields: doc.fields.map((f) =>
        f.id === 'player.money' ? { ...f, offset: 1 } : f,
      ),
    };
    const result = exportRetailSave(forged, { 'player.money': 123 });
    expect(result.bytes.subarray(0, 4)).toEqual(original.subarray(0, 4));
  });
  it('has the correct factual model IDs and excludes unsuitable garage replacements', () => {
    expect(vehicles).toHaveLength(107);
    expect(vehicles.find((v) => v.value === 191)?.label[0]).toContain(
      'PCJ-600',
    );
    expect(vehicles.find((v) => v.value === 162)?.label[0]).toContain('Rhino');
    expect(garageVehicles.some((v) => v.value === 136)).toBe(false);
  });
});
