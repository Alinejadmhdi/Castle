export const theme = {
  colors: {
    background: '#1a1410',
    surface: '#2d241c',
    surfaceElevated: '#3d3228',
    primary: '#c9a227',
    primaryMuted: '#8b7355',
    text: '#f5f0e8',
    textMuted: '#a89888',
    success: '#4a7c59',
    danger: '#8b3a3a',
    brickMortar: '#b8a99a',
    brick: '#c45c3a',
    plotGrass: '#3d5c3a',
    confetti: ['#c9a227', '#4a7c59', '#8b3a3a', '#5b7fa5', '#d4a574'],
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 20,
  },
  miniatureScale: 0.4,
} as const;

export type Theme = typeof theme;
