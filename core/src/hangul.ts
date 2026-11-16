// Hangul from its letters: each jamo is a few centre lines in a unit box (y up), written for NetsuFont. A syllable
// places its initial, its vowel and its final in boxes that depend on the vowel, and the lines are drawn with the pen
// of the font: the strokes keep their width however small their box.
import { drawLines, type Frame, type Pen, type Point } from './kanji';
import { FontError } from './types';

type Lines = Point[][];

const ring = (cx: number, cy: number, rx: number, ry: number): Point[] =>
  Array.from({ length: 25 }, (_, i): Point => [cx + rx * Math.cos((i * Math.PI) / 12 + Math.PI / 2), cy + ry * Math.sin((i * Math.PI) / 12 + Math.PI / 2)]);

/** The 14 simple consonants. */
const CONSONANT: Record<string, Lines> = {
  ㄱ: [[[0.12, 0.88], [0.84, 0.88], [0.84, 0.12]]],
  ㄴ: [[[0.16, 0.88], [0.16, 0.12], [0.88, 0.12]]],
  ㄷ: [[[0.86, 0.88], [0.16, 0.88], [0.16, 0.12], [0.88, 0.12]]],
  ㄹ: [[[0.14, 0.88], [0.84, 0.88], [0.84, 0.5], [0.16, 0.5], [0.16, 0.12], [0.88, 0.12]]],
  ㅁ: [[[0.16, 0.88], [0.16, 0.12]], [[0.16, 0.88], [0.84, 0.88], [0.84, 0.12]], [[0.16, 0.12], [0.84, 0.12]]],
  ㅂ: [[[0.18, 0.9], [0.18, 0.12]], [[0.82, 0.9], [0.82, 0.12]], [[0.18, 0.52], [0.82, 0.52]], [[0.18, 0.12], [0.82, 0.12]]],
  ㅅ: [[[0.5, 0.9], [0.1, 0.1]], [[0.5, 0.62], [0.9, 0.1]]],
  ㅇ: [ring(0.5, 0.5, 0.36, 0.38)],
  ㅈ: [[[0.14, 0.88], [0.86, 0.88]], [[0.5, 0.88], [0.1, 0.1]], [[0.5, 0.56], [0.9, 0.1]]],
  ㅊ: [[[0.5, 1], [0.5, 0.86]], [[0.14, 0.76], [0.86, 0.76]], [[0.5, 0.76], [0.1, 0.1]], [[0.5, 0.48], [0.9, 0.1]]],
  ㅋ: [[[0.12, 0.88], [0.84, 0.88], [0.84, 0.12]], [[0.14, 0.5], [0.84, 0.5]]],
  ㅌ: [[[0.86, 0.88], [0.16, 0.88], [0.16, 0.12], [0.88, 0.12]], [[0.16, 0.5], [0.82, 0.5]]],
  ㅍ: [[[0.1, 0.88], [0.9, 0.88]], [[0.1, 0.12], [0.9, 0.12]], [[0.34, 0.88], [0.3, 0.12]], [[0.66, 0.88], [0.7, 0.12]]],
  ㅎ: [[[0.5, 1], [0.5, 0.88]], [[0.14, 0.78], [0.86, 0.78]], ring(0.5, 0.34, 0.28, 0.28)],
};

/** Double consonants and the clusters of finals: two simple ones side by side. */
const PAIR: Record<string, [string, string]> = {
  ㄲ: ['ㄱ', 'ㄱ'], ㄸ: ['ㄷ', 'ㄷ'], ㅃ: ['ㅂ', 'ㅂ'], ㅆ: ['ㅅ', 'ㅅ'], ㅉ: ['ㅈ', 'ㅈ'], ㄳ: ['ㄱ', 'ㅅ'], ㄵ: ['ㄴ', 'ㅈ'], ㄶ: ['ㄴ', 'ㅎ'],
  ㄺ: ['ㄹ', 'ㄱ'], ㄻ: ['ㄹ', 'ㅁ'], ㄼ: ['ㄹ', 'ㅂ'], ㄽ: ['ㄹ', 'ㅅ'], ㄾ: ['ㄹ', 'ㅌ'], ㄿ: ['ㄹ', 'ㅍ'], ㅀ: ['ㄹ', 'ㅎ'], ㅄ: ['ㅂ', 'ㅅ'],
};

/** The parts of a vowel: a long upright on the right (vertical), a long bar below (horizontal), or both. */
interface Vowel {
  upright?: Lines;
  bar?: Lines;
}

const up = (x: number): Point[] => [[x, 0.98], [x, 0.02]];
const tickRight = (x: number, y: number): Point[] => [[x, y], [x + 0.42, y]];
const tickLeft = (x: number, y: number): Point[] => [[x - 0.42, y], [x, y]];
const bar = (y: number): Point[] => [[0.04, y], [0.96, y]];
const tickUp = (x: number, y: number): Point[] => [[x, y], [x, y + 0.42]];
const tickDown = (x: number, y: number): Point[] => [[x, y], [x, y - 0.42]];

