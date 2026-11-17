// An imported font keeps its forms and ligatures by giving their glyphs the names NetsuFont reads features from: the
// initial beh becomes `uni0628.init`, a Devanagari half ka `uni0915.half`, a Bengali ya-phala `uni09AF.pstf`, the conjunct ksha
// `uni0915_uni094D_uni0937`. Export then writes the same features back, and a model shows its forms by name.
import { INDIC, indicOf, viramaName } from './indic';
import { INDIC_CHARS, indicForms } from './indicLanguages';
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

const INDIC_TAGS = INDIC.flatMap((script) => script.tags);
const VIRAMAS = new Set(INDIC.map(viramaName));
/** The Indic forms languages count: a glyph two rules make (ஸ்ரீ and ஶ்ரீ) takes the one of these first. */
const WANTED = new Set(Object.keys(INDIC_CHARS).flatMap(indicForms));
const RAS = new Set(INDIC.flatMap((script) => script.ras.map((ra) => glyphName(String.fromCodePoint(ra)))));

/**
 * A glyph as the letters typed for it, joined by _: an Indic form is its letter and the virama (`uni0995.half` is
 * `uni0995_uni09CD`, `uni09B0.blwf` is `uni09CD_uni09B0`). Undefined for a glyph without a name of its own (glyph42).
 */
function spelling(glyphs: Glyph[]): (name: string) => string | undefined {
  const codes = new Map(glyphs.flatMap((glyph) => (glyph.unicode === undefined ? [] : [[glyph.name, glyph.unicode] as const])));
  return (name) => {
    if (/^glyph\d+/.test(name)) return undefined;
    const [base, form] = name.split('.');
    const script = indicOf(codes.get(base!) ?? -1);
    if (!script || form === undefined) return name;
    const virama = viramaName(script);
    if (form === 'half' || form === 'rphf') return `${base}_${virama}`;
    return form === 'blwf' || form === 'pstf' ? `${virama}_${base}` : name;
  };
}

/**
 * Renames the glyphs a feature makes, when they have no code point and their new name is free: Arabic forms, the
 * Indic half forms, reph, forms below and after, conjuncts, and ligatures. Returns how many were renamed.
 */
export function nameFeatureGlyphs(gsub: ParsedGsub | undefined, glyphs: Glyph[]): number {
  if (!gsub) return 0;
  const taken = new Set(glyphs.map((g) => g.name));
  const done = new Set<number>();
  // A glyph made by two rules (the reph of ra and of the Assamese ra) keeps the first name it gets, unless the second
  // is a form a language counts and the first is not.
  const rename = (index: number, name: string): void => {
    const glyph = glyphs[index];
    if (!glyph || glyph.unicode !== undefined || taken.has(name)) return;
    if (done.has(index) && (WANTED.has(glyph.name) || !WANTED.has(name))) return;
    done.add(index);
    taken.delete(glyph.name);
    glyph.name = name;
    taken.add(name);
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
  for (const rule of rulesOf(gsub, 'half', INDIC_TAGS)) if (VIRAMAS.has(nameOf(rule.sub[1]!))) rename(rule.by, `${nameOf(rule.sub[0]!)}.half`);
  for (const rule of rulesOf(gsub, 'rphf', INDIC_TAGS)) if (RAS.has(nameOf(rule.sub[0]!))) rename(rule.by, `${nameOf(rule.sub[0]!)}.rphf`);
  for (const form of ['blwf', 'pstf']) {
    for (const rule of rulesOf(gsub, form, INDIC_TAGS)) if (rule.sub.length === 2 && VIRAMAS.has(nameOf(rule.sub[0]!))) rename(rule.by, `${nameOf(rule.sub[1]!)}.${form}`);
  }
  const spell = spelling(glyphs);
  // Conjuncts and letters with their vowel, wherever the font makes them: a Bengali ক্ত is ka.half and ta (pres).
  const ligatures: [string, readonly string[]][] = [...['akhn', 'cjct', 'pres', 'psts', 'blws', 'abvs'].map((tag): [string, readonly string[]] => [tag, INDIC_TAGS]), ['rlig', ['arab']], ['liga', ['latn', 'DFLT']]];
  for (const [tag, scripts] of ligatures) {
    for (const rule of rulesOf(gsub, tag, [...scripts])) {
      const parts = rule.sub.map((index) => spell(nameOf(index)));
      if (parts.every((part) => part !== undefined)) rename(rule.by, parts.join('_'));
    }
  }
  return done.size;
}
