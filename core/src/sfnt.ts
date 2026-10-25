// Adds a table to a font file that opentype.js wrote: it writes neither `kern` nor GPOS kerning.

function checksum(bytes: Uint8Array): number {
  const padded = new Uint8Array(Math.ceil(bytes.length / 4) * 4);
  padded.set(bytes);
  const view = new DataView(padded.buffer);
  let sum = 0;
  for (let offset = 0; offset < padded.length; offset += 4) sum = (sum + view.getUint32(offset)) >>> 0;
  return sum;
}

interface Table {
  tag: string;
  data: Uint8Array;
}

function readTables(font: Uint8Array): { flavor: number; tables: Table[] } {
  const view = new DataView(font.buffer, font.byteOffset, font.byteLength);
  const count = view.getUint16(4);
  const tables: Table[] = [];
  for (let index = 0; index < count; index += 1) {
    const at = 12 + index * 16;
    const tag = String.fromCharCode(...font.subarray(at, at + 4));
    const offset = view.getUint32(at + 8);
    const length = view.getUint32(at + 12);
    tables.push({ tag, data: font.slice(offset, offset + length) });
  }
  return { flavor: view.getUint32(0), tables };
}

function writeTables(flavor: number, tables: Table[]): Uint8Array {
  const sorted = [...tables].sort((a, b) => (a.tag < b.tag ? -1 : 1));
  const head = 12 + sorted.length * 16;
  const size = sorted.reduce((total, table) => total + Math.ceil(table.data.length / 4) * 4, head);
  const out = new Uint8Array(size);
  const view = new DataView(out.buffer);
  const power = 2 ** Math.floor(Math.log2(sorted.length));
  view.setUint32(0, flavor);
  view.setUint16(4, sorted.length);
  view.setUint16(6, power * 16);
  view.setUint16(8, Math.log2(power));
  view.setUint16(10, sorted.length * 16 - power * 16);
  let offset = head;
  let headAt = -1;
  sorted.forEach((table, index) => {
    const at = 12 + index * 16;
    for (let char = 0; char < 4; char += 1) out[at + char] = table.tag.charCodeAt(char);
    if (table.tag === 'head') {
      headAt = offset;
      // The adjustment is counted as 0 in the checksum of head.
      table.data.fill(0, 8, 12);
    }
    view.setUint32(at + 4, checksum(table.data));
    view.setUint32(at + 8, offset);
    view.setUint32(at + 12, table.data.length);
    out.set(table.data, offset);
    offset += Math.ceil(table.data.length / 4) * 4;
  });
  if (headAt >= 0) view.setUint32(headAt + 8, (0xb1b0afba - checksum(out)) >>> 0);
  return out;
}

/** The font file with `tag` set to `data`, replacing a table of that name if there was one. */
export function withTable(font: Uint8Array, tag: string, data: Uint8Array): Uint8Array {
  const { flavor, tables } = readTables(font);
  return writeTables(flavor, [...tables.filter((table) => table.tag !== tag), { tag, data }]);
}

/** A `kern` table, format 0: pairs of glyph indices and their value, sorted as the format asks. */
export function kernTable(pairs: { left: number; right: number; value: number }[]): Uint8Array {
  const sorted = [...pairs].sort((a, b) => a.left - b.left || a.right - b.right);
  const length = 14 + sorted.length * 6;
  const out = new Uint8Array(4 + length);
  const view = new DataView(out.buffer);
  const power = sorted.length === 0 ? 0 : 2 ** Math.floor(Math.log2(sorted.length));
  view.setUint16(0, 0);
  view.setUint16(2, 1);
  view.setUint16(4, 0);
  view.setUint16(6, length);
  // Horizontal kerning, format 0.
  view.setUint16(8, 0x0001);
  view.setUint16(10, sorted.length);
  view.setUint16(12, power * 6);
  view.setUint16(14, power === 0 ? 0 : Math.log2(power));
  view.setUint16(16, sorted.length * 6 - power * 6);
  sorted.forEach((pair, index) => {
    view.setUint16(18 + index * 6, pair.left);
    view.setUint16(20 + index * 6, pair.right);
    view.setInt16(22 + index * 6, pair.value);
  });
  return out;
}
