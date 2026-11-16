import clsx from 'clsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FontDoc } from '@netsufont/core';
import { GlyphView } from './GlyphView';

interface GlyphGridProps {
  doc: FontDoc;
  onOpen(glyph: string): void;
}

/** How many cells are drawn at first: a Chinese font has thousands of glyphs, each an SVG. */
const PAGE = 240;

/** Every glyph of the font in a cell, its name under it. A filter keeps those whose name or character matches. */
export function GlyphGrid({ doc, onOpen }: GlyphGridProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const shown = doc.glyphs.filter((glyph) => filter === '' || glyph.name.toLowerCase().includes(filter.toLowerCase()) || (glyph.unicode !== undefined && filter.includes(String.fromCodePoint(glyph.unicode))));
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <input
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder={t('grid.filter')}
        aria-label={t('grid.filter')}
        className="h-control w-64 rounded-control border border-border bg-bg px-2 outline-none focus:border-primary"
      />
      {shown.length === 0 ? (
        <p className="text-muted">{t('grid.none')}</p>
      ) : (
        <div className="grid min-h-0 grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] content-start gap-1 overflow-auto">
          {shown.slice(0, limit).map((glyph) => (
            <button
              key={glyph.name}
              type="button"
              onClick={() => onOpen(glyph.name)}
              title={glyph.name}
              className={clsx('flex flex-col items-center gap-1 rounded-inner bg-bg p-1 text-fg hover:bg-surface-2')}
            >
              <GlyphView doc={doc} glyph={glyph} className="h-20 w-full" />
              <span className="w-full truncate font-mono text-muted">{glyph.name}</span>
            </button>
          ))}
          {shown.length > limit && (
            <button type="button" onClick={() => setLimit((now) => now + PAGE * 4)} className="col-span-full rounded-inner bg-bg p-2 text-muted hover:text-fg">
              {t('grid.more', { count: shown.length - limit })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
