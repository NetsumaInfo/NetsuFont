import { FontError, glyphName, HANGUL_ALL, HANGUL_KSX, hangulPath, JAMO, HANZI_1, HANZI_2, HANZI_3, HANZI_TRADITIONAL, hanziPath, JINMEIYO, JOYO, kanjiPath, KANA, type FontDoc, type Frame, type Op, type Pen } from '@netsufont/core';
import { z } from 'zod';
import type { Store } from './store';

/** The sets of characters draw_kanji knows by name, and the stroke data each is drawn from first. */
export const SETS = {
  kana: { chars: KANA, from: 'kanjivg' },
  joyo: { chars: JOYO, from: 'kanjivg' },
  jinmeiyo: { chars: JINMEIYO, from: 'kanjivg' },
  hanzi1: { chars: HANZI_1, from: 'hanzi' },
  hanzi2: { chars: HANZI_2, from: 'hanzi' },
  hanzi3: { chars: HANZI_3, from: 'hanzi' },
  hant: { chars: HANZI_TRADITIONAL, from: 'hanzi' },
  hangul: { chars: HANGUL_KSX, from: 'hangul' },
  hangul_all: { chars: HANGUL_ALL, from: 'hangul' },
  jamo: { chars: JAMO, from: 'hangul' },
} as const;

type Source = 'kanjivg' | 'hanzi' | 'hangul';

/** Hangul is drawn from letters written for NetsuFont: no data to download. */
const isHangul = (char: string): boolean => {
  const code = char.codePointAt(0)!;
  return (code >= 0xac00 && code <= 0xd7a3) || (code >= 0x3131 && code <= 0x3163);
};

export const kanjiInput = {
  chars: z.string().optional().describe('The characters to draw, such as "日本語あいう" or "中文".'),
  set: z.enum(['kana', 'joyo', 'jinmeiyo', 'hanzi1', 'hanzi2', 'hanzi3', 'hant', 'hangul', 'hangul_all', 'jamo']).optional().describe('Or a whole set (see guide).'),
  from: z.enum(['kanjivg', 'hanzi']).optional().describe('The stroke data to try first: kanjivg (Japanese forms) or hanzi (Chinese forms).'),
  pen: z.object({
    width: z.number().positive().describe('The stroke width in font units, about the stem of the font.'),
    ends: z.enum(['round', 'flat', 'square']).optional(),
    contrast: z.number().min(0.1).max(1).optional().describe('1: monoline. Below: strokes along angle thin to this share.'),
    angle: z.number().optional().describe('Degrees; 0 thins the horizontals, as in Mincho or Song.'),
  }),
  frame: z.object({ left: z.number(), right: z.number(), top: z.number() }).optional().describe('Where the box of the data goes; default the em square.'),
};

interface Args {
  chars?: string;
  set?: keyof typeof SETS;
  from?: 'kanjivg' | 'hanzi';
  pen: Pen;
  frame?: Frame;
}

/** The outline of one character from the first source that has it, and which one did. */
function drawOne(store: Store, char: string, order: Source[], pen: Pen, frame: Frame): { path: string; from: Source } | undefined {
  if (isHangul(char)) return { path: hangulPath(char, pen, frame), from: 'hangul' };
  for (const from of order) {
    if (from === 'kanjivg') {
      const svg = store.kanjiSvg(char);
      if (svg !== undefined) return { path: kanjiPath(svg, pen, frame), from };
    } else {
      const medians = store.hanziMedians(char);
      if (medians !== undefined) return { path: hanziPath(medians, pen, frame), from };
    }
  }
  return undefined;
}

/**
 * The set_glyph ops that draw these characters with the pen, from the source asked for first and the other when it
 * lacks one; the characters neither has; and how many came from the second source.
 */
export function kanjiOps(store: Store, doc: FontDoc, args: Args): { ops: Op[]; missing: string[]; fallback: string[] } {
  const chars = [...new Set(args.chars ?? (args.set ? SETS[args.set].chars : ''))];
  if (chars.length === 0) throw new FontError('nothing_to_draw', 'Give chars, or a set: kana, joyo, jinmeiyo, hanzi1, hanzi2, hanzi3, hant, hangul, hangul_all or jamo.');
  const have = { ...store.strokeData(), hangul: true };
  const first: Source = args.from ?? (args.set ? SETS[args.set].from : chars.every(isHangul) ? 'hangul' : 'kanjivg');
  const order = (first === 'hanzi' ? ['hanzi', 'kanjivg'] : ['kanjivg', 'hanzi']) as Source[];
  if (!have[first]) {
    const command = first === 'kanjivg' ? 'kanjivg (KanjiVG, CC BY-SA 3.0)' : 'hanzi (Make Me a Hanzi, Arphic Public License)';
    throw new FontError('no_kanji_data', `The stroke data is not downloaded. The user runs: pnpm --filter @netsufont/server ${command}.`);
  }
  const em = doc.unitsPerEm;
  const frame = args.frame ?? { left: 0, right: em, top: doc.metrics.descender + em };
  const ops: Op[] = [];
  const missing: string[] = [];
  const fallback: string[] = [];
  for (const char of chars) {
    const drawn = drawOne(store, char, order.filter((source) => have[source]), args.pen, frame);
    if (!drawn) missing.push(char);
    else {
      if (drawn.from !== first && drawn.from !== 'hangul') fallback.push(char);
      ops.push({ op: 'set_glyph', glyph: glyphName(char), unicode: char.codePointAt(0)!, advance: em, path: drawn.path });
    }
  }
  return { ops, missing, fallback };
}
