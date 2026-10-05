import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

/**
 * Charte CHARGISSIMO, reprise du site (`ChargissimoNodeJS/src/less/styles.less` : `--main`
 * #4479bf ; `style.secondaryColor` de `app.js` : #2d5891). L'orange ne sert qu'aux pastilles
 * et au bandeau « ADMIN » de l'icône.
 */
export const colors = {
  primary: '#4479bf',
  primaryDark: '#2d5891',
  primaryContainer: '#DCE8F6',
  accent: '#f08a24',
  accentContainer: '#FFE9D2',
  success: '#1F8A3F',
  warning: '#D97706',
  error: '#C0392B',
  text: '#1b2430',
  greyText: '#4A5562',
  greyBorder: '#E2E5EA',
  background: '#F4F6F9',
};

export const theme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: '#FFFFFF',
    primaryContainer: colors.primaryContainer,
    onPrimaryContainer: '#14243b',
    secondary: colors.accent,
    onSecondary: '#FFFFFF',
    secondaryContainer: colors.accentContainer,
    onSecondaryContainer: '#5C1F00',
    background: colors.background,
    surface: '#FFFFFF',
    surfaceVariant: '#EEF1F5',
    onSurface: colors.text,
    onSurfaceVariant: colors.greyText,
    outline: '#C8D0DA',
    error: colors.error,
  },
};

