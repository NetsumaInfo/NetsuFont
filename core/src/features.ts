import { isArabic, type Form } from './arabic';
import { indicOf, isConsonant, isVowelSign, viramaName } from './indic';
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
  /** The OpenType languages the rule is for; every language when left out. */
  languages?: string[];
}

/**
 * The glyphs a language swaps in (feature locl), by suffix: `uniFF0C.zht` is the full-width comma of traditional
 * Chinese (centred), used when the text is marked zh-Hant or zh-HK.
 */
const LOCAL: Record<string, { script: ScriptTag; languages: string[] }> = { zht: { script: 'hani', languages: ['ZHT ', 'ZHH '] } };

/** The features a glyph name suffix asks for: `a.ss01` is `a` in the stylistic set 1. */
const SUFFIX_FEATURES: Record<string, string> = { alt: 'salt', sc: 'smcp', onum: 'onum', tnum: 'tnum', sups: 'sups', sinf: 'sinf', vert: 'vert' };
/** The features applied without the user asking: the joining forms, ligatures and required ligatures. */
export const DEFAULT_FEATURES = ['ccmp', 'akhn', 'rphf', 'pref', 'blwf', 'half', 'pstf', 'psts', 'init', 'medi', 'fina', 'isol', 'rlig', 'liga'];
/** The features a user turns on: stylistic sets and alternates. Shown in the app when the font has them. */
export const OPTIONAL_FEATURE = /^(ss(0[1-9]|1\d|20)|salt|smcp|onum|tnum|sups|sinf|dlig)$/;

const FORMS = new Set<string>(['init', 'medi', 'fina', 'isol']);

/** The script tag of the rules of a glyph: Arabic, Han and the Indic scripts (dev2, bng2…) have their own, the others share DFLT. */
export type ScriptTag = string;

/** The code point a glyph stands for: its own, else that of the glyph its name starts with (uni0628.init). */
function rootCode(glyph: Glyph | undefined, byName: Map<string, Glyph>): number | undefined {
  if (!glyph) return undefined;
  return glyph.unicode ?? byName.get(glyph.name.split(/[._]/)[0]!)?.unicode;
}

function scriptOf(glyph: Glyph | undefined, byName: Map<string, Glyph>): ScriptTag {
  const code = rootCode(glyph, byName);
  if (code === undefined) return 'DFLT';
  return isArabic(code) ? 'arab' : (indicOf(code)?.tags[0] ?? 'DFLT');
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
  // An Indic conjunct: its letters and their viramas, as typed (क्ष = ka virama ssa); with a vowel sign, a letter and
  // its vowel drawn as one (Tamil கு, Bengali রু).
  const indic = indicOf(rootCode(byName.get(parts[0]!), byName) ?? -1);
  if (indic && scripts.size === 1 && scripts.has(indic.tags[0])) {
    const vowel = parts.some((part) => isVowelSign(byName.get(part)?.unicode ?? -1));
    return suffix === '' ? { feature: vowel ? 'psts' : 'akhn', script: indic.tags[0], sub: parts, by: glyph.name } : undefined;
  }
  if (scripts.size === 1 && scripts.has('arab')) {
    if (suffix !== '' && !FORMS.has(suffix)) return undefined;
    const sub = parts.map((part, i) => `${part}.${partForms(parts.length, suffix || 'isol')[i]}`).map((name, i) => (byName.has(name) ? name : parts[i]!));
    return { feature: 'rlig', script: 'arab', sub, by: glyph.name };
  }
  // A Tibetan letter with the letters written under it (the short ra of རྐ): always made, as ccmp.
  if (suffix === '' && parts.every((part) => /^uni0F[0-9A-F]{2}$/.test(part))) return { feature: 'ccmp', script: 'DFLT', sub: parts, by: glyph.name };
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
  const local = LOCAL[suffix];
  if (local) return { feature: 'locl', script: local.script, languages: local.languages, sub: [from], by: glyph.name };
  const feature = /^ss(0[1-9]|1\d|20)$/.test(suffix) ? suffix : SUFFIX_FEATURES[suffix];
  return feature ? { feature, script, sub: [from], by: glyph.name } : undefined;
}

/**
 * The forms of an Indic consonant: `.half` (before another consonant, the virama gone), `.rphf` (ra on top of the
 * next consonant: the reph), `.blwf` (under the consonant before it: ra below), `.pstf` (after it: the Bengali ya-phala),
 * `.pref` (the Malayalam ra, drawn before the consonant it follows).
 */
function indicRule(source: Glyph, suffix: string, by: string): Rule | undefined {
  const code = source.unicode;
  const script = code === undefined ? undefined : indicOf(code);
  if (code === undefined || !script || !isConsonant(code)) return undefined;
  const [tag, virama] = [script.tags[0], viramaName(script)];
  if (suffix === 'half') return { feature: 'half', script: tag, sub: [source.name, virama], by };
  const tail = script.rephTail?.map((part) => `uni${part.toString(16).toUpperCase().padStart(4, '0')}`) ?? [virama];
  if (suffix === 'rphf' && script.ras.includes(code)) return { feature: 'rphf', script: tag, sub: [source.name, ...tail], by };
  if (suffix === 'blwf' || suffix === 'pstf') return { feature: suffix, script: tag, sub: [virama, source.name], by };
  if (suffix === 'pref' && code === script.pref) return { feature: 'pref', script: tag, sub: [virama, source.name], by };
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

/** The OpenType language of a language tag, for the rules a language swaps in: zh-Hant is ZHT, zh-HK is ZHH. */
export function openTypeLanguage(tag: string | undefined): string | undefined {
  if (!tag) return undefined;
  const lower = tag.toLowerCase();
  if (lower === 'zh-hk' || lower === 'zh-hant-hk') return 'ZHH ';
  if (lower.startsWith('zh-hant') || lower === 'zh-tw') return 'ZHT ';
  return undefined;
}

/** The optional features a font has, for the app to offer: ss01, salt, smcp… */
export function optionalFeatures(doc: FontDoc): string[] {
  return [...new Set(featureRules(doc).map((rule) => rule.feature).filter((feature) => OPTIONAL_FEATURE.test(feature)))].sort();
}
