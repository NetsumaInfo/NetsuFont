// Bytes of OpenType layout tables (GPOS, GDEF): big-endian numbers, offsets to children, coverage tables.

/** Big-endian bytes, written in order. */
export class Out {
  private bytes: number[] = [];
  u32(value: number): this {
    return this.u16(Math.floor(value / 0x10000)).u16(value % 0x10000);
  }
  u16(value: number): this {
    this.bytes.push((value >> 8) & 0xff, value & 0xff);
    return this;
  }
  i16(value: number): this {
    return this.u16(value < 0 ? value + 0x10000 : value);
  }
  tag(value: string): this {
    for (const char of value.padEnd(4)) this.bytes.push(char.charCodeAt(0));
    return this;
  }
  add(data: Uint8Array): this {
    // A loop, not push(...data): a subtable of thousands of glyphs passes the limit of a call's arguments.
    for (const byte of data) this.bytes.push(byte);
    return this;
  }
  get size(): number {
    return this.bytes.length;
  }
  done(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

/** A table that points at its children: the header, then each child, offsets counted from the start. */
export function withChildren(head: (offsets: number[]) => Out, children: Uint8Array[]): Uint8Array {
  const size = head(children.map(() => 0)).size;
  const offsets: number[] = [];
  let at = size;
  for (const child of children) {
    offsets.push(at);
    at += child.length;
  }
  if (at > 0xffff) throw new Error('An OpenType subtable is too large: split it.');
  const out = head(offsets);
  children.forEach((child) => out.add(child));
  return out.done();
}

export const coverage = (glyphs: number[]): Uint8Array => {
  const out = new Out().u16(1).u16(glyphs.length);
  glyphs.forEach((glyph) => out.u16(glyph));
  return out.done();
};
