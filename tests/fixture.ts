import { checksum, RETAIL_SIZE } from '../src/core/retail';
/** Synthetic structures, not a playable save; contains no game scripts or assets. */
export function syntheticSave(): Uint8Array {
  const b = new Uint8Array(RETAIL_SIZE),
    v = new DataView(b.buffer);
  const sizes = [
    43604, 1800, 7880, 264, 16, 28256, 2416, 1004, 17560, 2612, 296, 3612,
    35812, 228, 8172, 8588, 64, 160, 372, 600, 5384, 304, 748,
  ];
  const data: number[] = [];
  let p = 0;
  sizes.forEach((s, i) => {
    v.setUint32(p, s, true);
    data.push(p + 4);
    if (i) v.setUint32(p + 4, s - 4, true);
    p += 4 + Math.ceil(s / 4) * 4;
  });
  const sig = (p: number, s: string) =>
    [...s].forEach((c, i) => (b[p + i] = c.charCodeAt(0)));
  const name = 'Synthetic workshop';
  [...name].forEach((c, i) => v.setUint16(4 + 2 * i, c.charCodeAt(0), true));
  v.setUint32(0x44, 0x31401, true);
  v.setUint32(0x58, 1000, true);
  sig(0xec, 'SCR\0');
  v.setUint32(0xe8, sizes[0] - 0xe8, true);
  v.setUint32(0xf0, sizes[0] - 0xf0, true);
  v.setUint32(0xf4, 34336, true);
  v.setUint32(data[1], 1795, true);
  v.setUint32(data[1] + 4, 1, true);
  const ped = data[1] + 18;
  v.setFloat32(ped + 0x354, 100, true);
  v.setFloat32(ped + 0x358, 50, true);
  v.setUint32(ped + 0x408 + 5 * 24, 25, true);
  v.setUint32(ped + 0x408 + 5 * 24 + 8, 30, true);
  v.setUint32(ped + 0x408 + 5 * 24 + 12, 120, true);
  const pi = data[18] + 4;
  v.setUint32(pi, 27000, true);
  v.setUint32(pi + 0xf, 27000, true);
  b[pi + 0x1e] = 100;
  b[pi + 0x1f] = 100;
  v.setUint32(data[2] + 4, 32, true);
  const car = data[2] + 4 + 0x2c + 6 * 40;
  v.setUint32(car, 145, true);
  v.setFloat32(car + 4, -988, true);
  v.setFloat32(car + 8, -816, true);
  v.setFloat32(car + 12, 7, true);
  sig(data[10] + 4, 'RST\0');
  sig(data[13] + 4, 'GNG\0');
  sig(data[14] + 4, 'CGN\0');
  sig(data[22] + 4, 'PTP\0');
  for (let i = 0; i < 9; i++) {
    const g = data[13] + 4 + 8 + 24 * i;
    v.setUint32(g, 164, true);
    v.setUint32(g + 4, 83, true);
    v.setUint32(g + 8, 84, true);
  }
  v.setUint32(data[14] + 4 + 0xc, 2, true);
  v.setUint32(data[14] + 4 + 0x10, 2, true);
  for (let i = 0; i < 2; i++) {
    const g = data[14] + 4 + 0x1c + i * 44;
    v.setUint32(g, 211, true);
    v.setUint16(g + 0x1c, 1000, true);
    v.setUint16(g + 0x1e, 2000, true);
    v.setInt16(g + 0x28, -1, true);
  }
  v.setUint32(data[19], 595, true);
  v.setFloat32(data[19] + 4 + 0x78, 10, true);
  v.setFloat32(data[19] + 4 + 0x7c, 150, true);
  // Opaque padding sentinel: an editor must preserve this even after editing.
  for (let i = p; i < b.length - 4; i++) b[i] = (i * 17 + 31) % 256;
  v.setUint32(b.length - 4, checksum(b), true);
  return b;
}
