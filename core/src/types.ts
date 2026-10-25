/** The version of the document format. A file of another version is refused, not guessed. */
export const FORMAT = 1;

/**
 * A font: its names, its vertical metrics, its glyphs and its kerning. Every coordinate is in font units,
 * y going up from the baseline, as in the font file itself.
 */
export interface FontDoc {
  format: typeof FORMAT;
  /** The id of the font: the name of its file. Lowercase letters, digits and dashes. */
  name: string;
  /** The family name a font menu shows, such as "Netsu Pixel". */
  family: string;
  /** The style inside the family, such as "Regular" or "Bold". */
  style: string;
  /** The size of the em square. 1000 for a font drawn here; an imported font keeps its own. */
  unitsPerEm: number;
  metrics: Metrics;
  glyphs: Glyph[];
  kerning: Kern[];
}

/** The horizontal lines every glyph is drawn against. The descender is below the baseline: negative. */
export interface Metrics {
  ascender: number;
  descender: number;
  capHeight: number;
  xHeight: number;
}

export interface Glyph {
  /** The id of the glyph, as in a font: "A", "a", "zero", "eacute", "A.alt". */
  name: string;
  /** The character it draws, as a code point. A glyph without one is reached only as a component. */
  unicode?: number;
  /** How far the pen moves after the glyph: its width with both side bearings. */
  advance: number;
  /** The outline, as SVG path data in font units, y up. Commands M L H V Q C Z, absolute or relative. */
  path: string;
  /** Other glyphs drawn inside this one, moved: the e and the acute of an eacute. */
  components?: Part[];
}

export interface Part {
  glyph: string;
  x: number;
  y: number;
}

/** A change of the space between two glyphs, in font units: negative brings them closer. */
export interface Kern {
  left: string;
  right: string;
  value: number;
}

/** A refusal the agent can act on: a code and a sentence that says what to change. */
export class FontError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'FontError';
  }
}
