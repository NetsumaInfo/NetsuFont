// A heavier (or lighter) style from a drawn one: every contour moved out along its normal, so strokes grow by twice
// the amount and counters, turned the other way, shrink. The start of a Bold from a Regular, to be looked at and
// fixed: a sharp inner corner or a thin join can need a hand after it.
import { parsePath, transformPath, writePath, type Command } from './path';

type Point = [number, number];
/** A contour as cubic segments (lines with their handles on the line), closed. */
interface Segment {
  from: Point;
  c1: Point;
  c2: Point;
  to: Point;
}

const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];
const same = (a: Point, b: Point): boolean => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function contours(commands: Command[]): Segment[][] {
  const out: Segment[][] = [];
  let start: Point = [0, 0];
  let at: Point = [0, 0];
  const close = (): void => {
    const last = out[out.length - 1];
    if (last && last.length > 0 && !same(at, start)) last.push({ from: at, c1: at, c2: start, to: start });
  };
  for (const c of commands) {
    if (c.type === 'M') {
      close();
      out.push([]);
      start = at = [c.x, c.y];
    } else if (c.type === 'L') {
      out[out.length - 1]!.push({ from: at, c1: at, c2: [c.x, c.y], to: [c.x, c.y] });
      at = [c.x, c.y];
    } else if (c.type === 'Q') {
      const to: Point = [c.x, c.y];
      out[out.length - 1]!.push({ from: at, c1: lerp(at, [c.x1, c.y1], 2 / 3), c2: lerp(to, [c.x1, c.y1], 2 / 3), to });
      at = to;
    } else if (c.type === 'C') {
      out[out.length - 1]!.push({ from: at, c1: [c.x1, c.y1], c2: [c.x2, c.y2], to: [c.x, c.y] });
      at = [c.x, c.y];
    } else {
      close();
      at = start;
    }
  }
  close();
  return out.filter((contour) => contour.length > 0);
}

/** The unit normal on the right of a direction: outward for a contour turning counterclockwise (y up). */
function normal(direction: Point): Point {
  const length = Math.hypot(direction[0], direction[1]) || 1;
  return [direction[1] / length, -direction[0] / length];
}

const startDirection = (s: Segment): Point => sub([s.c1, s.c2, s.to].find((p) => !same(p, s.from)) ?? s.to, s.from);
const endDirection = (s: Segment): Point => sub(s.to, [s.c2, s.c1, s.from].find((p) => !same(p, s.to)) ?? s.from);

/** Twice the signed area of a contour's corners: positive when it turns counterclockwise. */
const area = (contour: Segment[]): number => contour.reduce((sum, s) => sum + s.from[0] * s.to[1] - s.to[0] * s.from[1], 0);

/** Where an on-curve point goes: along the bisector of the normals around it, as far as keeps each side at `by`. */
function corner(point: Point, before: Point, after: Point, by: number): Point {
  const [a, b] = [normal(before), normal(after)];
  const k = 1 + a[0] * b[0] + a[1] * b[1];
  // A sharp corner (k below 0.5) would shoot the point past twice `by`: it moves by `by` along the way out instead.
  const [mx, my] = k < 0.5 ? [b[0] * by, b[1] * by] : [((a[0] + b[0]) * by) / k, ((a[1] + b[1]) * by) / k];
  return [point[0] + mx, point[1] + my];
}

function offset(contour: Segment[], by: number): Command[] {
  const moved = contour.map((s, i) => {
    const before = contour[(i - 1 + contour.length) % contour.length]!;
    const [n1, n2] = [normal(startDirection(s)), normal(endDirection(s))];
    return { from: corner(s.from, endDirection(before), startDirection(s), by), c1: [s.c1[0] + n1[0] * by, s.c1[1] + n1[1] * by] as Point, c2: [s.c2[0] + n2[0] * by, s.c2[1] + n2[1] * by] as Point, line: same(s.c1, s.from) && same(s.c2, s.to) };
  });
  const commands: Command[] = [{ type: 'M', x: moved[0]!.from[0], y: moved[0]!.from[1] }];
  moved.forEach((s, i) => {
    const to = moved[(i + 1) % moved.length]!.from;
    commands.push(s.line ? { type: 'L', x: to[0], y: to[1] } : { type: 'C', x1: s.c1[0], y1: s.c1[1], x2: s.c2[0], y2: s.c2[1], x: to[0], y: to[1] });
  });
  commands.push({ type: 'Z' });
  return commands;
}

/**
 * A path made heavier by `by` units on each side of every stroke (lighter when negative), moved right by `by` so
 * that its side bearings stay. The direction comes from its largest contour, so a glyph drawn either way grows.
 */
export function emboldenPath(path: string, by: number): string {
  const found = contours(parsePath(path));
  if (found.length === 0) return path;
  const largest = found.reduce((a, b) => (Math.abs(area(b)) > Math.abs(area(a)) ? b : a));
  const amount = area(largest) >= 0 ? by : -by;
  const moved = transformPath(found.flatMap((contour) => offset(contour, amount)), [1, 0, 0, 1, by, 0]);
  // Font files hold whole units.
  const commands = moved.map((c): Command => (c.type === 'Z' ? c : (Object.fromEntries(Object.entries(c).map(([key, value]) => [key, typeof value === 'number' ? Math.round(value) : value])) as Command)));
  return writePath(commands);
}
