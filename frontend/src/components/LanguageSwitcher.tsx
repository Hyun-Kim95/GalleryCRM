import React from 'react';
import { useTranslation } from 'react-i18next';
import { setAppLanguage, getUiLanguageCode } from '../i18n';

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation();
  const current = getUiLanguageCode();

  return (
    <div
      className={className ?? 'language-switcher'}
      role="radiogroup"
      aria-label={t('language.switcherLabel')}
    >
      <div className="segmented segmented--loose">
        <button
          type="button"
          role="radio"
          aria-checked={current === 'ko'}
          className={`segmented__btn${current === 'ko' ? ' segmented__btn--active' : ''}`}
          onClick={() => setAppLanguage('ko')}
        >
          {t('language.ko')}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={current === 'en'}
          className={`segmented__btn${current === 'en' ? ' segmented__btn--active' : ''}`}
          onClick={() => setAppLanguage('en')}
        >
          {t('language.en')}
        </button>
      </div>
    </div>
  );
};
