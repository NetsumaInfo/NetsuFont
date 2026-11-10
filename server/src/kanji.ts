import { FontError, glyphName, JINMEIYO, JOYO, kanjiPath, KANA, type FontDoc, type Op, type Pen } from '@netsufont/core';
import { z } from 'zod';
import type { Store } from './store';

/** The sets of characters draw_kanji knows by name. */
export const SETS = { kana: KANA, joyo: JOYO, jinmeiyo: JINMEIYO } as const;

export const kanjiInput = {
  chars: z.string().optional().describe('The characters to draw, such as "日本語あいう".'),
  set: z.enum(['kana', 'joyo', 'jinmeiyo']).optional().describe('Or a whole set: kana, joyo (2,136 kanji), jinmeiyo (names).'),
  pen: z.object({
    width: z.number().positive().describe('The stroke width in font units, about the stem of the font.'),
    ends: z.enum(['round', 'flat', 'square']).optional(),
    contrast: z.number().min(0.1).max(1).optional().describe('1: monoline. Below: strokes along angle thin to this share.'),
    angle: z.number().optional().describe('Degrees; 0 thins the horizontals, as in Mincho.'),
  }),
  frame: z.object({ left: z.number(), right: z.number(), top: z.number() }).optional().describe("Where KanjiVG's box of 109 goes; default the em square."),
};

/** The set_glyph ops that draw these characters with the pen, and the characters KanjiVG has no strokes for. */
export function kanjiOps(store: Store, doc: FontDoc, args: { chars?: string; set?: keyof typeof SETS; pen: Pen; frame?: { left: number; right: number; top: number } }): { ops: Op[]; missing: string[] } {
  const chars = [...new Set(args.chars ?? (args.set ? SETS[args.set] : ''))];
  if (chars.length === 0) throw new FontError('nothing_to_draw', 'Give chars, or a set: kana, joyo or jinmeiyo.');
  const em = doc.unitsPerEm;
  const frame = args.frame ?? { left: 0, right: em, top: doc.metrics.descender + em };
  const ops: Op[] = [];
  const missing: string[] = [];
  for (const char of chars) {
    const svg = store.kanjiSvg(char);
    if (svg === undefined) missing.push(char);
    else ops.push({ op: 'set_glyph', glyph: glyphName(char), unicode: char.codePointAt(0)!, advance: em, path: kanjiPath(svg, args.pen, frame) });
  }
  return { ops, missing };
}
