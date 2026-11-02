// Design tokens for light and dark themes.
const shared = {
  primary: '#7C5CFF',
  primaryAlt: '#4F8BFF',
  accent: '#FF8A7A',
  success: '#2BB673',
  danger: '#E5484D',
  warning: '#F5A524',
  gradient: ['#8B6CFF', '#5E8BFF'],
  gradientWarm: ['#FF9A8B', '#FF6A88'],
  white: '#FFFFFF',
};

export const lightColors = {
  ...shared,
  mode: 'light',
  background: '#F5F4FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EEEBFA',
  border: '#E3E0F0',
  text: '#1C1A2E',
  textMuted: '#6E6A85',
  textFaint: '#A19DB8',
  bubbleAi: '#FFFFFF',
  bubbleAiText: '#1C1A2E',
  bubbleUserText: '#FFFFFF',
  inputBg: '#FFFFFF',
  shadow: 'rgba(60, 40, 140, 0.10)',
  overlay: 'rgba(20, 16, 40, 0.45)',
  headerGradient: ['#8B6CFF', '#5E8BFF'],
};

export const darkColors = {
  ...shared,
  mode: 'dark',
  background: '#0F0E17',
  surface: '#1A1828',
  surfaceAlt: '#242138',
  border: '#2E2A45',
  text: '#F2F0FF',
  textMuted: '#A9A4C7',
  textFaint: '#6F6A8E',
  bubbleAi: '#211E33',
  bubbleAiText: '#F2F0FF',
  bubbleUserText: '#FFFFFF',
  inputBg: '#1A1828',
  shadow: 'rgba(0, 0, 0, 0.45)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  headerGradient: ['#4B37B8', '#2C4FB0'],
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const shadow = (colors, elevation = 4) => ({
  shadowColor: colors.mode === 'dark' ? '#000' : '#3C288C',
  shadowOpacity: colors.mode === 'dark' ? 0.4 : 0.1,
  shadowRadius: elevation * 2.5,
  shadowOffset: { width: 0, height: elevation },
  elevation,
});
