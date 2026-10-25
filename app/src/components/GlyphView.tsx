import { glyphPath, type FontDoc, type Glyph } from '@netsufont/core';

interface GlyphViewProps {
  doc: FontDoc;
  glyph: Glyph;
  /** Draw the metric lines and the advance. */
  guides?: boolean;
  /** Mark the points of the outline. */
  points?: boolean;
  /** Exactly as wide as the advance: glyphs side by side then sit as in a line of text. */
  tight?: boolean;
  className?: string;
}

/** The ends of the segments of an outline in SVG path data, y already turned down. */
function ends(d: string): [number, number][] {
  return [...d.matchAll(/[MLQC]([^MLQCZ]+)/g)].map((match) => {
    const numbers = match[1]!.trim().split(/[\s,]+/).map(Number);
    return [numbers[numbers.length - 2]!, numbers[numbers.length - 1]!];
  });
}

/** One glyph in its em, with its metric lines: the cell of the grid and the large view are the same drawing. */
export function GlyphView({ doc, glyph, guides = true, points = false, tight = false, className }: GlyphViewProps) {
  const { ascender, descender, capHeight, xHeight } = doc.metrics;
  const em = doc.unitsPerEm;
  const margin = em * 0.1;
  const top = Math.max(ascender, capHeight) + margin;
  const bottom = -descender + margin;
  const width = tight ? Math.max(1, glyph.advance) : Math.max(em * 0.8, glyph.advance + margin * 4);
  const left = tight ? 0 : (width - glyph.advance) / 2;
  const d = glyphPath(doc, glyph);
  const thin = em / 400;
  return (
    <svg viewBox={`${-left} ${-top} ${width} ${top + bottom}`} className={className} aria-label={glyph.name}>
      {guides && (
        <g stroke="var(--color-border)" strokeWidth={thin}>
          {[xHeight, capHeight, ascender, descender].map((y, index) => (
            <line key={index}x1={-left} x2={width - left} y1={-y} y2={-y} />
          ))}
          <line x1={-left} x2={width - left} y1={0} y2={0} stroke="var(--color-border-strong)" />
          <line x1={0} x2={0} y1={-top} y2={bottom} />
          <line x1={glyph.advance} x2={glyph.advance} y1={-top} y2={bottom} />
        </g>
      )}
      <path d={d} fill="currentColor" />
      {points && ends(d).map(([x, y], index) => <circle key={index} cx={x} cy={y} r={em / 120} fill="var(--color-primary)" />)}
    </svg>
  );
}
