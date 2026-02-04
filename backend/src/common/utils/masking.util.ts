/**
 * 데이터 마스킹 유틸리티
 * PRD 요구사항에 따른 마스킹 규칙 적용
 */

export enum MaskingLevel {
  NONE = 'NONE', // 마스킹 없음
  PARTIAL = 'PARTIAL', // 부분 마스킹 (팀 데이터)
  FULL = 'FULL', // 전체 마스킹 (타 팀 데이터)
}

/**
 * 이름 마스킹
 * 예: "홍길동" -> "홍*동" (PARTIAL), "***" (FULL)
 */
export function maskName(name: string | null, level: MaskingLevel): string {
  if (!name) return '';
  if (level === MaskingLevel.NONE) return name;
  if (level === MaskingLevel.FULL) return '***';

  // PARTIAL: 첫 글자와 마지막 글자만 표시
  if (name.length <= 2) return '*'.repeat(name.length);
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

/**
 * 이메일 마스킹
 * 예: "test@example.com" -> "t***@example.com" (PARTIAL), "***@***.***" (FULL)
 */
export function maskEmail(email: string | null, level: MaskingLevel): string {
  if (!email) return '';
  if (level === MaskingLevel.NONE) return email;
  if (level === MaskingLevel.FULL) return '***@***.***';

  // PARTIAL: @ 앞의 첫 글자만 표시
  const [localPart, domain] = email.split('@');
  if (!domain) return '***@***.***';
  const maskedLocal = localPart[0] + '*'.repeat(Math.max(0, localPart.length - 1));
  return `${maskedLocal}@${domain}`;
}

/**
 * 전화번호 마스킹
 * 예: "010-1234-5678" -> "010-****-5678" (PARTIAL), "***-****-****" (FULL)
 */
export function maskPhone(phone: string | null, level: MaskingLevel): string {
  if (!phone) return '';
  if (level === MaskingLevel.NONE) return phone;
  if (level === MaskingLevel.FULL) return '***-****-****';

  // PARTIAL: 중간 4자리만 마스킹
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length < 8) return '***-****-****';
  
  if (cleaned.length === 11) {
    // 010-1234-5678 형식
    return `${cleaned.substring(0, 3)}-****-${cleaned.substring(7)}`;
  } else if (cleaned.length === 10) {
    // 010-123-4567 형식
    return `${cleaned.substring(0, 3)}-***-${cleaned.substring(6)}`;
  }
  return '***-****-****';
}

/**
 * 금액 마스킹
 * 예: 1000000 -> "1,000,000원" (NONE), "1,***,***원" (PARTIAL), "***원" (FULL)
 */
export function maskAmount(
  amount: number | null,
  currency: string = 'KRW',
  level: MaskingLevel,
): string {
  if (amount === null || amount === undefined) return '';
  if (level === MaskingLevel.NONE) {
    return new Intl.NumberFormat('ko-KR').format(amount) + (currency === 'KRW' ? '원' : currency);
  }
  if (level === MaskingLevel.FULL) {
    return '***' + (currency === 'KRW' ? '원' : currency);
  }

  // PARTIAL: 일부 숫자만 표시
  const formatted = new Intl.NumberFormat('ko-KR').format(amount);
  const parts = formatted.split(',');
  if (parts.length > 1) {
    return parts[0] + ',' + '*'.repeat(parts.slice(1).join(',').length) + (currency === 'KRW' ? '원' : currency);
  }
  return '***' + (currency === 'KRW' ? '원' : currency);
}

/**
 * 텍스트 마스킹 (주소, 계약 조건 등)
 */
export function maskText(text: string | null, level: MaskingLevel): string {
  if (!text) return '';
  if (level === MaskingLevel.NONE) return text;
  if (level === MaskingLevel.FULL) return '***';

  // PARTIAL: 앞부분 일부만 표시
  if (text.length <= 5) return '*'.repeat(text.length);
  return text.substring(0, 3) + '*'.repeat(Math.min(text.length - 3, 10));
}



