// An imported font keeps its forms and ligatures by giving their glyphs the names NetsuFont reads features from: the
// initial beh becomes `uni0628.init`, a Devanagari half ka `uni0915.half`, the conjunct ksha
// `uni0915_uni094D_uni0937`. Export then writes the same features back, and a model shows its forms by name.
import { glyphName } from './names';
import type { Glyph } from './types';

interface Coverage {
  format: number;
  glyphs?: number[];
  ranges?: { start: number; end: number }[];
}

interface Subtable {
  substFormat?: number;
  lookupType?: number;
  extension?: Subtable;
  coverage?: Coverage;
  deltaGlyphId?: number;
  substitute?: number[];
  ligatureSets?: { ligGlyph: number; components: number[] }[][];
}

/** The part of a parsed GSUB table this reads. */
export interface ParsedGsub {
  scripts: { tag: string; script: { defaultLangSys?: { featureIndexes: number[] } } }[];
  features: { tag: string; feature: { lookupListIndexes: number[] } }[];
  lookups: { lookupType: number; subtables: Subtable[] }[];
}

const covered = (coverage: Coverage | undefined): number[] =>
  coverage?.format === 1 ? (coverage.glyphs ?? []) : (coverage?.ranges ?? []).flatMap((r) => Array.from({ length: r.end - r.start + 1 }, (_, i) => r.start + i));

/** Each substitution of one feature, as glyph indices: one glyph or a row of them, and what replaces them. */
function rulesOf(gsub: ParsedGsub, tag: string, scripts: string[]): { sub: number[]; by: number }[] {
  const indexes = gsub.scripts.filter((s) => scripts.includes(s.tag)).flatMap((s) => s.script.defaultLangSys?.featureIndexes ?? []);
  const lookups = indexes.filter((i) => gsub.features[i]?.tag === tag).flatMap((i) => gsub.features[i]!.feature.lookupListIndexes);
  return [...new Set(lookups)].flatMap((at) => {
    const lookup = gsub.lookups[at]!;
    return lookup.subtables.flatMap((raw) => {
      const type = lookup.lookupType === 7 ? raw.lookupType : lookup.lookupType;
      const table = lookup.lookupType === 7 ? raw.extension! : raw;
      const glyphs = covered(table.coverage);
      if (type === 1) return glyphs.map((glyph, i) => ({ sub: [glyph], by: table.substFormat === 1 ? glyph + (table.deltaGlyphId ?? 0) : table.substitute![i]! }));
      if (type === 4) return glyphs.flatMap((glyph, i) => (table.ligatureSets?.[i] ?? []).map((lig) => ({ sub: [glyph, ...lig.components], by: lig.ligGlyph })));
      return [];
    });
  });
}

const DEVANAGARI = ['dev2', 'deva'];
const VIRAMA = 'uni094D';

/**
 * Renames the glyphs a feature makes, when they have no code point and their new name is free: Arabic forms, the
 * Devanagari half forms, reph, ra below and conjuncts, and ligatures. Returns how many were renamed.
 */
export function nameFeatureGlyphs(gsub: ParsedGsub | undefined, glyphs: Glyph[]): number {
  if (!gsub) return 0;
  const taken = new Set(glyphs.map((g) => g.name));
  let renamed = 0;
  const rename = (index: number, name: string): void => {
    const glyph = glyphs[index];
    if (!glyph || glyph.unicode !== undefined || taken.has(name)) return;
    taken.delete(glyph.name);
    glyph.name = name;
    taken.add(name);
    renamed += 1;
  };
  const nameOf = (index: number): string => glyphs[index]?.name ?? '';
  // The letters first take the names the rules below expect: a font's own "kaDeva" becomes uni0915.
  glyphs.forEach((glyph) => {
    if (glyph.unicode === undefined) return;
    const usual = glyphName(String.fromCodePoint(glyph.unicode));
    if (usual !== glyph.name && !taken.has(usual)) {
      taken.delete(glyph.name);
      glyph.name = usual;
      taken.add(usual);
    }
  });
  for (const form of ['init', 'medi', 'fina', 'isol']) for (const rule of rulesOf(gsub, form, ['arab'])) rename(rule.by, `${nameOf(rule.sub[0]!)}.${form}`);
  for (const rule of rulesOf(gsub, 'half', DEVANAGARI)) if (nameOf(rule.sub[1]!) === VIRAMA) rename(rule.by, `${nameOf(rule.sub[0]!)}.half`);
  for (const rule of rulesOf(gsub, 'rphf', DEVANAGARI)) if (nameOf(rule.sub[0]!) === 'uni0930') rename(rule.by, 'uni0930.rphf');
  for (const rule of rulesOf(gsub, 'blwf', DEVANAGARI)) if (nameOf(rule.sub[1]!) === 'uni0930') rename(rule.by, 'uni0930.blwf');
  for (const [tag, scripts] of [['akhn', DEVANAGARI], ['rlig', ['arab']], ['liga', ['latn', 'DFLT']]] as const) {
    for (const rule of rulesOf(gsub, tag, [...scripts])) rename(rule.by, rule.sub.map(nameOf).join('_'));
  }
  return renamed;
}
