import { FORMAT, type FontDoc } from './types';
import { validate } from './validate';

/** A new font of 1000 units with the usual metrics, a space and nothing else yet. */
export function newFont(name: string, family: string, style = 'Regular'): FontDoc {
  const doc: FontDoc = {
    format: FORMAT,
    name,
    family,
    style,
    unitsPerEm: 1000,
    metrics: { ascender: 800, descender: -200, capHeight: 700, xHeight: 500 },
    glyphs: [{ name: 'space', unicode: 32, advance: 250, path: '' }],
    kerning: [],
  };
  validate(doc);
  return doc;
}
