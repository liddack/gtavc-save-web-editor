import {
  applyConeCrazyReset,
  coneCrazyResetPlan,
  CONE_RESET_ACTION,
  ConeError,
  type ConeProfile,
} from './coneCrazy.ts';
import { createFields } from './schema.ts';
import { weapons } from './catalogs.ts';
import type {
  Block,
  Changes,
  Field,
  Inspection,
  RetailDocument,
  ValidationError,
  Value,
} from './types.ts';
export const RETAIL_SIZE = 0x31464;
export const checksum = (bytes: Uint8Array): number => {
  let sum = 0;
  for (let i = 0; i < bytes.length - 4; i++) sum = (sum + bytes[i]) >>> 0;
  return sum;
};
const view = (b: Uint8Array) =>
  new DataView(b.buffer, b.byteOffset, b.byteLength);
const signature = (b: Uint8Array, p: number, s: string) =>
  [...s].every((c, i) => b[p + i] === c.charCodeAt(0));
function readName(bytes: Uint8Array) {
  const v = view(bytes);
  let result = '';
  for (let p = 4; p < Math.min(52, bytes.length - 1); p += 2) {
    const c = v.getUint16(p, true);
    if (!c) break;
    result += String.fromCharCode(c);
  }
  return result;
}
export function inspectSave(bytes: Uint8Array): Inspection {
  const out: Inspection = {
    valid: false,
    format: 'unsupported',
    name: readName(bytes),
    size: bytes.length,
    storedChecksum: 0,
    calculatedChecksum: 0,
    blocks: [],
    diagnostics: [],
  };
  if (bytes.length !== RETAIL_SIZE) {
    out.diagnostics.push('size');
    return out;
  }
  const v = view(bytes);
  out.storedChecksum = v.getUint32(bytes.length - 4, true);
  out.calculatedChecksum = checksum(bytes);
  if (out.storedChecksum !== out.calculatedChecksum)
    out.diagnostics.push('checksum');
  const retail = signature(bytes, 0xec, 'SCR\0');
  const steam = signature(bytes, 0xf0, 'SCR\0');
  out.format = retail ? 'retail' : steam ? 'steam' : 'unsupported';
  if (!retail) {
    out.diagnostics.push(steam ? 'steam' : 'format');
    return out;
  }
  let p = 0;
  for (let i = 0; i < 23; i++) {
    if (p + 4 > bytes.length - 4) {
      out.diagnostics.push('blocks');
      return out;
    }
    const size = v.getUint32(p, true);
    if (size < 4 || size > bytes.length - 4 - p - 4) {
      out.diagnostics.push('blocks');
      return out;
    }
    out.blocks.push({ index: i, header: p, data: p + 4, size });
    p += 4 + Math.ceil(size / 4) * 4;
  }
  const block = (i: number) => out.blocks[i];
  // Fixed structures used by the editor. Variable blocks are traversed, never relocated.
  const expected: [number, number][] = [
    [1, 1800],
    [2, 7880],
    [13, 228],
    [14, 8172],
    [18, 372],
    [19, 600],
  ];
  for (const [i, size] of expected) {
    const b = block(i);
    if (b.size !== size) out.diagnostics.push('layout');
    const inner = v.getUint32(b.data, true);
    if (Math.ceil((inner + 4) / 4) * 4 !== b.size)
      out.diagnostics.push('layout');
  }
  if (out.diagnostics.includes('layout')) return out;
  for (const [i, s] of [
    [13, 'GNG\0'],
    [14, 'CGN\0'],
    [10, 'RST\0'],
    [22, 'PTP\0'],
  ] as const) {
    const b = block(i);
    if (b.size < 8 || !signature(bytes, b.data + 4, s))
      out.diagnostics.push('layout');
  }
  const b0 = block(0),
    scriptLength = v.getUint32(0xe8, true),
    globals = v.getUint32(0xf4, true);
  if (
    b0.size < 0xf8 ||
    scriptLength > b0.size - 0xe8 ||
    globals % 4 !== 0 ||
    globals > scriptLength - 12 ||
    globals < 4
  )
    out.diagnostics.push('scripts');
  if (
    v.getUint32(block(1).data + 4, true) !== 1 ||
    v.getUint32(block(2).data + 4, true) > 32 ||
    v.getUint32(block(14).data + 4 + 0xc, true) > 185
  )
    out.diagnostics.push('layout');
  out.diagnostics = [...new Set(out.diagnostics)];
  out.valid = out.diagnostics.length === 0;
  return out;
}
export function parseRetailSave(bytes: Uint8Array): RetailDocument {
  const original = new Uint8Array(bytes);
  const inspection = inspectSave(original);
  if (!inspection.valid) throw new Error(inspection.diagnostics.join(', '));
  return {
    original,
    inspection,
    fields: createFields(original, inspection.blocks),
  };
}
export function readField(bytes: Uint8Array, f: Field): Value {
  const v = view(bytes),
    p = f.offset;
  switch (f.type) {
    case 'name':
      return readName(bytes);
    case 'u8':
      return v.getUint8(p);
    case 'u16':
      return v.getUint16(p, true);
    case 'i16':
      return v.getInt16(p, true);
    case 'u32':
      return v.getUint32(p, true);
    case 'i32':
      return v.getInt32(p, true);
    case 'f32':
      return v.getFloat32(p, true);
  }
}
export const currentValue = (
  doc: RetailDocument,
  f: Field,
  changes: Changes,
): Value =>
  Object.hasOwn(changes, f.id) ? changes[f.id] : readField(doc.original, f);
