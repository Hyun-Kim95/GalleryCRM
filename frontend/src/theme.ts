export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'gallerycrm-theme';

export function getStoredTheme(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'light';
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'dark' ? 'dark' : 'light';
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', mode);
  document.documentElement.classList.toggle('dark', mode === 'dark');
  document.documentElement.style.colorScheme = mode === 'dark' ? 'dark' : 'light';
}

export function setTheme(mode: ThemeMode): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, mode);
  }
  applyTheme(mode);
}

export function initTheme(): void {
  applyTheme(getStoredTheme());
}
