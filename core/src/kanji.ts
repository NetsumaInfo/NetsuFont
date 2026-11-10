// Kanji and kana drawn from their strokes: KanjiVG gives each stroke as a centre line (an SVG path in a box of 109,
// y down); this turns each one into an outline drawn with the font's own pen. KanjiVG is CC BY-SA 3.0: the data is
// never stored in this repository, only read from where the user put it.
import { FontError } from './types';

type Point = [number, number];

/** The pen a kanji is drawn with: its width in font units, its ends, and how it thins along one direction. */
export interface Pen {
  width: number;
  /** round (default): half a disc; flat: cut across the stroke; square: cut and carried on half a width. */
  ends?: 'round' | 'flat' | 'square';
  /** 1 (default): every direction as wide. Below 1, strokes along `angle` thin to this share of the width. */
  contrast?: number;
  /** The direction, in degrees, a stroke is thinnest along: 0 makes horizontals thin, as in Mincho. */
  angle?: number;
}

/** Where the 109-unit box of KanjiVG goes in the glyph, in font units, y up. */
export interface Frame {
  left: number;
  right: number;
  top: number;
}

/** The centre lines of every stroke of a KanjiVG file, each as points in its box (y down). */
export function kanjiStrokes(svg: string): Point[][] {
  const paths = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((match) => match[1]!);
  if (paths.length === 0) throw new FontError('bad_kanji_data', 'This KanjiVG file has no stroke.');
  return paths.map((d) => simplify(flatten(d), 0.15));
}

/** The line with the points that bend it less than `tolerance` left out (Douglas and Peucker). */
function simplify(points: Point[], tolerance: number): Point[] {
  if (points.length < 3) return points;
  const [a, b] = [points[0]!, points[points.length - 1]!];
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  let far = 0;
  let at = 0;
  points.forEach(([x, y], i) => {
    const distance = Math.abs((b[0] - a[0]) * (a[1] - y) - (a[0] - x) * (b[1] - a[1])) / length;
    if (distance > far) [far, at] = [distance, i];
  });
  if (far <= tolerance) return [a, b];
  return [...simplify(points.slice(0, at + 1), tolerance).slice(0, -1), ...simplify(points.slice(at), tolerance)];
}

/** The points of a path of M m C c S s, its curves cut in short straight pieces. */
function flatten(d: string): Point[] {
  const tokens = d.match(/[MmCcSs]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const points: Point[] = [];
  let at: Point = [0, 0];
  let control: Point = [0, 0];
  let command = 'M';
  for (let i = 0; i < tokens.length; ) {
    if (/[A-Za-z]/.test(tokens[i]!)) command = tokens[i++]!;
    const take = (n: number): number[] => tokens.slice(i, (i += n)).map(Number);
    const base: Point = command === command.toLowerCase() ? at : [0, 0];
    const abs = (x: number, y: number): Point => [base[0] + x, base[1] + y];
    if (command === 'M' || command === 'm') {
      const [x, y] = take(2);
      at = abs(x!, y!);
      control = at;
      points.push(at);
    } else {
      const smooth = command === 'S' || command === 's';
      const values = take(smooth ? 4 : 6);
      const c1: Point = smooth ? [2 * at[0] - control[0], 2 * at[1] - control[1]] : abs(values[0]!, values[1]!);
      const c2 = abs(values[smooth ? 0 : 2]!, values[smooth ? 1 : 3]!);
      const end = abs(values[smooth ? 2 : 4]!, values[smooth ? 3 : 5]!);
      points.push(...cubic(at, c1, c2, end));
      control = c2;
      at = end;
    }
  }
  return points;
}

/** A cubic as points, about one every unit and a half of the 109 box, its start left out. */
function cubic(p0: Point, p1: Point, p2: Point, p3: Point): Point[] {
  const length = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) + Math.hypot(p3[0] - p2[0], p3[1] - p2[1]);
  const count = Math.max(2, Math.ceil(length / 1.5));
  return Array.from({ length: count }, (_, k) => {
    const t = (k + 1) / count;
    const u = 1 - t;
    const mix = (i: 0 | 1): number => u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i];
    return [mix(0), mix(1)];
  });
}

const unit = ([x, y]: Point): Point => {
  const length = Math.hypot(x, y) || 1;
  return [x / length, y / length];
};

