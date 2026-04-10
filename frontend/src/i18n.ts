import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from './locales/ko.json';
import en from './locales/en.json';

const STORAGE_KEY = 'gallerycrm-lang';

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
const initialLng = saved === 'en' || saved === 'ko' ? saved : 'ko';

void i18next.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
  },
  lng: initialLng,
  fallbackLng: 'ko',
  interpolation: { escapeValue: false },
});

(i18next as unknown as { on: (ev: string, fn: (lng: string) => void) => void }).on('languageChanged', (lng) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lng);
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng.startsWith('en') ? 'en' : 'ko';
  }
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLng.startsWith('en') ? 'en' : 'ko';
}

export function setAppLanguage(lng: 'ko' | 'en'): void {
  const i18n = i18next as unknown as { changeLanguage: (lng: string) => Promise<unknown> };
  void i18n.changeLanguage(lng);
}

/** TypeScript 4.x + i18next 26 타입 정합 전까지 런타임 언어 코드 조회 */
export function getUiLanguageCode(): 'ko' | 'en' {
  const inst = i18next as { resolvedLanguage?: string; language?: string };
  const raw = inst.resolvedLanguage ?? inst.language ?? 'ko';
  return raw.startsWith('en') ? 'en' : 'ko';
}

export function getIntlLocale(): string {
  return getUiLanguageCode() === 'en' ? 'en-US' : 'ko-KR';
}

export default i18next;
