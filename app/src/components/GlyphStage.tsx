import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FontDoc, Glyph } from '@netsufont/core';
import { GlyphView } from './GlyphView';

interface GlyphStageProps {
  doc: FontDoc;
  glyph: Glyph;
  onBack(): void;
}

/** One glyph, large, on its lines, with its points if asked; and the glyph between its neighbours, as in a word. */
export function GlyphStage({ doc, glyph, onBack }: GlyphStageProps) {
  const { t } = useTranslation();
  const [points, setPoints] = useState(false);
  const around = ['H', 'n', 'o', 'O'].map((name) => doc.glyphs.find((g) => g.name === name)).filter((g): g is Glyph => g !== undefined && g.name !== glyph.name);
  const line = around.length === 0 ? [] : [around[0]!, glyph, ...around.slice(1, 3), glyph, around[0]!];
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} className="flex h-control items-center gap-1.5 rounded-control px-2 text-muted hover:bg-surface-2 hover:text-fg">
          <ArrowLeft aria-hidden className="size-3" />
          {t('stage.back')}
        </button>
        <span className="font-mono">{glyph.name}</span>
        <div className="flex-1" />
        <label className="flex items-center gap-1.5 text-muted">
          <input type="checkbox" checked={points} onChange={(event) => setPoints(event.target.checked)} />
          {t('stage.points')}
        </label>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-inner bg-bg p-4">
        <GlyphView doc={doc} glyph={glyph} points={points} className="h-full max-h-[32rem] w-full" />
      </div>
      {line.length > 0 && (
        <div className="flex h-24 items-end justify-center rounded-inner bg-paper-light p-2 text-ink-light" aria-label={t('stage.context')}>
          {line.map((g, index) => (
            <GlyphView key={index} doc={doc} glyph={g} guides={false} tight className="h-full" />
          ))}
        </div>
      )}
    </div>
  );
}
