import { isRtl, joiningOf, MIRROR, type Joining } from './arabic';
import { DEFAULT_FEATURES, featureRules, type Rule } from './features';
import type { FontDoc, Glyph } from './types';

/** A glyph set on a line: its embedding level (odd: right to left) and, for a mark, the item it sits on. */
export interface Item {
  glyph: Glyph;
  level: number;
  /** The index of the letter a mark belongs to, in the logical order. */
  base?: number;
  mark: boolean;
}

type Strong = 'L' | 'R' | 'N' | undefined;

function typeOf(char: string): Strong {
  const code = char.codePointAt(0)!;
  if (/\p{Nd}/u.test(char)) return 'N';
  if (isRtl(code) && !/\p{M}/u.test(char)) return /\p{L}/u.test(char) ? 'R' : undefined;
  return /\p{L}/u.test(char) ? 'L' : undefined;
}

/**
 * The embedding level of each character, after the Unicode bidi algorithm in its simplest form: letters right to
 * left at an odd level, numbers after them (or in a right-to-left paragraph) at level 2, neutrals with their
 * neighbours when both agree, a mark with its letter. No explicit embeddings or isolates.
 */
export function bidiLevels(chars: string[]): number[] {
  const types = chars.map(typeOf);
  const rtl = types.find((type) => type === 'L' || type === 'R') === 'R';
  const levelOf = (dir: 'L' | 'R'): number => (dir === 'R' ? 1 : rtl ? 2 : 0);
  let last: 'L' | 'R' = rtl ? 'R' : 'L';
  const dirs = types.map((type): 'L' | 'R' | undefined => {
    if (type === 'L' || type === 'R') last = type;
    return type === undefined ? undefined : type === 'N' ? last : type;
  });
  const levels = types.map((type, i) => (type === 'N' ? (dirs[i] === 'L' ? levelOf('L') : 2) : dirs[i] ? levelOf(dirs[i]!) : -1));
  const edge: 'L' | 'R' = rtl ? 'R' : 'L';
  return levels.reduce<number[]>((out, level, i) => {
    if (level >= 0) return [...out, level];
    if (i > 0 && /\p{M}/u.test(chars[i]!)) return [...out, out[i - 1]!];
    const before = dirs.slice(0, i).reverse().find(Boolean) ?? edge;
    const after = dirs.slice(i + 1).find(Boolean) ?? edge;
    return [...out, before === after ? levelOf(before) : rtl ? 1 : 0];
  }, []);
}

/** The positions of the items in the order they are seen, left to right: runs reversed from the highest level down. */
export function visualOrder(levels: number[]): number[] {
  const order = levels.map((_, i) => i);
  const highest = Math.max(0, ...levels);
  const lowestOdd = levels.some((level) => level % 2 === 1) ? Math.min(...levels.filter((level) => level % 2 === 1)) : highest + 1;
  for (let level = highest; level >= lowestOdd; level -= 1) {
    for (let i = 0; i < order.length; ) {
      if (levels[order[i]!]! < level) {
        i += 1;
        continue;
      }
      let end = i;
      while (end < order.length && levels[order[end]!]! >= level) end += 1;
      order.splice(i, end - i, ...order.slice(i, end).reverse());
      i = end;
    }
  }
  return order;
}

/** The joining form of each Arabic letter from its neighbours, marks skipped. */
function joiningForms(joins: Joining[]): (string | undefined)[] {
  const near = (from: number, step: number): Joining => {
    for (let i = from + step; i >= 0 && i < joins.length; i += step) if (joins[i] !== 'T') return joins[i]!;
    return 'U';
  };
  return joins.map((join, i) => {
    if (join !== 'D' && join !== 'R') return undefined;
    const before = near(i, -1);
    const after = near(i, 1);
    const toBefore = before === 'D' || before === 'C';
    const toAfter = join === 'D' && (after === 'D' || after === 'R' || after === 'C');
    return toBefore && toAfter ? 'medi' : toBefore ? 'fina' : toAfter ? 'init' : 'isol';
  });
}

/** The longest ligature that starts at `at`, if any. */
function ligatureAt(names: string[], at: number, rules: Rule[]): Rule | undefined {
  return rules
    .filter((rule) => rule.sub.length > 1 && rule.sub.every((name, k) => names[at + k] === name))
    .sort((a, b) => b.sub.length - a.sub.length)[0];
}

interface Logical {
  glyph: Glyph;
  level: number;
  char: string;
}

/** The letters of a line as glyphs, in the order they are read, with their joining forms, ligatures and features. */
function substitute(doc: FontDoc, logical: Logical[], features: string[]): Logical[] {
  const byName = new Map(doc.glyphs.map((glyph) => [glyph.name, glyph]));
  const on = new Set([...DEFAULT_FEATURES, ...features]);
  const rules = featureRules(doc).filter((rule) => on.has(rule.feature));
  const singles = new Map(rules.filter((rule) => rule.sub.length === 1).map((rule) => [`${rule.feature} ${rule.sub[0]}`, rule.by]));
  const forms = joiningForms(logical.map((item) => joiningOf(item.char)));
  let items = logical.map((item, i) => {
    const by = forms[i] ? singles.get(`${forms[i]} ${item.glyph.name}`) : undefined;
    return by ? { ...item, glyph: byName.get(by)! } : item;
  });
  const out: Logical[] = [];
  for (let i = 0; i < items.length; ) {
    const lig = ligatureAt(items.map((item) => item.glyph.name), i, rules);
    out.push(lig ? { ...items[i]!, glyph: byName.get(lig.by)! } : items[i]!);
    i += lig ? lig.sub.length : 1;
  }
  items = out.map((item) => {
    const feature = features.find((f) => singles.has(`${f} ${item.glyph.name}`));
    return feature ? { ...item, glyph: byName.get(singles.get(`${feature} ${item.glyph.name}`)!)! } : item;
  });
  return items;
}

/**
 * A line of text shaped as a text engine would with the font's features: right-to-left runs reversed and their
 * brackets mirrored, Arabic letters joined, ligatures made, the optional features asked for applied. The items come
 * in the order they are drawn, left to right. A character the font does not draw is left out and named in `missing`.
 */
export function shapeLine(doc: FontDoc, text: string, features: string[] = []): { items: Item[]; missing: string[] } {
  const chars = [...text];
  const levels = bidiLevels(chars);
  const byCode = new Map(doc.glyphs.flatMap((glyph) => (glyph.unicode === undefined ? [] : [[glyph.unicode, glyph] as const])));
  const missing: string[] = [];
  const logical: Logical[] = chars.flatMap((raw, i) => {
    const char = levels[i]! % 2 === 1 ? (MIRROR[raw] ?? raw) : raw;
    const glyph = byCode.get(char.codePointAt(0)!);
    if (!glyph && !missing.includes(raw)) missing.push(raw);
    return glyph ? [{ glyph, level: levels[i]!, char }] : [];
  });
  const shaped = substitute(doc, logical, features);
  let lastBase = -1;
  const items: Item[] = shaped.map((item, i) => {
    const mark = /\p{M}/u.test(item.char) && item.glyph.advance === 0;
    if (!mark) lastBase = i;
    return { glyph: item.glyph, level: item.level, mark, ...(mark && lastBase >= 0 ? { base: lastBase } : {}) };
  });
  const order = visualOrder(items.map((item) => item.level));
  // Marks name their base by its logical index: keep it through the reordering.
  return { items: order.map((i) => ({ ...items[i]!, ...(items[i]!.base !== undefined ? { base: order.indexOf(items[i]!.base!) } : {}) })), missing };
}
