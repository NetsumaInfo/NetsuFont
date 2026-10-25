import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { FontDoc } from '@netsufont/core';

interface FontListProps {
  fonts: FontDoc[];
  current?: string;
  onSelect(font: string): void;
}

/** The fonts of the folder: the family as a font menu shows it, the id the agent uses, and the glyph count. */
export function FontList({ fonts, current, onSelect }: FontListProps) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('list.title')} className="flex w-56 shrink-0 flex-col gap-1 overflow-auto rounded-panel bg-surface p-2">
      <h2 className="px-2 py-1 text-muted">{t('list.title')}</h2>
      {fonts.map((font) => (
        <button
          key={font.name}
          type="button"
          onClick={() => onSelect(font.name)}
          className={clsx('flex flex-col items-start gap-0.5 rounded-control px-2 py-1.5 text-left', font.name === current ? 'bg-accent' : 'hover:bg-surface-2')}
        >
          <span>
            {font.family} <span className="text-muted">{font.style}</span>
          </span>
          <span className="font-mono text-muted">
            {font.name} · {t('list.glyphs', { count: font.glyphs.length })}
          </span>
        </button>
      ))}
    </nav>
  );
}
