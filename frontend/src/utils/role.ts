/**
 * 역할 코드를 한글 레이블로 변환하는 유틸리티 함수
 */
export const getRoleLabel = (role: string | undefined | null): string => {
  if (!role) return '-';
  
  switch (role) {
    case 'MASTER':
      return '관리자';
    case 'ADMIN':
      return '관리자';
    case 'MANAGER':
      return '팀장';
    case 'STAFF':
      return '사원';
    default:
      return role;
  }
};

