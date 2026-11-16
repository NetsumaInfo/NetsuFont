import { useEffect, useState } from 'react';
import type { FontDoc } from '@netsufont/core';
import i18n from '../i18n';
import { watchFolder } from './events';

/** The languages the app speaks; the server keeps which one is chosen. */
export const LANGUAGES = ['en', 'fr'] as const;
export type Language = (typeof LANGUAGES)[number];

/** Asks the server for another language. The app follows when the server says the folder changed. */
export async function chooseLanguage(language: Language): Promise<void> {
  await fetch('/api/language', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ language }) });
}

export type ServerStatus = 'connecting' | 'online' | 'offline';

/** A font in the list: enough to name it. The font itself is fetched when it is shown. */
export interface FontSummary {
  name: string;
  family: string;
  style: string;
  glyphs: number;
  /** When its file was last written: a new value means the font changed. */
  modified: number;
}

interface Listing {
  dir: string;
  /** The language chosen for the app, by its user or by the agent. */
  language: Language;
  fonts: FontSummary[];
}

export interface Fonts extends Listing {
  status: ServerStatus;
}

/** The fonts of the folder, kept up to date: the server says when a file changed, the list is read again. */
export function useFonts(): Fonts {
  const [state, setState] = useState<Fonts>({ status: 'connecting', dir: '', language: 'en', fonts: [] });

  useEffect(() => {
    void i18n.changeLanguage(state.language);
    document.documentElement.lang = state.language;
  }, [state.language]);

  useEffect(() => {
    let alive = true;
    const load = async (): Promise<void> => {
      try {
        const response = await fetch('/api/fonts');
        if (!response.ok) throw new Error(String(response.status));
        const listing = (await response.json()) as Listing;
        if (alive) setState({ status: 'online', ...listing });
      } catch {
        if (alive) setState((previous) => ({ ...previous, status: 'offline' }));
      }
    };
    const stop = watchFolder(
      () => void load(),
      () => setState((previous) => ({ ...previous, status: 'offline' })),
    );
    return () => {
      alive = false;
      stop();
    };
  }, []);

  return state;
}

/** The font shown, fetched whole when it is picked and again when its file changes; the last one meanwhile. */
export function useFontDoc(summary: FontSummary | undefined): FontDoc | undefined {
  const [doc, setDoc] = useState<FontDoc>();
  const name = summary?.name;
  const modified = summary?.modified;
  useEffect(() => {
    if (name === undefined) return;
    let alive = true;
    void fetch(`/api/fonts/${encodeURIComponent(name)}`)
      .then((response) => (response.ok ? (response.json() as Promise<FontDoc>) : undefined))
      .then((font) => alive && font && setDoc(font));
    return () => {
      alive = false;
    };
  }, [name, modified]);
  // A font of another name stays out: while the picked one loads, nothing of the old one is drawn as it.
  return doc?.name === name ? doc : undefined;
}
