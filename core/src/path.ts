import { FontError } from './types';

/** One command of an outline, absolute. Only lines and curves: H and V become L, relative becomes absolute. */
export type Command =
  | { type: 'M'; x: number; y: number }
  | { type: 'L'; x: number; y: number }
  | { type: 'Q'; x1: number; y1: number; x: number; y: number }
  | { type: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { type: 'Z' };

const ARITY: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, Q: 4, C: 6, Z: 0 };
const TOKEN = /([MLHVQCZmlhvqcz])|(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)/g;

function tokens(d: string): (string | number)[] {
  const rest = d.replace(TOKEN, '').replace(/[\s,]/g, '');
  if (rest !== '') throw new FontError('bad_path', `The path has something that is not a command M L H V Q C Z or a number: "${rest.slice(0, 20)}".`);
  return [...d.matchAll(TOKEN)].map((match) => match[1] ?? Number(match[2]));
}

interface Pen {
  x: number;
  y: number;
  startX: number;
  startY: number;
}

/** Draws one command with its numbers, already read, from where the pen is. */
function step(upper: string, relative: boolean, n: number[], pen: Pen): Command {
  const ax = (value: number): number => (relative ? pen.x + value : value);
  const ay = (value: number): number => (relative ? pen.y + value : value);
  let cmd: Command;
  if (upper === 'Z') {
    cmd = { type: 'Z' };
    pen.x = pen.startX;
    pen.y = pen.startY;
    return cmd;
  }
  if (upper === 'M') cmd = { type: 'M', x: ax(n[0]!), y: ay(n[1]!) };
  else if (upper === 'H') cmd = { type: 'L', x: ax(n[0]!), y: pen.y };
  else if (upper === 'V') cmd = { type: 'L', x: pen.x, y: ay(n[0]!) };
  else if (upper === 'L') cmd = { type: 'L', x: ax(n[0]!), y: ay(n[1]!) };
  else if (upper === 'Q') cmd = { type: 'Q', x1: ax(n[0]!), y1: ay(n[1]!), x: ax(n[2]!), y: ay(n[3]!) };
  else cmd = { type: 'C', x1: ax(n[0]!), y1: ay(n[1]!), x2: ax(n[2]!), y2: ay(n[3]!), x: ax(n[4]!), y: ay(n[5]!) };
  pen.x = cmd.x;
  pen.y = cmd.y;
  if (cmd.type === 'M') {
    pen.startX = cmd.x;
    pen.startY = cmd.y;
  }
  return cmd;
}

/** Reads SVG path data into absolute commands. Throws a `FontError` on anything else. */
export function parsePath(d: string): Command[] {
  const list = tokens(d);
  const out: Command[] = [];
  const pen: Pen = { x: 0, y: 0, startX: 0, startY: 0 };
  let letter = '';
  let index = 0;
  while (index < list.length) {
    const token = list[index];
    if (typeof token === 'string') {
      letter = token;
      index += 1;
    } else if (letter === '') {
      throw new FontError('bad_path', 'A number comes where a command is expected. A path starts with M, and Z takes no number.');
    }
    const upper = letter.toUpperCase();
    const count = ARITY[upper] ?? 0;
    const args = list.slice(index, index + count);
    if (args.length < count || args.some((arg) => typeof arg !== 'number')) throw new FontError('bad_path', `The command ${letter} needs ${count} numbers.`);
    if (upper !== 'M' && out.length === 0) throw new FontError('bad_path', 'A path starts with M.');
    index += count;
    out.push(step(upper, letter !== upper, args as number[], pen));
    // Numbers after a moveto are linetos, as in SVG; Z takes none.
    if (upper === 'M') letter = letter === 'M' ? 'L' : 'l';
    if (upper === 'Z') letter = '';
  }
  return out;
}

const round = (value: number): number => Math.round(value * 100) / 100;

