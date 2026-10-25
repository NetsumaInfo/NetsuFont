import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { layout, type FontDoc } from '@netsufont/core';
import { useFontFace } from '../lib/fontFace';

const SIZES = [96, 48, 24, 14];

/** Text the user types, set with the font compiled to a real OTF, at several sizes, on dark and on paper. */
export function TextProof({ doc }: { doc: FontDoc }) {
  const { t } = useTranslation();
  const [sample, setSample] = useState<string>(() => t('proof.sample'));
  const { family, error } = useFontFace(doc);
  const { missing } = layout(doc, sample.replace(/\n/g, ''));
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <textarea
        value={sample}
        onChange={(event) => setSample(event.target.value)}
        aria-label={t('proof.label')}
        rows={2}
        className="resize-none rounded-control border border-border bg-bg p-2 outline-none focus:border-primary"
      />
      <p className="text-muted">
        {error ? t('proof.error', { error }) : missing.length > 0 ? t('proof.missing', { chars: missing.join(' ') }) : t('proof.complete')}
      </p>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto rounded-inner bg-paper-light p-4 text-ink-light">
        {family &&
          SIZES.map((size) => (
            <div key={size} className="flex items-baseline gap-3">
              <span className="w-8 shrink-0 font-mono text-xs text-muted">{size}</span>
              <p style={{ fontFamily: `"${family}", monospace`, fontSize: size, lineHeight: 1.2 }} className="break-words whitespace-pre-wrap">
                {sample}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}
