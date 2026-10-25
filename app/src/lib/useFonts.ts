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

interface Listing {
  dir: string;
  /** The language chosen for the app, by its user or by the agent. */
  language: Language;
  fonts: FontDoc[];
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
