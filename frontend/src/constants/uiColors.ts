/**
 * TSX 인라인 스타일용 — index.css 의 테마 변수와 동기화
 */
export const uiColor = {
  textPrimary: 'var(--text-primary)',
  textMuted: 'var(--text-muted)',
  foreground: 'var(--foreground)',
  link: 'var(--link)',
  primary: 'var(--primary)',
  primaryFg: 'var(--primary-foreground)',
  muted: 'var(--muted)',
  mutedFg: 'var(--muted-foreground)',
  border: 'var(--border-default)',
  destructive: 'var(--destructive)',
  destructiveFg: 'var(--destructive-foreground)',
  errorBg: 'var(--error-bg)',
  errorText: 'var(--error-text)',
  errorBorder: 'var(--error-border)',
  infoBg: 'var(--info-bg)',
  infoText: 'var(--info-text)',
  warningBg: 'var(--badge-warning-bg)',
  warningText: 'var(--badge-warning-text)',
  card: 'var(--card)',
  chart2: 'var(--chart-2)',
  chart3: 'var(--chart-3)',
  chart4: 'var(--chart-4)',
  chart5: 'var(--chart-5)',
  indicatorActive: 'var(--indicator-active)',
  indicatorInactive: 'var(--indicator-inactive)',
} as const;

/** 고객/작가/거래 등 상태 뱃지 (배경·글자 대비) */
export function entityStatusBadgeStyle(
  status: string
): { backgroundColor: string; color: string } {
  switch (status) {
    case 'DRAFT':
      return { backgroundColor: uiColor.muted, color: uiColor.mutedFg };
    case 'PENDING':
      return { backgroundColor: uiColor.primary, color: uiColor.primaryFg };
    case 'APPROVED':
      return { backgroundColor: uiColor.chart2, color: uiColor.primaryFg };
    case 'REJECTED':
      return { backgroundColor: uiColor.destructive, color: uiColor.destructiveFg };
    default:
      return { backgroundColor: uiColor.muted, color: uiColor.foreground };
  }
}

export function auditActionBadgeStyle(
  action: string
): { backgroundColor: string; color: string } {
  switch (action) {
    case 'CREATE':
    case 'APPROVE':
      return { backgroundColor: uiColor.chart2, color: uiColor.primaryFg };
    case 'UPDATE':
      return { backgroundColor: uiColor.chart3, color: uiColor.primaryFg };
    case 'DELETE':
    case 'REJECT':
      return { backgroundColor: uiColor.destructive, color: uiColor.destructiveFg };
    case 'VIEW':
      return { backgroundColor: uiColor.muted, color: uiColor.mutedFg };
    case 'ACCESS_REQUEST':
      return { backgroundColor: uiColor.chart4, color: uiColor.primaryFg };
    default:
      return { backgroundColor: uiColor.muted, color: uiColor.foreground };
  }
}

export function accessRequestBadgeStyle(
  status: string
): { backgroundColor: string; color: string } {
  switch (status) {
    case 'PENDING':
      return { backgroundColor: uiColor.primary, color: uiColor.primaryFg };
    case 'APPROVED':
      return { backgroundColor: uiColor.chart2, color: uiColor.primaryFg };
    case 'REJECTED':
      return { backgroundColor: uiColor.destructive, color: uiColor.destructiveFg };
    default:
      return { backgroundColor: uiColor.muted, color: uiColor.foreground };
  }
}
