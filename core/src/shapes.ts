import { writePath, type Command } from './path';
import { FontError } from './types';

/**
 * Primitives an agent builds a glyph from, turned into path data. Each shape is drawn counterclockwise (y up),
 * so shapes that overlap add; `hole: true` draws it the other way, so it cuts one layer of ink.
 * Angles are in degrees, counterclockwise from the right: 0 right, 90 top, 180 left, 270 bottom.
 */
export type Shape = (
  | { type: 'rect'; x: number; y: number; w: number; h: number }
  | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { type: 'ring'; cx: number; cy: number; rx: number; ry: number; stroke: number; strokeY?: number }
  | { type: 'arc'; cx: number; cy: number; rx: number; ry: number; stroke: number; strokeY?: number; from: number; to: number; ends?: 'round' }
  | { type: 'line'; x1: number; y1: number; x2: number; y2: number; width: number; ends?: 'square' | 'flat' | 'round' }
  | { type: 'polygon'; points: [number, number][] }
) & { hole?: boolean };

export const SHAPE_TYPES = ['rect', 'ellipse', 'ring', 'arc', 'line', 'polygon'] as const;

type Point = [number, number];
/** A contour as a start and segments: a line to a point, or a cubic with two handles. */
interface Contour {
  start: Point;
  segments: ({ to: Point } | { c1: Point; c2: Point; to: Point })[];
}

function polygon(points: Point[]): Contour {
  return { start: points[0]!, segments: points.slice(1).map((to) => ({ to })) };
}

/** Twice the signed area of the corners, enough to tell the way a contour turns. */
function turn(contour: Contour): number {
  const points = [contour.start, ...contour.segments.map((s) => s.to)];
  return points.reduce((sum, [x0, y0], i) => {
    const [x1, y1] = points[(i + 1) % points.length]!;
    return sum + x0 * y1 - x1 * y0;
  }, 0);
}

function reverse(contour: Contour): Contour {
  const points = [contour.start, ...contour.segments.map((s) => s.to)];
  const segments = contour.segments
    .map((segment, i) => ('c1' in segment ? { c1: segment.c2, c2: segment.c1, to: points[i]! } : { to: points[i]! }))
    .reverse();
  return { start: points[points.length - 1]!, segments };
}

/** The elliptic arc from angle a to b (b > a), in cubics of 90 degrees at most, without its start point. */
function arcSegments(cx: number, cy: number, rx: number, ry: number, a: number, b: number): Contour['segments'] {
  const count = Math.max(1, Math.ceil((b - a) / 90 - 1e-9));
  const step = ((b - a) / count) * (Math.PI / 180);
  const k = (4 / 3) * Math.tan(step / 4);
  return Array.from({ length: count }, (_, i) => {
    const t0 = (a * Math.PI) / 180 + i * step;
    const t1 = t0 + step;
    const p0: Point = [cx + rx * Math.cos(t0), cy + ry * Math.sin(t0)];
    const p1: Point = [cx + rx * Math.cos(t1), cy + ry * Math.sin(t1)];
    return {
      c1: [p0[0] - k * rx * Math.sin(t0), p0[1] + k * ry * Math.cos(t0)] as Point,
      c2: [p1[0] + k * rx * Math.sin(t1), p1[1] - k * ry * Math.cos(t1)] as Point,
      to: p1,
    };
  });
}

function ellipse(cx: number, cy: number, rx: number, ry: number): Contour {
  return { start: [cx + rx, cy], segments: arcSegments(cx, cy, rx, ry, 0, 360) };
}

/** A band between two ellipses from one angle to another, its ends cut along the radius. */
function arc(s: Extract<Shape, { type: 'arc' }>): Contour {
  const to = s.to > s.from ? s.to : s.to + 360;
  const [irx, iry] = [s.rx - s.stroke, s.ry - (s.strokeY ?? s.stroke)];
  const inner = reverse({ start: point(s.cx, s.cy, irx, iry, s.from), segments: arcSegments(s.cx, s.cy, irx, iry, s.from, to) });
  return {
    start: point(s.cx, s.cy, s.rx, s.ry, s.from),
    segments: [...arcSegments(s.cx, s.cy, s.rx, s.ry, s.from, to), { to: inner.start }, ...inner.segments],
  };
}

/** Half the band wide, a disc at each end of an arc. */
function arcCaps(s: Extract<Shape, { type: 'arc' }>): Contour[] {
  const [sx, sy] = [s.stroke / 2, (s.strokeY ?? s.stroke) / 2];
  return [s.from, s.to].map((angle) => {
    const [cx, cy] = point(s.cx, s.cy, s.rx - sx, s.ry - sy, angle);
    return ellipse(cx, cy, sx, sy);
  });
}

function point(cx: number, cy: number, rx: number, ry: number, degrees: number): Point {
  const t = (degrees * Math.PI) / 180;
  return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)];
}

