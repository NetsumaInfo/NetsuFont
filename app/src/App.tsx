import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontList } from './components/FontList';
import { FontPanel } from './components/FontPanel';
import { GlyphGrid } from './components/GlyphGrid';
import { GlyphStage } from './components/GlyphStage';
import { ConnectHelp, Header } from './components/Header';
import { Segmented } from './components/Segmented';
import { TextProof } from './components/TextProof';
import { usePicked } from './lib/picked';
import { useFonts, type ServerStatus } from './lib/useFonts';

// A command is code, not prose: it is the same in every language.
const START = 'pnpm dev';

type View = 'glyphs' | 'text';

function Empty({ status, dir }: { status: ServerStatus; dir: string }) {
  const { t } = useTranslation();
  const offline = status === 'offline';
  return (
    <div className="flex flex-1 items-center justify-center rounded-panel bg-surface">
      <div className="flex max-w-lg flex-col gap-3 p-6">
        <h2 className="text-base font-semibold">{offline ? t('empty.offlineTitle') : t('empty.title')}</h2>
        {offline ? (
          <>
            <p className="text-muted">{t('empty.offlineBody')}</p>
            <code className="rounded-inner bg-bg p-3 font-mono select-all">{START}</code>
          </>
        ) : (
          <ConnectHelp dir={dir} />
        )}
      </div>
    </div>
  );
}

export function App() {
  const { t } = useTranslation();
  const { status, dir, language, fonts } = useFonts();
  const [picked, pick] = usePicked();
  const [view, setView] = useState<View>('glyphs');
  // The choice, found in what the folder holds now; when it is gone, the first font.
  const doc = fonts.find((font) => font.name === picked.font) ?? fonts[0];
  const glyph = doc?.glyphs.find((g) => g.name === picked.glyph);
  const current = { font: doc?.name, glyph: glyph?.name };

  return (
    <div className="flex h-full flex-col gap-2 p-2">
      <Header status={status} dir={dir} language={language} current={current} onSelect={pick} />
      {doc === undefined ? (
        <Empty status={status} dir={dir} />
      ) : (
        <main className="flex min-h-0 flex-1 gap-2">
          <FontList fonts={fonts} current={doc.name} onSelect={(font) => pick({ font })} />
          <section className="flex min-w-0 flex-1 flex-col gap-2 rounded-panel bg-surface p-3">
            {glyph ? (
              <GlyphStage doc={doc} glyph={glyph} onBack={() => pick({ font: doc.name })} />
            ) : (
              <>
                <Segmented<View>
                  label={t('view.label')}
                  choices={[
                    { value: 'glyphs', label: t('view.glyphs'), count: doc.glyphs.length },
                    { value: 'text', label: t('view.text') },
                  ]}
                  value={view}
                  onChange={setView}
                />
                {view === 'glyphs' ? <GlyphGrid doc={doc} onOpen={(name) => pick({ font: doc.name, glyph: name })} /> : <TextProof doc={doc} />}
              </>
            )}
          </section>
          <FontPanel doc={doc} glyph={glyph} />
        </main>
      )}
    </div>
  );
}
