import { expect, it } from 'vitest';
import {
  parseRetailSave,
  exportRetailSave,
  readField,
} from '../src/core/retail';
import {
  propertyNames,
  gangNames,
  raceNames,
  pedestrianTypes,
} from '../src/core/statCatalogs';
import { syntheticSave } from './fixture';
it('names every race, property and pedestrian type using the verified index order', () => {
  const doc = parseRetailSave(syntheticSave());
  expect(raceNames).toHaveLength(23);
  expect(propertyNames).toHaveLength(15);
  expect(gangNames).toHaveLength(9);
  expect(doc.fields.find((f) => f.id === 'gang.0.car')!.group[0]).toBe(
    'Cubans',
  );
  expect(
    doc.fields
      .find((f) => f.id === 'gang.0.preference')!
      .options!.map((o) => o.value),
  ).toEqual([255, 0]);
  expect(pedestrianTypes).toHaveLength(23);
  for (let i = 0; i < 23; i++) {
    const f = doc.fields.find((f) => f.id === `stats.race${i}`)!;
    expect(f.label[0]).not.toContain('Stats record');
    expect(f.label[1]).not.toContain('Recorde estatístico');
  }
  expect(doc.fields.find((f) => f.id === 'stats.race0')!.label[0]).toContain(
    'Alloy Wheels',
  );
  expect(doc.fields.find((f) => f.id === 'stats.race21')!.label[0]).toContain(
    'milliseconds',
  );
  expect(doc.fields.find((f) => f.id === 'progress.property0')!.label[0]).toBe(
    'Malibu Club',
  );
  expect(
    doc.fields.find((f) => f.id === 'stats.pedKills13')!.label[0],
  ).toContain('Vercetti');
});
it('writes real fractional distances, spending and media values as float32 without changing adjacent fields', () => {
  const bytes = syntheticSave(),
    doc = parseRetailSave(bytes);
  for (const id of [
    'stats.wheelieDistance',
    'stats.stoppieDistance',
    'stats.twoWheelDistance',
    'stats.propertyBudget',
    'stats.repairBudget',
    'stats.media',
  ]) {
    const f = doc.fields.find((f) => f.id === id)!;
    expect(f.type).toBe('f32');
    const result = exportRetailSave(doc, { [id]: 123.75 });
    expect(readField(result.bytes, f)).toBe(123.75);
    const allowed = new Set([
      ...Array.from({ length: 4 }, (_, i) => f.offset + i),
      ...Array.from({ length: 4 }, (_, i) => bytes.length - 4 + i),
    ]);
    expect(
      [...bytes.keys()].every(
        (i) => result.bytes[i] === bytes[i] || allowed.has(i),
      ),
    ).toBe(true);
  }
  expect(exportRetailSave(doc, {}).bytes).toEqual(bytes);
});
