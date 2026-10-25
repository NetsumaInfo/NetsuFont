import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { coverage, languageCoverage, sideBearings, type FontDoc, type Glyph } from '@netsufont/core';
import { CopyButton } from './CopyButton';

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function GlyphInfo({ doc, glyph }: { doc: FontDoc; glyph: Glyph }) {
  const { t } = useTranslation();
  const bearings = sideBearings(doc, glyph);
  const code = glyph.unicode === undefined ? '—' : `U+${glyph.unicode.toString(16).toUpperCase().padStart(4, '0')}`;
  return (
    <Section title={t('panel.glyph')}>
      <Row label={t('panel.name')} value={glyph.name} />
      <Row label={t('panel.unicode')} value={code} />
      <Row label={t('panel.advance')} value={glyph.advance} />
      <Row label={t('panel.bearings')} value={bearings ? `${bearings.left} · ${bearings.right}` : t('panel.empty')} />
      {glyph.components?.map((part) => <Row key={part.glyph} label={t('panel.component')} value={`${part.glyph} (${part.x}, ${part.y})`} />)}
      {glyph.path !== '' && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-muted">{t('panel.path')}</span>
            <CopyButton text={glyph.path} bare />
          </div>
          <code className="max-h-40 overflow-auto rounded-inner bg-bg p-2 font-mono break-all">{glyph.path}</code>
        </div>
      )}
    </Section>
  );
}

/** Each language by its name in the app's language, with how much of it the font draws. */
function Languages({ doc }: { doc: FontDoc }) {
  const { t, i18n } = useTranslation();
  const names = new Intl.DisplayNames([i18n.language], { type: 'language' });
  const all = languageCoverage(doc).sort((a, b) => b.has / b.of - a.has / a.of);
  return (
    <Section title={t('panel.languages')}>
      {all.map(({ code, has, of, missing }) => (
        <div key={code} title={missing.length > 0 ? t('panel.missing', { chars: missing.join(' ') }) : undefined}>
          <Row label={`${names.of(code) ?? code} · ${code}`} value={has === of ? '✓' : `${has}/${of}`} />
        </div>
      ))}
    </Section>
  );
}

/** What the font is: its names, its lines, what it covers and its kerning; and, when one is open, the glyph. */
export function FontPanel({ doc, glyph }: { doc: FontDoc; glyph?: Glyph }) {
  const { t } = useTranslation();
  const { ascender, descender, capHeight, xHeight } = doc.metrics;
  return (
    <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-auto rounded-panel bg-surface p-3">
      {glyph && <GlyphInfo doc={doc} glyph={glyph} />}
      <Section title={t('panel.font')}>
        <Row label={t('panel.family')} value={doc.family} />
        <Row label={t('panel.style')} value={doc.style} />
        <Row label={t('panel.id')} value={doc.name} />
        <Row label={t('panel.em')} value={doc.unitsPerEm} />
      </Section>
      {/* The names of the metrics are those of the format: the agent uses them. */}
      <Section title={t('panel.metrics')}>
        <Row label="ascender" value={ascender} />
        <Row label="capHeight" value={capHeight} />
        <Row label="xHeight" value={xHeight} />
        <Row label="descender" value={descender} />
      </Section>
      <Section title={t('panel.coverage')}>
        {coverage(doc).map(({ set, has, of, missing }) => (
          <div key={set} className="flex flex-col gap-1" title={missing ? t('panel.missing', { chars: missing }) : undefined}>
            <Row label={t(`charset.${set}`)} value={`${has}/${of}`} />
            <div className="h-1 rounded-control bg-bg">
              <div className="h-1 rounded-control bg-primary" style={{ width: `${(has / of) * 100}%` }} />
            </div>
          </div>
        ))}
      </Section>
      <Languages doc={doc} />
      <Section title={t('panel.kerning', { count: doc.kerning.length })}>
        {doc.kerning.slice(0, 40).map((kern) => (
          <Row key={`${kern.left} ${kern.right}`} label={`${kern.left} ${kern.right}`} value={kern.value} />
        ))}
      </Section>
    </aside>
  );
}
