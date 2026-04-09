import { getIntlLocale } from '../i18n';

/** 금액 표시 (마스킹된 문자열이면 그대로 반환) */
export function formatMoneyAmount(amount: number | string, currency: string = 'KRW'): string {
  if (typeof amount === 'string') {
    return amount;
  }
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return `0 ${currency}`;
  }
  const formatted = new Intl.NumberFormat(getIntlLocale()).format(amount);
  return `${formatted} ${currency}`;
}