/** Writes commands back as compact absolute path data. With `flip`, y is turned down, for SVG. */
export function writePath(commands: Command[], flip = false): string {
  const fy = (value: number): number => round(flip ? -value : value);
  return commands
    .map((c) => {
      if (c.type === 'Z') return 'Z';
      if (c.type === 'Q') return `Q${round(c.x1)} ${fy(c.y1)} ${round(c.x)} ${fy(c.y)}`;
      if (c.type === 'C') return `C${round(c.x1)} ${fy(c.y1)} ${round(c.x2)} ${fy(c.y2)} ${round(c.x)} ${fy(c.y)}`;
      return `${c.type}${round(c.x)} ${fy(c.y)}`;
    })
    .join('');
}

/** Applies x' = a·x + c·y + e, y' = b·x + d·y + f to every point. */
export function transformPath(commands: Command[], [a, b, c, d, e, f]: readonly number[]): Command[] {
  const px = (x: number, y: number): number => a! * x + c! * y + e!;
  const py = (x: number, y: number): number => b! * x + d! * y + f!;
  return commands.map((cmd): Command => {
    if (cmd.type === 'Z') return cmd;
    if (cmd.type === 'Q') return { type: 'Q', x1: px(cmd.x1, cmd.y1), y1: py(cmd.x1, cmd.y1), x: px(cmd.x, cmd.y), y: py(cmd.x, cmd.y) };
    if (cmd.type === 'C') return { type: 'C', x1: px(cmd.x1, cmd.y1), y1: py(cmd.x1, cmd.y1), x2: px(cmd.x2, cmd.y2), y2: py(cmd.x2, cmd.y2), x: px(cmd.x, cmd.y), y: py(cmd.x, cmd.y) };
    return { type: cmd.type, x: px(cmd.x, cmd.y), y: py(cmd.x, cmd.y) };
  });
}

export interface Box {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
}

/** The values of a cubic Bézier, in one axis, at its ends and where it turns. */
function cubicExtremes(p0: number, p1: number, p2: number, p3: number): number[] {
  // The derivative is a quadratic a·t² + b·t + c.
  const a = -p0 + 3 * p1 - 3 * p2 + p3;
  const b = 2 * (p0 - 2 * p1 + p2);
  const c = p1 - p0;
  const roots = Math.abs(a) < 1e-9 ? (Math.abs(b) < 1e-9 ? [] : [-c / b]) : quadraticRoots(a, b, c);
  const at = (t: number): number => (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3;
  return [p0, p3, ...roots.filter((t) => t > 0 && t < 1).map(at)];
}

function quadraticRoots(a: number, b: number, c: number): number[] {
  const delta = b * b - 4 * a * c;
  if (delta < 0) return [];
  const root = Math.sqrt(delta);
  return [(-b + root) / (2 * a), (-b - root) / (2 * a)];
}

/** The box of the ink: the curves themselves, not their handles. Undefined for no point. */
export function bounds(commands: Command[]): Box | undefined {
  const xs: number[] = [];
  const ys: number[] = [];
  let [x, y] = [0, 0];
  for (const c of commands) {
    if (c.type === 'Z') continue;
    if (c.type === 'Q') {
      // A quadratic is the cubic with handles two thirds of the way to its control point.
      xs.push(...cubicExtremes(x, x + (2 / 3) * (c.x1 - x), c.x + (2 / 3) * (c.x1 - c.x), c.x));
      ys.push(...cubicExtremes(y, y + (2 / 3) * (c.y1 - y), c.y + (2 / 3) * (c.y1 - c.y), c.y));
    } else if (c.type === 'C') {
      xs.push(...cubicExtremes(x, c.x1, c.x2, c.x));
      ys.push(...cubicExtremes(y, c.y1, c.y2, c.y));
    } else {
      xs.push(c.x);
      ys.push(c.y);
    }
    [x, y] = [c.x, c.y];
  }
  if (xs.length === 0) return undefined;
  const r = (value: number): number => Math.round(value * 100) / 100;
  return { xMin: r(Math.min(...xs)), yMin: r(Math.min(...ys)), xMax: r(Math.max(...xs)), yMax: r(Math.max(...ys)) };
}
