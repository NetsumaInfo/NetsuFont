import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { layout, optionalFeatures, type FontDoc } from '@netsufont/core';
import { useFontFace } from '../lib/fontFace';
import { SAMPLES } from '../lib/samples';

const SIZES = [96, 48, 24, 14];

/** The optional features of the font, as buttons that turn each one on or off. Feature tags are ids: monospace. */
function FeatureToggles({ available, on, toggle }: { available: string[]; on: string[]; toggle(feature: string): void }) {
  const { t } = useTranslation();
  if (available.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('proof.features')}>
      <span className="mr-1 text-muted">{t('proof.features')}</span>
      {available.map((feature) => (
        <button
          key={feature}
          type="button"
          aria-pressed={on.includes(feature)}
          onClick={() => toggle(feature)}
          className={clsx('rounded-control border px-2 py-0.5 font-mono text-xs', on.includes(feature) ? 'border-primary bg-primary text-primary-fg' : 'border-border text-muted hover:text-fg')}
        >
          {feature}
        </button>
      ))}
    </div>
  );
}

/** A menu of sample texts, one per language, named in the app's language. */
function SamplePicker({ onPick }: { onPick(text: string): void }) {
  const { t, i18n } = useTranslation();
  const names = new Intl.DisplayNames([i18n.language], { type: 'language' });
  return (
    <select
      aria-label={t('proof.samples')}
      value=""
      onChange={(event) => event.target.value && onPick(SAMPLES[event.target.value]!)}
      className="rounded-control border border-border bg-bg px-2 py-1 text-muted"
    >
      <option value="">{t('proof.samples')}</option>
      {Object.keys(SAMPLES).map((code) => (
        <option key={code} value={code}>
          {names.of(code) ?? code} · {code}
        </option>
      ))}
    </select>
  );
}

/**
 * Text the user types, set with the font compiled to a real OTF, at several sizes, on paper. The browser sets each
 * line in its own direction: Hebrew and Arabic right to left, with the font's joining forms and ligatures.
 */
export function TextProof({ doc }: { doc: FontDoc }) {
  const { t } = useTranslation();
  const [sample, setSample] = useState<string>(() => t('proof.sample'));
  const [features, setFeatures] = useState<string[]>([]);
  const { family, error } = useFontFace(doc);
  const available = optionalFeatures(doc);
  const on = features.filter((feature) => available.includes(feature));
  const { missing } = layout(doc, sample.replace(/\n/g, ''));
  const toggle = (feature: string) => setFeatures((now) => (now.includes(feature) ? now.filter((f) => f !== feature) : [...now, feature]));
  const settings = on.map((feature) => `"${feature}" 1`).join(', ') || 'normal';
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <textarea
        value={sample}
        dir="auto"
        onChange={(event) => setSample(event.target.value)}
        aria-label={t('proof.label')}
        rows={2}
        className="resize-none rounded-control border border-border bg-bg p-2 outline-none focus:border-primary"
      />
      <div className="flex flex-wrap items-center gap-3">
        <SamplePicker onPick={setSample} />
        <FeatureToggles available={available} on={on} toggle={toggle} />
      </div>
      <p className="text-muted">
        {error ? t('proof.error', { error }) : missing.length > 0 ? t('proof.missing', { chars: missing.join(' ') }) : t('proof.complete')}
      </p>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto rounded-inner bg-paper-light p-4 text-ink-light">
        {family &&
          SIZES.map((size) => (
            <div key={size} className="flex items-baseline gap-3">
              <span className="w-8 shrink-0 font-mono text-xs text-muted">{size}</span>
              <div style={{ fontFamily: `"${family}", monospace`, fontSize: size, lineHeight: 1.4, fontFeatureSettings: settings }} className="min-w-0 flex-1 break-words whitespace-pre-wrap">
                {sample.split('\n').map((line, index) => (
                  <p key={index} dir="auto">
                    {line || ' '}
                  </p>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
