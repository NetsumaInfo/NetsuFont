/// <reference path="./opentype.d.ts" />
// Contextual alternates (calt): a glyph drawn another way next to some glyphs, such as a letter that joins the next in
// a script face, or a consonant that loses its head before a vowel sign drawn in its place. Written to the font as
// chaining substitutions (GSUB 6, format 3) under the script of the glyph; `proof` applies the same rules.
import type { Font as OtFont } from 'opentype.js';
import { scriptOf } from './features';
import type { FontDoc, Glyph } from './types';

/** The name of each item after the contexts of the font: a glyph whose neighbours match becomes its `by`. */
export function applyContexts<T extends { glyph: Glyph }>(items: T[], doc: FontDoc, byName: Map<string, Glyph>): T[] {
  const contexts = doc.contextual ?? [];
  if (contexts.length === 0) return items;
  return items.map((item, i) => {
    const found = contexts.find((c) => c.glyph === item.glyph.name
      && (!c.before || (i > 0 && c.before.includes(items[i - 1]!.glyph.name)))
      && (!c.after || (i + 1 < items.length && c.after.includes(items[i + 1]!.glyph.name))));
    const by = found ? byName.get(found.by) : undefined;
    return by ? { ...item, glyph: by } : item;
  });
}

interface Coverage {
  format: 1;
  glyphs: number[];
}

/** The part of opentype.js's GSUB this writes into. */
interface Gsub {
  lookups: { lookupType: number; lookupFlag: number; subtables: unknown[] }[];
}

const coverage = (names: string[], index: Map<string, number>): Coverage => ({ format: 1, glyphs: [...new Set(names.map((name) => index.get(name)!))].sort((a, b) => a - b) });

/** The contexts as `calt` lookups of the font: each a chaining rule that calls a single substitution. */
export function addContextual(font: OtFont, doc: FontDoc, index: Map<string, number>): void {
  const byName = new Map(doc.glyphs.map((glyph) => [glyph.name, glyph]));
  for (const context of doc.contextual ?? []) {
    const script = scriptOf(byName.get(context.glyph), byName);
    const substitution = font.substitution as unknown as { getLookupTables(script: string, language: string, feature: string, type: number, create: boolean): Gsub['lookups'] };
    const chain = substitution.getLookupTables(script, 'dflt', 'calt', 6, true)[0]!;
    const gsub = (font.tables as unknown as { gsub: Gsub }).gsub;
    gsub.lookups.push({ lookupType: 1, lookupFlag: 0, subtables: [{ substFormat: 2, coverage: coverage([context.glyph], index), substitute: [index.get(context.by)!] }] });
    chain.subtables.push({
      substFormat: 3,
      backtrackCoverage: context.before ? [coverage(context.before, index)] : [],
      inputCoverage: [coverage([context.glyph], index)],
      lookaheadCoverage: context.after ? [coverage(context.after, index)] : [],
      lookupRecords: [{ sequenceIndex: 0, lookupListIndex: gsub.lookups.length - 1 }],
    });
  }
}
