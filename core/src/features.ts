import { isArabic, type Form } from './arabic';
import { isConsonant, isDevanagari, VIRAMA_NAME } from './indic';
import type { FontDoc, Glyph } from './types';

/**
 * One substitution of the font's OpenType features: the glyphs `sub`, in a row, become `by`. A feature of one glyph
 * (`init`, `ss01`) has one glyph in `sub`; a ligature has several.
 */
export interface Rule {
  feature: string;
  script: ScriptTag;
  sub: string[];
  by: string;
}

/** The features a glyph name suffix asks for: `a.ss01` is `a` in the stylistic set 1. */
const SUFFIX_FEATURES: Record<string, string> = { alt: 'salt', sc: 'smcp', onum: 'onum', tnum: 'tnum', sups: 'sups', sinf: 'sinf' };
/** The features applied without the user asking: the joining forms, ligatures and required ligatures. */
export const DEFAULT_FEATURES = ['akhn', 'rphf', 'blwf', 'half', 'init', 'medi', 'fina', 'isol', 'rlig', 'liga'];
/** The features a user turns on: stylistic sets and alternates. Shown in the app when the font has them. */
export const OPTIONAL_FEATURE = /^(ss(0[1-9]|1\d|20)|salt|smcp|onum|tnum|sups|sinf|dlig)$/;

const FORMS = new Set<string>(['init', 'medi', 'fina', 'isol']);

/** The script tag of the rules of a glyph: Arabic and Devanagari have their own, every other script shares DFLT. */
export type ScriptTag = 'DFLT' | 'arab' | 'dev2';

/** The code point a glyph stands for: its own, else that of the glyph its name starts with (uni0628.init). */
function rootCode(glyph: Glyph | undefined, byName: Map<string, Glyph>): number | undefined {
  if (!glyph) return undefined;
  return glyph.unicode ?? byName.get(glyph.name.split(/[._]/)[0]!)?.unicode;
}

function scriptOf(glyph: Glyph | undefined, byName: Map<string, Glyph>): ScriptTag {
  const code = rootCode(glyph, byName);
  if (code === undefined) return 'DFLT';
  return isArabic(code) ? 'arab' : isDevanagari(code) ? 'dev2' : 'DFLT';
}

/** The forms of the parts of an Arabic ligature, from the form of the whole: lam_alef.fina is lam.medi alef.fina. */
function partForms(count: number, whole: string): Form[] {
  const first: Form = whole === 'fina' || whole === 'medi' ? 'medi' : 'init';
  const last: Form = whole === 'init' || whole === 'medi' ? 'medi' : 'fina';
  return Array.from({ length: count }, (_, i): Form => (i === 0 ? first : i === count - 1 ? last : 'medi'));
}


/** A ligature by its name: `f_i` → liga of f i; `uni0644_uni0627.fina` → rlig of the lam and alef forms. */
function ligature(glyph: Glyph, byName: Map<string, Glyph>): Rule | undefined {
  const [stem, ...suffixes] = glyph.name.split('.');
  const parts = stem!.split('_');
  if (parts.length < 2 || !parts.every((part) => byName.has(part))) return undefined;
  const suffix = suffixes.join('.');
  const scripts = new Set(parts.map((part) => scriptOf(byName.get(part), byName)));
  // A Devanagari conjunct: its letters and their viramas, as typed (क्ष = ka virama ssa).
  if (scripts.size === 1 && scripts.has('dev2')) return suffix === '' ? { feature: 'akhn', script: 'dev2', sub: parts, by: glyph.name } : undefined;
  if (scripts.size === 1 && scripts.has('arab')) {
    if (suffix !== '' && !FORMS.has(suffix)) return undefined;
    const sub = parts.map((part, i) => `${part}.${partForms(parts.length, suffix || 'isol')[i]}`).map((name, i) => (byName.has(name) ? name : parts[i]!));
    return { feature: 'rlig', script: 'arab', sub, by: glyph.name };
  }
  if (suffix === '') return { feature: 'liga', script: 'DFLT', sub: parts, by: glyph.name };
  if (suffix === 'dlig') return { feature: 'dlig', script: 'DFLT', sub: parts, by: glyph.name };
  return undefined;
}

/** A single substitution by the last suffix of a name: `uni0628.init`, `a.ss01`, `g.alt`. */
function single(glyph: Glyph, byName: Map<string, Glyph>): Rule | undefined {
  const at = glyph.name.lastIndexOf('.');
  if (at <= 0) return undefined;
  const from = glyph.name.slice(0, at);
  const suffix = glyph.name.slice(at + 1);
  const source = byName.get(from);
  if (!source || from.includes('_')) return undefined;
  const script = scriptOf(source, byName);
  if (FORMS.has(suffix)) return script === 'arab' ? { feature: suffix, script, sub: [from], by: glyph.name } : undefined;
  const indic = indicRule(source, suffix, glyph.name);
  if (indic) return indic;
  const feature = /^ss(0[1-9]|1\d|20)$/.test(suffix) ? suffix : SUFFIX_FEATURES[suffix];
  return feature ? { feature, script, sub: [from], by: glyph.name } : undefined;
}

/**
 * The forms of a Devanagari consonant: `.half` (before another consonant, the virama gone), `.rphf` (ra on top of the
 * next consonant: the reph), `.blwf` (ra under the consonant before it).
 */
function indicRule(source: Glyph, suffix: string, by: string): Rule | undefined {
  const code = source.unicode;
  if (code === undefined || !isConsonant(code)) return undefined;
  if (suffix === 'half') return { feature: 'half', script: 'dev2', sub: [source.name, VIRAMA_NAME], by };
  if (suffix === 'rphf' && code === 0x930) return { feature: 'rphf', script: 'dev2', sub: [source.name, VIRAMA_NAME], by };
  if (suffix === 'blwf' && code === 0x930) return { feature: 'blwf', script: 'dev2', sub: [VIRAMA_NAME, source.name], by };
  return undefined;
}

/**
 * Every substitution the glyph names of a font ask for. The forms of a joining Arabic letter (`.init` `.medi`
 * `.fina` `.isol`), ligatures named by their parts joined by `_`, and alternates by suffix (`.ss01`–`.ss20`, `.alt`,
 * `.sc`, `.onum`, `.tnum`, `.sups`, `.sinf`). Marks drawn for capitals (`.case`) are not features: compose uses them.
 */
export function featureRules(doc: FontDoc): Rule[] {
  const byName = new Map(doc.glyphs.map((glyph) => [glyph.name, glyph]));
  return doc.glyphs.flatMap((glyph) => {
    const rule = ligature(glyph, byName) ?? single(glyph, byName);
    return rule ? [rule] : [];
  });
}

/** The optional features a font has, for the app to offer: ss01, salt, smcp… */
export function optionalFeatures(doc: FontDoc): string[] {
  return [...new Set(featureRules(doc).map((rule) => rule.feature).filter((feature) => OPTIONAL_FEATURE.test(feature)))].sort();
}
