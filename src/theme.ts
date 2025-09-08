export const theme = {
  colors: {
    primary: '#133E87',      // Deep Navy Blue - 메인 색상
    primaryLight: '#608BC1', // Soft Blue - 밝은 메인 색상
    primaryDark: '#0D2A5F',  // 더 어두운 네이비 (primary에서 어둡게)
    secondary: '#CBDCEB',    // Pale Blue/Periwinkle - 보조 색상
    secondaryLight: '#E8F4FF', // 매우 밝은 블루 (secondary에서 밝게)
    accent: '#608BC1',       // Soft Blue - 액센트 색상
    text: '#133E87',         // Deep Navy Blue - 텍스트
    textLight: '#608BC1',    // Soft Blue - 연한 텍스트
    background: '#F3F3E0',   // Light Beige/Cream - 배경
    cardBg: '#FFFFFF',       // 카드 배경 (순백)
    error: '#FF6B6B',        // 에러 색상 (살짝 부드러운 빨강)
    success: '#608BC1',      // 성공 색상 (Soft Blue)
  },
  fonts: {
    main: '"Noto Sans KR", sans-serif',
  },
  breakpoints: {
    mobile: '576px',
    tablet: '768px',
    desktop: '1024px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  shadows: {
    small: '0 1px 3px rgba(19, 62, 135, 0.08)',
    medium: '0 4px 12px rgba(19, 62, 135, 0.12)',
    large: '0 8px 24px rgba(19, 62, 135, 0.16)',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    round: '50%',
  },
};

export type Theme = typeof theme;