export function validateChanges(
  doc: RetailDocument,
  changes: Changes,
  profile?: ConeProfile,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const fields = new Map(doc.fields.map((f) => [f.id, f]));
  const get = (id: string) => {
    const f = fields.get(id);
    return f ? currentValue(doc, f, changes) : undefined;
  };
  if (Object.hasOwn(changes, CONE_RESET_ACTION)) {
    try {
      if (changes[CONE_RESET_ACTION] !== 1) throw new ConeError('resetValue');
      coneCrazyResetPlan(doc, profile);
      if ('stats.race19' in changes && changes['stats.race19'] !== 0)
        throw new ConeError('resetConflict');
    } catch (error) {
      errors.push({
        field: CONE_RESET_ACTION,
        code: error instanceof ConeError ? error.code : 'saveProfile',
      });
    }
  }
  for (const [id, value] of Object.entries(changes)) {
    if (id === CONE_RESET_ACTION) continue;
    const f = fields.get(id);
    if (!f || f.readOnly) {
      errors.push({ field: id, code: 'readonly' });
      continue;
    }
    if (Object.is(value, readField(doc.original, f))) continue;
    if (f.type === 'name') {
      if (
        typeof value !== 'string' ||
        !/^[\x20-\x7e]{1,23}$/.test(value) ||
        value.includes('~')
      )
        errors.push({ field: id, code: 'name' });
      continue;
    }
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      (f.type !== 'f32' && !Number.isInteger(value))
    ) {
      errors.push({ field: id, code: 'number' });
      continue;
    }
    if (
      (f.min !== undefined && value < f.min) ||
      (f.max !== undefined && value > f.max)
    )
      errors.push({ field: id, code: 'range' });
    if (f.options && !f.options.some((o) => o.value === value))
      errors.push({ field: id, code: 'option' });
  }
  for (const [a, b] of [
    ['player.health', 'player.maxHealth'],
    ['player.armor', 'player.maxArmor'],
  ]) {
    if (
      (Object.hasOwn(changes, a) || Object.hasOwn(changes, b)) &&
      Number(get(a)) > Number(get(b))
    )
      errors.push({ field: a, code: 'maximum' });
  }
  for (let i = 0; i < 10; i++) {
    const typeId = `weapon.${i}.type`,
      ammoId = `weapon.${i}.ammo`;
    if (!(Object.hasOwn(changes, typeId) || Object.hasOwn(changes, ammoId)))
      continue;
    const type = Number(get(typeId)),
      ammo = Number(get(ammoId));
    if (type !== 0 && weapons[type]?.[1] !== i)
      errors.push({ field: typeId, code: 'slot' });
    if (type === 0 && ammo !== 0)
      errors.push({ field: ammoId, code: 'emptyWeapon' });
  }
  if (
    Object.keys(changes).some(
      (id) => id.startsWith('weapon.2.') || id.startsWith('weapon.9.'),
    ) &&
    Number(get('weapon.2.type')) === 13 &&
    Number(get('weapon.9.type')) !== 34
  )
    errors.push({ field: 'weapon.2.type', code: 'detonator' });
  // A generator's delay pair must remain ordered when either value is edited.
  for (const f of doc.fields)
    if (f.id.endsWith('.minDelay')) {
      const max = f.id.replace('.minDelay', '.maxDelay');
      if (
        (f.id in changes || max in changes) &&
        Number(get(f.id)) > Number(get(max))
      )
        errors.push({ field: f.id, code: 'delay' });
    }
  return errors;
}
function write(v: DataView, f: Field, value: Value, offset = f.offset) {
  switch (f.type) {
    case 'name':
      for (let i = 0; i < 24; i++)
        v.setUint16(
          offset + i * 2,
          i < String(value).length ? String(value).charCodeAt(i) : 0,
          true,
        );
      break;
    case 'u8':
      v.setUint8(offset, Number(value));
      break;
    case 'u16':
      v.setUint16(offset, Number(value), true);
      break;
    case 'i16':
      v.setInt16(offset, Number(value), true);
      break;
    case 'u32':
      v.setUint32(offset, Number(value), true);
      break;
    case 'i32':
      v.setInt32(offset, Number(value), true);
      break;
    case 'f32':
      v.setFloat32(offset, Number(value), true);
      break;
  }
}
export function exportRetailSave(
  doc: RetailDocument,
  changes: Changes,
  profile?: ConeProfile,
): { bytes: Uint8Array; changedBytes: number } {
  // Re-derive the schema from the original, so callers cannot supply arbitrary write offsets.
  const trusted = parseRetailSave(doc.original);
  const errors = validateChanges(trusted, changes, profile);
  if (errors.length)
    throw new Error(errors.map((e) => `${e.field}: ${e.code}`).join('; '));
  const bytes = new Uint8Array(trusted.original),
    v = view(bytes);
  for (const f of trusted.fields)
    if (
      Object.hasOwn(changes, f.id) &&
      !Object.is(changes[f.id], readField(trusted.original, f))
    ) {
      write(v, f, changes[f.id]);
      for (const offset of f.mirrors ?? []) write(v, f, changes[f.id], offset);
    }
  for (let i = 0; i < 10; i++) {
    const type = trusted.fields.find((f) => f.id === `weapon.${i}.type`)!;
    const ammo = trusted.fields.find((f) => f.id === `weapon.${i}.ammo`)!;
    const typeChanged =
      type.id in changes &&
      changes[type.id] !== readField(trusted.original, type);
    const ammoChanged =
      ammo.id in changes &&
      changes[ammo.id] !== readField(trusted.original, ammo);
    if (!typeChanged && !ammoChanged) continue;
    const t = Number(currentValue(trusted, type, changes)),
      a = Number(currentValue(trusted, ammo, changes));
    const oldClip = v.getUint32(type.offset + 8, true);
    v.setUint32(type.offset + 4, a > 0 || i < 2 ? 0 : 3, true);
    v.setUint32(
      type.offset + 8,
      t === 0 ? 0 : Math.min(a, typeChanged ? 1 : oldClip),
      true,
    );
    if (typeChanged) v.setUint32(type.offset + 16, 0, true);
  }
  if (changes[CONE_RESET_ACTION] === 1)
    applyConeCrazyReset(bytes, trusted, profile);
  v.setUint32(bytes.length - 4, checksum(bytes), true);
  if (!inspectSave(bytes).valid)
    throw new Error('Export failed structural validation');
  const reopened = parseRetailSave(bytes);
  for (const f of reopened.fields)
    if (f.id in changes) {
      const expected =
        f.type === 'f32' ? Math.fround(Number(changes[f.id])) : changes[f.id];
      if (!Object.is(readField(bytes, f), expected))
        throw new Error(`Export failed readback: ${f.id}`);
    }
  let changedBytes = 0;
  for (let i = 0; i < bytes.length; i++)
    if (bytes[i] !== trusted.original[i]) changedBytes++;
  return { bytes, changedBytes };
}
export function blockData(blocks: Block[], index: number) {
  return blocks[index].data + 4;
}
