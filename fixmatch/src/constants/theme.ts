/**
 * FixMatch design tokens.
 *
 * Colors are checked against WCAG 2.2: body text pairs reach at least 4.5:1,
 * and the button fills reach at least 3:1 with their bold 17 pt labels.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#F3F4F6',
    surface: '#FFFFFF',
    surfaceAlt: '#F8F9FB',
    border: '#E4E7EC',
    text: '#0E1726',
    textSecondary: '#556070',
    textTertiary: '#6B7585',
    brand: '#F2541B',
    brandStrong: '#CC4A12',
    brandText: '#C2410C',
    brandSoft: '#FFF1EA',
    onBrand: '#FFFFFF',
    /** The navy of the logo: hero cards and floating bars. */
    ink: '#16213A',
    inkRaised: '#22304F',
    onInk: '#FFFFFF',
    onInkSoft: '#C6CFDF',
    success: '#15803D',
    successSoft: '#E8F6EE',
    danger: '#B42318',
    dangerSoft: '#FDECEA',
    warning: '#B54708',
    warningSoft: '#FFF4E5',
    info: '#1D4ED8',
    infoSoft: '#EAF1FF',
    star: '#F59E0B',
    starEmpty: '#E4E7EC',
    overlay: 'rgba(14, 23, 38, 0.55)',
    shadow: '#0E1726',
  },
  dark: {
    background: '#0B0F15',
    surface: '#151B24',
    surfaceAlt: '#1B2330',
    border: '#283241',
    text: '#F3F5F8',
    textSecondary: '#A9B3C1',
    textTertiary: '#8893A3',
    brand: '#FF6B35',
    brandStrong: '#C2410C',
    brandText: '#FF7A47',
    brandSoft: '#2A1A12',
    onBrand: '#FFFFFF',
    ink: '#1C2740',
    inkRaised: '#26344F',
    onInk: '#FFFFFF',
    onInkSoft: '#C6CFDF',
    success: '#4ADE80',
    successSoft: '#11261A',
    danger: '#F87171',
    dangerSoft: '#2B1414',
    warning: '#FBBF24',
    warningSoft: '#2A2110',
    info: '#60A5FA',
    infoSoft: '#132036',
    star: '#FBBF24',
    starEmpty: '#2F3A4A',
    overlay: 'rgba(0, 0, 0, 0.6)',
    shadow: '#000000',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };
export type ColorName = keyof Palette;

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

/** Standard horizontal margin for screens (iOS uses 16–20 pt). */
export const ScreenPadding = 16;

/** Minimum size of anything tappable (Apple HIG: 44 × 44 pt). */
export const MinTouchSize = 44;

/** Web builds are shown in a phone-sized column on large screens. */
export const MaxContentWidth = 480;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded', mono: 'ui-monospace' },
  web: { sans: 'var(--font-display)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
  default: { sans: 'normal', rounded: 'normal', mono: 'monospace' },
});

/** Type scale modelled on the iOS text styles. */
export const Typography = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '500' },
} as const;

export type TypographyVariant = keyof typeof Typography;
