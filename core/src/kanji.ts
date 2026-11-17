// Kanji and kana drawn from their strokes: KanjiVG gives each stroke as a centre line (an SVG path in a box of 109,
// y down); this turns each one into an outline drawn with the font's own pen. KanjiVG is CC BY-SA 3.0: the data is
// never stored in this repository, only read from where the user put it.
import { FontError } from './types';

export type Point = [number, number];

/** The pen a kanji is drawn with: its width in font units, its ends, and how it thins along one direction. */
export interface Pen {
  width: number;
  /** round (default): half a disc; flat: cut across the stroke; square: cut and carried on half a width. */
  ends?: 'round' | 'flat' | 'square';
  /** 1 (default): every direction as wide. Below 1, strokes along `angle` thin to this share of the width. */
  contrast?: number;
  /** The direction, in degrees, a stroke is thinnest along: 0 makes horizontals thin, as in Mincho. */
  angle?: number;
  /** song: a small triangle on the end of each horizontal stroke (the uroko of Mincho and Song faces). */
  terminals?: 'song';
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
export function simplify(points: Point[], tolerance: number): Point[] {
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
export function strokeOutline(line: Point[], pen: Pen, taper: (t: number) => number = () => 1): Point[] {
  if (line.length < 2) throw new FontError('bad_kanji_data', 'A stroke needs two points.');
  const directions = tangents(line);
  const along = lengths(line);
  const sides = line.map((point, i) => {
    const [dx, dy] = directions[i]!;
    const half = halfWidth(pen, [dx, dy]) * taper(along[i]!);
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

/** How far along the line each point is, from 0 at its start to 1 at its end. */
function lengths(line: Point[]): number[] {
  const steps = line.map((p, i) => (i === 0 ? 0 : Math.hypot(p[0] - line[i - 1]![0], p[1] - line[i - 1]![1])));
  const total = steps.reduce((a, b) => a + b, 0) || 1;
  let sum = 0;
  return steps.map((step) => (sum += step) / total);
}

/**
 * How a Song face swells and thins a stroke along its length, y up: a falling stroke to the left (撇) starts full and
 * ends in a point; a falling stroke to the right (捺) starts light and widens to its foot. Level and upright strokes
 * keep their width.
 */
function songTaper(line: Point[]): (t: number) => number {
  const [start, end] = [line[0]!, line[line.length - 1]!];
  const [dx, dy] = [end[0] - start[0], end[1] - start[1]];
  const slanted = dy < 0 && Math.abs(dx) > Math.abs(dy) * 0.35;
  if (slanted && dx < 0) return (t) => 1.15 - 0.85 * t;
  if (slanted && dx > 0) return (t) => 0.55 + 0.8 * t * t;
  return () => 1;
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
  return `M${points[0]![0]} ${points[0]![1]}l${steps.join(' ')}z`;
}

/**
 * A kanji as SVG path data in font units: each stroke of its KanjiVG file drawn with the pen, the 109 box scaled into
 * the frame, every outline counterclockwise so that overlapping strokes add.
 */
export function kanjiPath(svg: string, pen: Pen, frame: Frame): string {
  const scale = (frame.right - frame.left) / 109;
  return drawLines(kanjiStrokes(svg).map((line) => line.map(([x, y]): Point => [frame.left + x * scale, frame.top - y * scale])), pen);
}

/** Lines in font units drawn with the pen: one outline each, counterclockwise. */
export function drawLines(lines: Point[][], pen: Pen): string {
  return lines
    // The outline thinned too: a point that moves it by less than 0.8 unit adds bytes, not shape.
    .flatMap((line) => [simplify(strokeOutline(line, pen, pen.terminals === 'song' ? songTaper(line) : undefined), 0.8), ...(pen.terminals === 'song' ? uroko(line, pen) : [])])
    .map((outline) => (area(outline) < 0 ? outline.reverse() : outline))
    .map(relative)
    .join('');
}

/**
 * The triangle Song and Mincho faces put on the right end of a horizontal stroke: it rises from the stroke's top a
 * little before its end and comes down past it. Only for a stroke that runs mostly left to right.
 */
function uroko(line: Point[], pen: Pen): Point[][] {
  const [start, end] = [line[0]!, line[line.length - 1]!];
  const [dx, dy] = [end[0] - start[0], end[1] - start[1]];
  if (dx < pen.width * 1.5 || Math.abs(dy) > dx * 0.3) return [];
  const w = pen.width;
  const thin = halfWidth(pen, [1, 0]);
  const [x, y] = end;
  return [[[x - 1.05 * w, y + thin], [x - 0.15 * w, y + thin + 0.7 * w], [x + 0.16 * w, y - thin]]];
}

/**
 * The line without the flicks a brush leaves at its two ends: a first or last piece shorter than a fifth of the
 * stroke that turns more than 35°. A Song face draws a stroke straight and lets its terminals say the rest.
 */
function unflick(line: Point[]): Point[] {
  const length = line.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - line[i]![0], p[1] - line[i]![1]), 0);
  let points = line;
  const short = (a: Point, b: Point): boolean => Math.hypot(b[0] - a[0], b[1] - a[1]) < length / 5;
  if (points.length > 2 && short(points[0]!, points[1]!) && turnAt(points[0]!, points[1]!, points[2]!) > 35) points = points.slice(1);
  const n = points.length;
  if (n > 2 && short(points[n - 2]!, points[n - 1]!) && turnAt(points[n - 3]!, points[n - 2]!, points[n - 1]!) > 35) points = points.slice(0, -1);
  return points;
}

/**
 * The line with its nearly level pieces made level and its nearly upright pieces upright (within 12°): a brush
 * writes horizontals rising a little, a Song face draws them flat.
 */
function straighten(line: Point[]): Point[] {
  const points = line.map((p): Point => [p[0], p[1]]);
  const tilt = Math.tan((12 * Math.PI) / 180);
  const kind = (i: number): 'h' | 'v' | undefined => {
    const [dx, dy] = [points[i + 1]![0] - points[i]![0], points[i + 1]![1] - points[i]![1]];
    return Math.abs(dy) <= Math.abs(dx) * tilt ? 'h' : Math.abs(dx) <= Math.abs(dy) * tilt ? 'v' : undefined;
  };
  // A run of level pieces takes one height, a run of upright ones one x: no step between two pieces of one run.
  for (let i = 0; i < points.length - 1; ) {
    const k = kind(i);
    let end = i + 1;
    while (k && end < points.length - 1 && kind(end) === k) end += 1;
    if (k) {
      const axis = k === 'h' ? 1 : 0;
      const run = points.slice(i, end + 1);
      const mean = run.reduce((sum, p) => sum + p[axis], 0) / run.length;
      run.forEach((p) => (p[axis] = mean));
    }
    i = end;
  }
  return points;
}

/** The turn at a point, in degrees: 0 when the line goes straight on. */
function turnAt(a: Point, b: Point, c: Point): number {
  const [u, v] = [unit([b[0] - a[0], b[1] - a[1]]), unit([c[0] - b[0], c[1] - b[1]])];
  return (Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1]))) * 180) / Math.PI;
}