/**
 * A stroke of `width` from one point to another. Square ends by default; flat ends are horizontal, to sit on a line;
 * round ends are half discs past each point.
 */
function line(s: Extract<Shape, { type: 'line' }>): Contour[] {
  const [dx, dy] = [s.x2 - s.x1, s.y2 - s.y1];
  const length = Math.hypot(dx, dy);
  if (length === 0) throw new FontError('bad_shape', 'A line needs two different points.');
  if (s.ends === 'flat' && Math.abs(dy) > 1e-6) {
    const h = (s.width * length) / (2 * Math.abs(dy));
    return [polygon([[s.x1 - h, s.y1], [s.x1 + h, s.y1], [s.x2 + h, s.y2], [s.x2 - h, s.y2]])];
  }
  const [nx, ny] = [(-dy / length) * (s.width / 2), (dx / length) * (s.width / 2)];
  const body = polygon([[s.x1 - nx, s.y1 - ny], [s.x2 - nx, s.y2 - ny], [s.x2 + nx, s.y2 + ny], [s.x1 + nx, s.y1 + ny]]);
  if (s.ends !== 'round') return [body];
  const r = s.width / 2;
  return [body, ellipse(s.x1, s.y1, r, r), ellipse(s.x2, s.y2, r, r)];
}

/** Every number of the shape is finite, and a band is thinner than its ellipse. */
function check(shape: Shape): void {
  const numbers = Object.entries(shape).filter(([key]) => key !== 'type' && key !== 'hole' && key !== 'ends' && key !== 'points');
  if (numbers.some(([, value]) => typeof value !== 'number' || !Number.isFinite(value))) throw new FontError('bad_shape', `A ${shape.type} takes numbers: ${numbers.map(([key]) => key).join(', ')}.`);
  const ends = (shape as { ends?: unknown }).ends;
  if (ends !== undefined && !['square', 'flat', 'round'].includes(ends as string)) throw new FontError('bad_shape', 'ends is "square", "flat" or "round" for a line, "round" for an arc.');
  if ((shape.type === 'ring' || shape.type === 'arc') && !(shape.stroke > 0 && shape.stroke < shape.rx && (shape.strokeY ?? shape.stroke) > 0 && (shape.strokeY ?? shape.stroke) < shape.ry)) {
    throw new FontError('bad_shape', `The stroke of a ${shape.type} is more than 0 and less than its radii.`);
  }
}

function contoursOf(shape: Shape): Contour[] {
  check(shape);
  switch (shape.type) {
    case 'rect':
      return [polygon([[shape.x, shape.y], [shape.x + shape.w, shape.y], [shape.x + shape.w, shape.y + shape.h], [shape.x, shape.y + shape.h]])];
    case 'ellipse':
      return [ellipse(shape.cx, shape.cy, shape.rx, shape.ry)];
    case 'ring': {
      const inner = ellipse(shape.cx, shape.cy, shape.rx - shape.stroke, shape.ry - (shape.strokeY ?? shape.stroke));
      return [ellipse(shape.cx, shape.cy, shape.rx, shape.ry), reverse(inner)];
    }
    case 'arc':
      return [arc(shape), ...(shape.ends === 'round' ? arcCaps(shape) : [])];
    case 'line':
      return line(shape);
    case 'polygon':
      if (!Array.isArray(shape.points) || shape.points.length < 3) throw new FontError('bad_shape', 'A polygon has three points or more.');
      return [polygon(shape.points)];
    default:
      throw new FontError('bad_shape', `Unknown shape "${(shape as { type: unknown }).type}". Shapes: ${SHAPE_TYPES.join(', ')}.`);
  }
}

function toCommands(contour: Contour): Command[] {
  const segments = contour.segments.map((s): Command => ('c1' in s ? { type: 'C', x1: s.c1[0], y1: s.c1[1], x2: s.c2[0], y2: s.c2[1], x: s.to[0], y: s.to[1] } : { type: 'L', x: s.to[0], y: s.to[1] }));
  return [{ type: 'M', x: contour.start[0], y: contour.start[1] }, ...segments, { type: 'Z' }];
}

/** Path data of the shapes, each turned the right way. A ring or a filled shape keeps its own hole. */
export function shapesPath(shapes: Shape[]): string {
  const commands = shapes.flatMap((shape) => {
    const found = contoursOf(shape);
    // A ring is an outside and its hole, turned as a pair; every other contour is an outside of its own.
    const turned = shape.type === 'ring' ? (turn(found[0]!) < 0 ? found.map(reverse) : found) : found.map((contour) => (turn(contour) < 0 ? reverse(contour) : contour));
    return turned.flatMap((contour) => toCommands(shape.hole ? reverse(contour) : contour));
  });
  // Font files hold whole units.
  return writePath(commands.map((c): Command => (c.type === 'Z' ? c : (Object.fromEntries(Object.entries(c).map(([key, value]) => [key, typeof value === 'number' ? Math.round(value) : value])) as Command))));
}
