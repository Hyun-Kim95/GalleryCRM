/**
 * 역할 코드를 현재 언어 레이블로 변환합니다.
 * `t`는 react-i18next의 번역 함수입니다.
 */
export const getRoleLabel = (role: string | undefined | null, t: unknown): string => {
  if (!role) return '-';

  const tr = t as (key: string) => string;
  const key = `role.${role}`;
  const translated = tr(key);
  return translated === key ? role : translated;
};