/** The direction of the line at each point: along its neighbours, the two pieces averaged at a corner. */
function tangents(points: Point[]): Point[] {
  return points.map((_, i) => {
    const before = points[Math.max(0, i - 1)]!;
    const after = points[Math.min(points.length - 1, i + 1)]!;
    return unit([after[0] - before[0], after[1] - before[1]]);
  });
}

/** Half the width of the pen along a direction: thinnest along `angle` when the pen has contrast. */
function halfWidth(pen: Pen, [dx, dy]: Point): number {
  const contrast = pen.contrast ?? 1;
  const across = Math.abs(Math.sin(Math.atan2(dy, dx) - ((pen.angle ?? 0) * Math.PI) / 180));
  return (pen.width * (contrast + (1 - contrast) * across)) / 2;
}

/** Half a circle of points round an end, from one side of the stroke to the other. */
function cap(centre: Point, [nx, ny]: Point, radius: number, steps = 6): Point[] {
  const start = Math.atan2(ny, nx);
  return Array.from({ length: steps - 1 }, (_, k): Point => {
    const a = start - (Math.PI * (k + 1)) / steps;
    return [centre[0] + radius * Math.cos(a), centre[1] + radius * Math.sin(a)];
  });
}

/** One stroke as one closed outline: its left side, its end, its right side back, its start. Points in font units. */
export function strokeOutline(line: Point[], pen: Pen): Point[] {
  if (line.length < 2) throw new FontError('bad_kanji_data', 'A stroke needs two points.');
  const directions = tangents(line);
  const sides = line.map((point, i) => {
    const [dx, dy] = directions[i]!;
    const half = halfWidth(pen, [dx, dy]);
    return { left: [point[0] - dy * half, point[1] + dx * half] as Point, right: [point[0] + dy * half, point[1] - dx * half] as Point, half };
  });
  const ends = pen.ends ?? 'round';
  const last = line.length - 1;
  const forward = directions[last]!;
  const back = directions[0]!;
  const reach = (point: Point, [dx, dy]: Point, by: number): Point => [point[0] + dx * by, point[1] + dy * by];
  const endCap = ends === 'round' ? cap(line[last]!, [-forward[1], forward[0]], sides[last]!.half) : [];
  const startCap = ends === 'round' ? cap(line[0]!, [back[1], -back[0]], sides[0]!.half) : [];
  const out = ends === 'square' ? sides[last]!.half : 0;
  const lefts = sides.map((side) => side.left);
  const rights = sides.map((side) => side.right).reverse();
  lefts[last] = reach(lefts[last]!, forward, out);
  rights[0] = reach(rights[0]!, forward, out);
  lefts[0] = reach(lefts[0]!, back, -out);
  rights[last] = reach(rights[last]!, back, -out);
  return [...lefts, ...endCap, ...rights, ...startCap];
}

/** Twice the signed area: positive when the outline turns counterclockwise (y up). */
const area = (points: Point[]): number => points.reduce((sum, [x0, y0], i) => {
  const [x1, y1] = points[(i + 1) % points.length]!;
  return sum + x0 * y1 - x1 * y0;
}, 0);

/** An outline as short path data: the first point, then each step from the one before, whole units. */
function relative(outline: Point[]): string {
  const points = outline.map(([x, y]): Point => [Math.round(x), Math.round(y)]).filter((p, i, all) => i === 0 || p[0] !== all[i - 1]![0] || p[1] !== all[i - 1]![1]);
  const steps = points.slice(1).map(([x, y], i) => `${x - points[i]![0]} ${y - points[i]![1]}`);
  return `M${points[0]![0]} ${points[0]![1]}l${steps.join(" ")}z`;
}

/**
 * A kanji as SVG path data in font units: each stroke of its KanjiVG file drawn with the pen, the 109 box scaled into
 * the frame, every outline counterclockwise so that overlapping strokes add.
 */
export function kanjiPath(svg: string, pen: Pen, frame: Frame): string {
  const scale = (frame.right - frame.left) / 109;
  return kanjiStrokes(svg)
    .map((line) => line.map(([x, y]): Point => [frame.left + x * scale, frame.top - y * scale]))
    .map((line) => strokeOutline(line, pen))
    .map((outline) => (area(outline) < 0 ? outline.reverse() : outline))
    .map(relative)
    .join('');
}
