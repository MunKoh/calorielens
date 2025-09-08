export const theme = {
  colors: {
    primary: '#3E5F44',  // 다크 포레스트 그린
    primaryLight: '#5E936C', // 미디엄 그린
    primaryDark: '#2C4A32', // 더 어두운 그린
    secondary: '#93DA97', // 밝은 그린
    secondaryLight: '#E8FFD7', // 매우 밝은 민트
    accent: '#93DA97', // 밝은 그린 액센트
    text: '#3E5F44',
    textLight: '#5E936C',
    background: '#E8FFD7',
    cardBg: '#FFFFFF',
    error: '#F44336',
    success: '#5E936C',
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
    small: '0 2px 4px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 8px rgba(0, 0, 0, 0.1)',
    large: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    round: '50%',
  },
};

export type Theme = typeof theme;