import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Resvg } from '@resvg/resvg-js';
import { checkGlyphs, coverage, FontError, languageCoverage, sideBearings, type FontDoc, type Glyph } from '@netsufont/core';

export function text(value: string): CallToolResult {
  return { content: [{ type: 'text', text: value }] };
}

/** A `FontError` is the agent's to fix: it gets the sentence back. Anything else is ours and is thrown. */
export function guarded(run: () => CallToolResult): CallToolResult {
  try {
    return run();
  } catch (error) {
    if (error instanceof FontError) return { isError: true, content: [{ type: 'text', text: `${error.code}: ${error.message}` }] };
    throw error;
  }
}

/** The SVG as a PNG, `width` pixels wide, with a sentence before it. */
export function png(svg: string, width: number, said: string): CallToolResult {
  const data = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: true } }).render().asPng();
  return { content: [{ type: 'text', text: said }, { type: 'image', data: Buffer.from(data).toString('base64'), mimeType: 'image/png' }] };
}

/** What each set lacks, in one line: "uppercase 26/26, lowercase 3/26 (missing defg…)". */
export function coverageLine(doc: FontDoc): string {
  return coverage(doc)
    .filter(({ set }) => set !== 'ascii')
    .map(({ set, has, of, missing }) => `${set} ${has}/${of}${missing && has > 0 ? ` (missing ${JSON.stringify(missing)})` : ''}`)
    .join(', ');
}

/** A glyph in short: name, character, advance, side bearings and components. */
function glyphLine(doc: FontDoc, glyph: Glyph): string {
  const char = glyph.unicode === undefined ? '' : ` ${JSON.stringify(String.fromCodePoint(glyph.unicode))}`;
  const bearings = sideBearings(doc, glyph);
  const parts = glyph.components?.length ? ` +${glyph.components.map((part) => part.glyph).join('+')}` : '';
  return `${glyph.name}${char} ${glyph.advance}${bearings ? ` [${bearings.left} ${bearings.right}]` : ' empty'}${parts}`;
}

function head(doc: FontDoc): string[] {
  const { ascender, descender, capHeight, xHeight } = doc.metrics;
  return [
    `${doc.name}: "${doc.family}" ${doc.style}, ${doc.unitsPerEm} units, ascender ${ascender}, cap ${capHeight}, x ${xHeight}, descender ${descender}`,
    `coverage: ${coverageLine(doc)}`,
    `kerning: ${doc.kerning.length} pairs`,
    `languages complete: ${languageCoverage(doc).filter((l) => l.has === l.of).map((l) => l.code).join(', ') || 'none'} (tool languages: what each lacks)`,
  ];
}

const SHOWN = 12;

/** The checks of these glyphs, at most a dozen lines. */
function checks(doc: FontDoc, names?: string[]): string[] {
  const found = checkGlyphs(doc, names);
  if (found.length === 0) return [];
  const lines = found.slice(0, SHOWN).map((finding) => `  ${finding.glyph}: ${finding.text}`);
  return ['checks:', ...lines, ...(found.length > SHOWN ? [`  and ${found.length - SHOWN} more`] : [])];
}

/**
 * A short picture of the whole font: every glyph in one line each, without the path data.
 * Format of a glyph: name char advance [left right].
 */
export function outline(doc: FontDoc): string {
  const glyphs = doc.glyphs.map((glyph) => glyphLine(doc, glyph));
  return [...head(doc), `glyphs (${doc.glyphs.length}; name char advance [left right]): ${glyphs.join(', ')}`, ...checks(doc)].join('\n');
}

/** What an edit answers: the font in short, the glyphs it changed, and what is wrong in them. */
export function afterEdit(before: FontDoc, after: FontDoc): string {
  const old = new Map(before.glyphs.map((glyph) => [glyph.name, JSON.stringify(glyph)]));
  const changed = after.glyphs.filter((glyph) => old.get(glyph.name) !== JSON.stringify(glyph));
  const gone = before.glyphs.filter((glyph) => !after.glyphs.some((g) => g.name === glyph.name)).map((glyph) => glyph.name);
  const names = changed.map((glyph) => glyph.name);
  const listed = changed.length > 80 ? `${changed.length} glyphs` : changed.map((glyph) => glyphLine(after, glyph)).join(', ') || 'none';
  return [...head(after), `changed: ${listed}`, ...(gone.length > 0 ? [`removed: ${gone.join(', ')}`] : []), ...checks(after, names)].join('\n');
}