const VOWEL: Record<string, Vowel> = {
  ㅏ: { upright: [up(0.3), tickRight(0.3, 0.5)] },
  ㅐ: { upright: [up(0.2), tickRight(0.2, 0.5), up(0.8)] },
  ㅑ: { upright: [up(0.3), tickRight(0.3, 0.62), tickRight(0.3, 0.38)] },
  ㅒ: { upright: [up(0.2), tickRight(0.2, 0.62), tickRight(0.2, 0.38), up(0.8)] },
  ㅓ: { upright: [tickLeft(0.7, 0.5), up(0.7)] },
  ㅔ: { upright: [tickLeft(0.5, 0.5), up(0.5), up(0.85)] },
  ㅕ: { upright: [tickLeft(0.7, 0.62), tickLeft(0.7, 0.38), up(0.7)] },
  ㅖ: { upright: [tickLeft(0.5, 0.62), tickLeft(0.5, 0.38), up(0.5), up(0.85)] },
  ㅣ: { upright: [up(0.5)] },
  ㅗ: { bar: [tickUp(0.5, 0.3), bar(0.3)] },
  ㅛ: { bar: [tickUp(0.35, 0.3), tickUp(0.65, 0.3), bar(0.3)] },
  ㅜ: { bar: [bar(0.7), tickDown(0.5, 0.7)] },
  ㅠ: { bar: [bar(0.7), tickDown(0.35, 0.7), tickDown(0.65, 0.7)] },
  ㅡ: { bar: [bar(0.5)] },
};
// The compound vowels: a horizontal one below, a vertical one on the right.
const COMPOUND: Record<string, [string, string]> = { ㅘ: ['ㅗ', 'ㅏ'], ㅙ: ['ㅗ', 'ㅐ'], ㅚ: ['ㅗ', 'ㅣ'], ㅝ: ['ㅜ', 'ㅓ'], ㅞ: ['ㅜ', 'ㅔ'], ㅟ: ['ㅜ', 'ㅣ'], ㅢ: ['ㅡ', 'ㅣ'] };
for (const [name, [low, right]] of Object.entries(COMPOUND)) VOWEL[name] = { bar: VOWEL[low]!.bar, upright: VOWEL[right]!.upright };

const INITIALS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const VOWELS = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const FINALS = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];

/** A box in the unit square of the syllable: left, bottom, right, top. */
type Box = [number, number, number, number];

/** The lines of a consonant in a box: a pair splits the box in two, side by side. */
function consonant(name: string, box: Box): Lines {
  const pair = PAIR[name];
  if (pair) {
    const middle = (box[0] + box[2]) / 2;
    return [...consonant(pair[0], [box[0], box[1], middle - 0.01, box[3]]), ...consonant(pair[1], [middle + 0.01, box[1], box[2], box[3]])];
  }
  return place(CONSONANT[name]!, box);
}

const place = (lines: Lines, [l, b, r, t]: Box): Lines => lines.map((line) => line.map(([x, y]): Point => [l + x * (r - l), b + y * (t - b)]));

/** Where the initial, the vowel's parts and the final go, by the kind of vowel and whether there is a final. */
function boxes(vowel: Vowel, final: boolean): { initial: Box; upright?: Box; bar?: Box; final?: Box } {
  const low = final ? 0.36 : 0;
  if (vowel.upright && vowel.bar) {
    return { initial: [0, final ? 0.68 : 0.52, 0.6, 1], bar: [0, final ? 0.42 : 0.18, 0.7, final ? 0.64 : 0.5], upright: [0.66, low + 0.04, 1, 1], final: final ? [0.12, 0, 0.88, 0.32] : undefined };
  }
  if (vowel.bar) return { initial: [0.14, final ? 0.66 : 0.44, 0.86, 1], bar: [0, final ? 0.38 : 0, 1, final ? 0.62 : 0.44], final: final ? [0.14, 0, 0.86, 0.32] : undefined };
  return { initial: [0, final ? 0.42 : 0.12, 0.6, final ? 1 : 0.9], upright: [0.58, low, 1, 1], final: final ? [0.1, 0, 0.84, 0.34] : undefined };
}

/** The centre lines of a Hangul syllable or letter, in the unit square. */
export function hangulLines(char: string): Lines {
  const code = char.codePointAt(0)!;
  if (CONSONANT[char] || PAIR[char]) return consonant(char, [0.1, 0.06, 0.9, 0.94]);
  if (VOWEL[char]) {
    const v = VOWEL[char]!;
    return v.upright && v.bar ? [...place(v.bar, [0, 0.1, 0.72, 0.5]), ...place(v.upright, [0.66, 0, 1, 1])] : place((v.upright ?? v.bar)!, [0.15, 0.05, 0.85, 0.95]);
  }
  if (code < 0xac00 || code > 0xd7a3) throw new FontError('not_hangul', `"${char}" is not a Hangul syllable or letter.`);
  const index = code - 0xac00;
  const [l, v, t] = [Math.floor(index / 588), Math.floor((index % 588) / 28), index % 28];
  const vowel = VOWEL[VOWELS[v]!]!;
  const at = boxes(vowel, t > 0);
  return [
    ...consonant(INITIALS[l]!, at.initial),
    ...(vowel.bar && at.bar ? place(vowel.bar, at.bar) : []),
    ...(vowel.upright && at.upright ? place(vowel.upright, at.upright) : []),
    ...(t > 0 && at.final ? consonant(FINALS[t]!, at.final) : []),
  ];
}

/** A Hangul syllable or letter as path data: its lines in the frame's square (inset a little), drawn with the pen. */
export function hangulPath(char: string, pen: Pen, frame: Frame): string {
  const size = frame.right - frame.left;
  const [inset, square] = [size * 0.1, size * 0.8];
  return drawLines(hangulLines(char).map((line) => line.map(([x, y]): Point => [frame.left + inset + x * square, frame.top - inset - (1 - y) * square])), pen);
}
