/**
 * 안전하게 날짜를 포맷팅하는 유틸리티 함수들
 */

/**
 * 날짜 문자열이나 Date 객체를 안전하게 파싱
 */
function parseDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof date === 'string') {
    if (date.trim() === '') return null;
    // ISO 8601 형식 또는 다른 날짜 형식 파싱 시도
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      // 파싱 실패 시 디버깅 로그
      console.warn('날짜 파싱 실패:', date);
      return null;
    }
    return parsed;
  }
  return null;
}

/**
 * 날짜를 한국어 형식으로 포맷팅 (YYYY. MM. DD)
 */
export function formatDate(date: string | Date | null | undefined): string {
  const parsed = parseDate(date);
  if (!parsed) return '-';
  return parsed.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 날짜와 시간을 한국어 형식으로 포맷팅 (YYYY. MM. DD HH:mm:ss)
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  const parsed = parseDate(date);
  if (!parsed) return '-';
  return parsed.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * 날짜를 간단한 형식으로 포맷팅 (YYYY-MM-DD)
 */
export function formatDateSimple(date: string | Date | null | undefined): string {
  const parsed = parseDate(date);
  if (!parsed) return '-';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

