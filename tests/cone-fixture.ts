import { checksum, parseRetailSave } from '../src/core/retail';
import { syntheticSave } from './fixture';
// Structural fixtures contain no game code. Crypto is mocked only in tests that exercise an issued capability.
export function syntheticGameData() {
  const bytes = new Uint8Array(1225938),
    v = new DataView(bytes.buffer);
  bytes.set([2, 0, 1, 0x20, 0x86, 0, 0, 0x6d]);
  v.setUint32(0x8623, 0x994c, true);
  v.setUint32(0x994f, 0x9ae4, true);
  v.setUint32(0x9954, 204596, true);
  v.setUint16(0x995c, 97, true);
  v.setUint32(0x994c + 20 + 91 * 4, 1220970, true);
  v.setUint32(0x994c + 20 + 92 * 4, 1225938, true);
  bytes.set([4, 0, 2, 0x80, 5, 4, 120], 0x10131);
  return bytes;
}
export function coneSave() {
  const bytes = syntheticSave(),
    v = new DataView(bytes.buffer),
    doc = parseRetailSave(bytes),
    end = 0xf8 + 34336,
    count = end + 4 + 0x248;
  v.setUint32(end, 0x248, true);
  v.setUint32(count - 12, 204596, true);
  v.setUint32(count - 8, 32408, true);
  v.setUint16(count - 4, 97, true);
  v.setUint32(count, 0, true);
  for (const [index, value] of [
    [350, 1],
    [351, 1],
    [352, 42],
    [1615, 10000],
    [7925, 10],
    [7926, 400],
  ])
    v.setInt32(0xf8 + index * 4, value, true);
  v.setInt32(doc.fields.find((f) => f.id === 'stats.race19')!.offset, 42, true);
  v.setFloat32(
    doc.fields.find((f) => f.id === 'progress.current')!.offset,
    63,
    true,
  );
  v.setUint32(bytes.length - 4, checksum(bytes), true);
  return bytes;
}