/** A line through the points, curved between them (Catmull-Rom) but kept sharp where it turns more than 50°. */
export function smooth(points: Point[], steps = 6): Point[] {
  const out: Point[] = [points[0]!];
  for (let i = 0; i < points.length - 1; i += 1) {
    const corner = (k: number): boolean => k <= 0 || k >= points.length - 1 || turnAt(points[k - 1]!, points[k]!, points[k + 1]!) > 50;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p0 = corner(i) ? p1 : points[i - 1]!;
    const p3 = corner(i + 1) ? p2 : points[i + 2]!;
    for (let s = 1; s <= steps; s += 1) {
      const t = s / steps;
      const at = (k: 0 | 1): number =>
        0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t * t * t);
      out.push([at(0), at(1)]);
    }
  }
  return out;
}

/**
 * A hanzi as SVG path data in font units, from Make Me a Hanzi: the median of each stroke, points in a box of 1024, y
 * up, its top at 900 and its bottom at −124. The medians are smoothed, then drawn with the pen like a kanji.
 */
export function hanziPath(medians: number[][][], pen: Pen, frame: Frame): string {
  const scale = (frame.right - frame.left) / 1024;
  if (medians.length === 0) throw new FontError('bad_kanji_data', 'This character has no stroke.');
  // Smoothed, then thinned again: a curve keeps the points that bend it by more than 1.5 units of 1024.
  const clean = (median: Point[]): Point[] => (pen.terminals === 'song' ? straighten(unflick(median)) : median);
  return drawLines(medians.map((median) => simplify(smooth(clean(median as Point[])), 1.5).map(([x, y]): Point => [frame.left + x * scale, frame.top - (900 - y) * scale])), pen);
}
