/// <reference types="react-scripts" />

import 'react-i18next';

declare module 'react-i18next' {
  export function useTranslation(
    ns?: string | readonly string[],
    options?: { keyPrefix?: string }
  ): {
    t: (key: string | string[], options?: Record<string, unknown> | string) => string;
    // i18next 26 타입과 TS 4.9 조합에서 메서드 누락이 있어 런타임 인스턴스로 둡니다.
    i18n: import('i18next').i18n;
    ready: boolean;
  };
}
