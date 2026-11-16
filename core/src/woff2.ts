// WOFF2, the font file of the web: the tables of an OTF in one Brotli stream. A CFF font needs no transform; glyf and
// loca (TrueType outlines) would, and NetsuFont does not write them. Brotli is passed in: core has no Node API.
import { readTables } from './sfnt';

/** The tags WOFF2 writes as one byte, by their index. */
const KNOWN = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT',
  'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH',
  'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar',
  'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill',
];

/** A number as UIntBase128: seven bits a byte, the first bytes marked by their high bit. */
export function base128(value: number): number[] {
  const bytes = [value % 128];
  for (let rest = Math.floor(value / 128); rest > 0; rest = Math.floor(rest / 128)) bytes.unshift((rest % 128) | 128);
  return bytes;
}

const pad4 = (size: number): number => Math.ceil(size / 4) * 4;

/** The OTF as WOFF2. `brotli` compresses bytes, such as `zlib.brotliCompressSync` of Node. */
export function toWoff2(otf: Uint8Array, brotli: (data: Uint8Array) => Uint8Array): Uint8Array {
  const { flavor, tables } = readTables(otf);
  if (tables.some((table) => table.tag === 'glyf')) throw new Error('A TrueType font needs the glyf transform: not written.');
  const directory: number[] = [];
  for (const table of tables) {
    const known = KNOWN.indexOf(table.tag);
    directory.push(known >= 0 ? known : 63);
    if (known < 0) for (const char of table.tag) directory.push(char.charCodeAt(0));
    directory.push(...base128(table.data.length));
  }
  const stream = new Uint8Array(tables.reduce((size, table) => size + table.data.length, 0));
  let at = 0;
  for (const table of tables) {
    stream.set(table.data, at);
    at += table.data.length;
  }
  const compressed = brotli(stream);
  const sfntSize = tables.reduce((size, table) => size + pad4(table.data.length), 12 + tables.length * 16);
  const length = pad4(48 + directory.length + compressed.length);
  const out = new Uint8Array(length);
  const view = new DataView(out.buffer);
  view.setUint32(0, 0x774f4632); // wOF2
  view.setUint32(4, flavor);
  view.setUint32(8, length);
  view.setUint16(12, tables.length);
  view.setUint32(16, sfntSize);
  view.setUint32(20, compressed.length);
  view.setUint16(24, 1);
  out.set(directory, 48);
  out.set(compressed, 48 + directory.length);
  return out;
}
