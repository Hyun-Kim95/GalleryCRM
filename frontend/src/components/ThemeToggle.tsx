import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getStoredTheme, setTheme, type ThemeMode } from '../theme';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ThemeMode>(() => getStoredTheme());

  const pick = (next: ThemeMode) => {
    setMode(next);
    setTheme(next);
  };

  return (
    <div
      className={className ?? 'theme-toggle'}
      role="radiogroup"
      aria-label={t('theme.label')}
    >
      <div className="segmented segmented--loose">
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'light'}
          className={`segmented__btn${mode === 'light' ? ' segmented__btn--active' : ''}`}
          onClick={() => pick('light')}
        >
          {t('theme.light')}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'dark'}
          className={`segmented__btn${mode === 'dark' ? ' segmented__btn--active' : ''}`}
          onClick={() => pick('dark')}
        >
          {t('theme.dark')}
        </button>
      </div>
    </div>
  );
};
