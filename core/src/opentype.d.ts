// The part of opentype.js (MIT) that core uses. The package ships no types.
declare module 'opentype.js' {
  export interface PathCommand {
    type: 'M' | 'L' | 'Q' | 'C' | 'Z';
    x?: number;
    y?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  }

  export class Path {
    commands: PathCommand[];
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    quadraticCurveTo(x1: number, y1: number, x: number, y: number): void;
    bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void;
    close(): void;
  }

  export class Glyph {
    constructor(options: { name: string; unicode?: number; unicodes?: number[]; advanceWidth: number; path: Path });
    name: string | null;
    unicode?: number;
    unicodes: number[];
    advanceWidth?: number;
    path: Path;
  }

  export class Font {
    constructor(options: {
      familyName: string;
      styleName: string;
      unitsPerEm: number;
      ascender: number;
      descender: number;
      glyphs: Glyph[];
      tables?: { os2?: Record<string, number> };
    });
    unitsPerEm: number;
    ascender: number;
    descender: number;
    numGlyphs: number;
    glyphs: { get(index: number): Glyph; length: number };
    kerningPairs?: Record<string, number>;
    tables: { os2?: { sxHeight?: number; sCapHeight?: number } };
    getEnglishName(name: 'fontFamily' | 'fontSubfamily'): string | undefined;
    toArrayBuffer(): ArrayBuffer;
  }

  export function parse(buffer: ArrayBuffer): Font;

  const opentype: { Font: typeof Font; Glyph: typeof Glyph; Path: typeof Path; parse: typeof parse };
  export default opentype;
}
