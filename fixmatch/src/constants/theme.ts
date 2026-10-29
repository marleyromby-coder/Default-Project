/**
 * FixMatch design tokens.
 *
 * "Nordisk håndværk": warm paper, pine green and an ochre accent, with Fraunces titles.
 * Colors are checked against WCAG 2.2: every text pair, the button labels included,
 * reaches at least 4.5:1, and icons in `brand` at least 3:1.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    /** Warm paper, like a workshop drawing – never a cold app grey. */
    background: '#F4F1EA',
    surface: '#FFFDF9',
    surfaceAlt: '#FAF7F1',
    border: '#E6E0D4',
    text: '#1C1A17',
    textSecondary: '#5E574C',
    textTertiary: '#6E665A',
    /** Pine green: the FixMatch colour, for icons and accents. */
    brand: '#2A6150',
    /** Button and chip fills behind `onBrand`. */
    brandStrong: '#1F4A3A',
    brandText: '#1F5A46',
    brandSoft: '#E2EBE4',
    onBrand: '#FFFDF8',
    /** Ochre, the dot in the logo. Decoration only – never text. */
    accent: '#D09A2E',
    accentSoft: '#F5EBD6',
    /** Deep pine for hero cards and floating bars. */
    ink: '#183A2E',
    inkRaised: '#22493B',
    onInk: '#FBF8F2',
    onInkSoft: '#C5D3CA',
    success: '#25733F',
    successSoft: '#E5F1E8',
    danger: '#B3261E',
    dangerSoft: '#FBEAE7',
    warning: '#8F5405',
    warningSoft: '#FBF0DC',
    info: '#2E5E8C',
    infoSoft: '#E8EFF5',
    star: '#D19A2E',
    starEmpty: '#E6E0D4',
    overlay: 'rgba(28, 26, 23, 0.5)',
    shadow: '#2B2418',
    /** Behind the phone-sized column of the web demo. */
    backdrop: '#EBE7DE',
  },
  dark: {
    background: '#11130F',
    surface: '#1A1D18',
    surfaceAlt: '#22261F',
    border: '#30352D',
    text: '#F2EEE5',
    textSecondary: '#B8B1A4',
    textTertiary: '#9C9584',
    brand: '#8CC5A8',
    brandStrong: '#2F6B53',
    brandText: '#8FCBAD',
    brandSoft: '#1D2C24',
    onBrand: '#FFFFFF',
    accent: '#E0AE4A',
    accentSoft: '#2E2616',
    ink: '#1C3A2E',
    inkRaised: '#25473A',
    onInk: '#F7F3EA',
    onInkSoft: '#C2D1C7',
    success: '#6FD08F',
    successSoft: '#14261A',
    danger: '#F28B82',
    dangerSoft: '#2C1614',
    warning: '#F0B95B',
    warningSoft: '#2B2212',
    info: '#8DB8E0',
    infoSoft: '#162230',
    star: '#E0AE4A',
    starEmpty: '#353A31',
    overlay: 'rgba(0, 0, 0, 0.6)',
    shadow: '#000000',
    backdrop: '#0A0B09',
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

/**
 * From this width screens put things side by side, like the list beside the map. The open
 * iPhone Duo is about 626 × 890 pt and turns freely (its inner display ignores orientation
 * locks), so it gets this when held sideways; iPad and wide windows get it too. Lay out by
 * width, never by orientation.
 */
export const WideLayout = 800;

/** Widest a column of text and cards gets; wider screens centre it (see useLayout). */
export const ReadableWidth = 680;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded', mono: 'ui-monospace' },
  web: { sans: 'var(--font-display)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
  default: { sans: 'normal', rounded: 'normal', mono: 'monospace' },
});

/**
 * Fraunces, the serif of the logo, for titles. Loaded by the root layout under these
 * names; each weight is its own family, so never combine them with `fontWeight`.
 */
export const SerifFonts = { regular: 'Fraunces_600SemiBold', bold: 'Fraunces_700Bold' } as const;

/** Type scale modelled on the iOS text styles. The titles are set in Fraunces. */
export const Typography = {
  largeTitle: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -0.6 },
  title1: { fontSize: 28, lineHeight: 33, fontWeight: '700', letterSpacing: -0.5 },
  title2: { fontSize: 22, lineHeight: 27, fontWeight: '700', letterSpacing: -0.3 },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: -0.2 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '500' },
} as const;

export type TypographyVariant = keyof typeof Typography;
