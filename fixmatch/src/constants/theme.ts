/**
 * FixMatch design tokens: "Prisen i centrum" (docs/design/designsystem.md).
 *
 * A cool, light surface with an emerald panel at the top of the main screens, sun yellow for the
 * one most important action, and Schibsted Grotesk for titles, prices, business names and
 * buttons. Body text stays SF Pro with Dynamic Type.
 *
 * Colours are checked against WCAG 2.2 (src/__tests__/theme.test.ts): body text pairs reach at
 * least 4.5:1, large text and icons at least 3:1, in both palettes.
 *
 * What each colour is for (do not mix the roles):
 * - `accent` (sun yellow) only for the main action of a screen, "Billigst" and the logo's dot.
 *   Never as text on white; text on it is `onAccent`.
 * - `sky*` only for "Nærmest". `coral*` only for akut and danger.
 * - `TradeColors` only for the trade tiles and small trade markers, never for body text or prices.
 */

import { Platform, type TextStyle } from 'react-native';

import type { CategoryId } from '@/lib/types';

export const Colors = {
  light: {
    background: '#F1F5F3',
    /** Cards and sheets. */
    surface: '#FFFFFF',
    /** A step between surface and background, e.g. round icon buttons and inset rows. */
    surfaceAlt: '#F6F9F7',
    /** Quiet fill for fields, chips, badges, segmented tracks and disabled buttons. */
    fill: '#E7EEEA',
    /** The raised part on a `fill`, like the selected segment. */
    fillRaised: '#FFFFFF',
    border: '#DFE7E3',
    text: '#0B1A15',
    textSecondary: '#41524C',
    textTertiary: '#5C6D66',
    /** Emerald, the FixMatch colour: icons, checkmarks, the selected tab. */
    brand: '#00805C',
    /** Button and selected-control fills behind `onBrand`. */
    brandStrong: '#00805C',
    /** Brand-coloured text and links on surface, background and `brandSoft`. */
    brandText: '#00704F',
    brandSoft: '#DCF4E9',
    onBrand: '#FFFFFF',
    /** The coloured panel at the top of Find, results and business pages: a gradient from `panel` to `panel2`. */
    panel: '#007A56',
    panel2: '#00614A',
    /** Text and icons on the panel. */
    onPanel: '#FFFFFF',
    onPanelSoft: '#E6F7EF',
    /** A translucent white layer on the panel, for pills and round buttons on it. */
    panelRaised: 'rgba(255, 255, 255, 0.16)',
    /** Sun yellow: the main action, "Billigst" and the logo's dot. Never text on white. */
    accent: '#FFB800',
    onAccent: '#1A1400',
    accentSoft: '#FFF3CC',
    /** Text and icons on `accentSoft`. */
    accentText: '#7F5300',
    /** Sky: only for "Nærmest". */
    sky: '#1E88C8',
    skySoft: '#E0EFFA',
    skyText: '#0A5F8C',
    /** Coral: only for akut and danger. `coral` is a fill or icon; text uses `coralText`. */
    coral: '#E8553D',
    onCoral: '#FFFFFF',
    coralSoft: '#FDE8E4',
    coralText: '#B42A18',
    /** Ink: selected chips and the dark compare bar. */
    ink: '#0B1A15',
    inkRaised: '#1F302A',
    onInk: '#FFFFFF',
    onInkSoft: '#B9C9C2',
    success: '#1E7344',
    successSoft: '#E1F3E7',
    danger: '#B42A18',
    dangerSoft: '#FDE8E4',
    warning: '#8A4B00',
    warningSoft: '#FCEBD9',
    info: '#3A5A80',
    infoSoft: '#E8EEF5',
    /** Review stars. Decorative: the number is always written beside them. */
    star: '#F2A900',
    starEmpty: '#D5DFDA',
    overlay: 'rgba(11, 26, 21, 0.5)',
    shadow: '#0B1A15',
    /** Behind the phone-sized column of the web demo. */
    backdrop: '#E2E9E5',
  },
  dark: {
    background: '#0A1210',
    surface: '#131D1A',
    surfaceAlt: '#1A2622',
    fill: '#20302A',
    fillRaised: '#34483F',
    border: '#25342E',
    text: '#ECF4F0',
    textSecondary: '#A6B8B1',
    textTertiary: '#889B94',
    brand: '#2FD39C',
    brandStrong: '#2FD39C',
    brandText: '#45DCA8',
    brandSoft: '#0E2C22',
    onBrand: '#03140E',
    panel: '#0B5E48',
    panel2: '#08443A',
    onPanel: '#FFFFFF',
    onPanelSoft: '#D5EFE4',
    panelRaised: 'rgba(255, 255, 255, 0.12)',
    accent: '#FFC21F',
    onAccent: '#1A1400',
    accentSoft: '#2C250F',
    accentText: '#FFCF4D',
    sky: '#7CC4F2',
    skySoft: '#10283A',
    skyText: '#7CC4F2',
    coral: '#FF7A5C',
    onCoral: '#1A0603',
    coralSoft: '#33191A',
    coralText: '#FF9B85',
    ink: '#22322C',
    inkRaised: '#2E423A',
    onInk: '#ECF4F0',
    onInkSoft: '#B3C4BD',
    success: '#6FD08F',
    successSoft: '#12261A',
    danger: '#FF9B85',
    dangerSoft: '#33191A',
    warning: '#F5B26B',
    warningSoft: '#2E2010',
    info: '#9DB8DA',
    infoSoft: '#18222F',
    star: '#FFC21F',
    starEmpty: '#2E3F38',
    overlay: 'rgba(0, 0, 0, 0.6)',
    shadow: '#000000',
    backdrop: '#050A08',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };
export type ColorName = keyof Palette;

/**
 * The colours of one trade (koncept B's tiles). `tile` fills the square tile and `deep` and
 * `highlight` draw on it (src/components/trade-art.tsx); `soft` and `onSoft` are for small
 * markers such as a business's initials. Decorative only: the trade's name is always written too.
 */
export interface TradeColor {
  tile: string;
  deep: string;
  /** The lighter geometric shape behind the drawing. */
  highlight: string;
  /** A pale tint for avatars and icon wells; `onSoft` on it reaches 4.5:1. */
  soft: string;
  onSoft: string;
}

const TRADE_LIGHT: Record<CategoryId, TradeColor> = {
  vvs: { tile: '#2E77F0', deep: '#1A56C9', highlight: '#699DF4', soft: '#DEE9FD', onSoft: '#1A56C9' },
  elektriker: { tile: '#FFBE1A', deep: '#8F5B00', highlight: '#FFD05A', soft: '#FFF5DA', onSoft: '#8F5B00' },
  toemrer: { tile: '#F47B2A', deep: '#A84A10', highlight: '#F7A066', soft: '#FDEADD', onSoft: '#A84A10' },
  murer: { tile: '#DB4A3A', deep: '#9C2A1D', highlight: '#E57D71', soft: '#F9E2DF', onSoft: '#9C2A1D' },
  mekaniker: { tile: '#4B4FD8', deep: '#2F2FA0', highlight: '#7D80E3', soft: '#E2E3F9', onSoft: '#2F2FA0' },
  maler: { tile: '#EE5A9B', deep: '#B02F69', highlight: '#F388B7', soft: '#FCE5EF', onSoft: '#B02F69' },
  tagdaekker: { tile: '#13A08F', deep: '#0B6B60', highlight: '#55BBAE', soft: '#D9F0ED', onSoft: '#0B6B60' },
  laasesmed: { tile: '#8B5CF6', deep: '#5B32C2', highlight: '#AB8AF9', soft: '#ECE5FE', onSoft: '#5B32C2' },
};

/** Dark mode keeps the tiles (like app icons) and gets dark tints for the small markers. */
const TRADE_DARK: Record<CategoryId, TradeColor> = {
  vvs: { ...TRADE_LIGHT.vvs, soft: '#19334D', onSoft: '#97BBF8' },
  elektriker: { ...TRADE_LIGHT.elektriker, soft: '#4C441A', onSoft: '#FFDF8D' },
  toemrer: { ...TRADE_LIGHT.toemrer, soft: '#49341E', onSoft: '#FABD95' },
  murer: { ...TRADE_LIGHT.murer, soft: '#432822', onSoft: '#EDA59D' },
  mekaniker: { ...TRADE_LIGHT.mekaniker, soft: '#202948', onSoft: '#A5A7EC' },
  maler: { ...TRADE_LIGHT.maler, soft: '#482C39', onSoft: '#F7ADCD' },
  tagdaekker: { ...TRADE_LIGHT.tagdaekker, soft: '#133C36', onSoft: '#89D0C7' },
  laasesmed: { ...TRADE_LIGHT.laasesmed, soft: '#302C4F', onSoft: '#C5AEFB' },
};

export const TradeColors: Record<'light' | 'dark', Record<CategoryId, TradeColor>> = {
  light: TRADE_LIGHT,
  dark: TRADE_DARK,
};

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
  /** Cards that carry a lot (search card, result cards, compare table). */
  card: 20,
  /** Trade tiles and large buttons. */
  xl: 22,
  /** The bottom corners of the coloured panel. */
  panel: 28,
  pill: 999,
} as const;

/**
 * The two sizes of a tinted square behind an icon: `row` in list rows and small cards,
 * `card` where an icon leads a larger block. Use `borderCurve: 'continuous'` with them.
 */
export const IconWell = {
  row: { size: 28, radius: 7 },
  card: { size: 40, radius: 10 },
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

/**
 * Soft shadows for cards that float over the background or the panel (light mode only; in dark
 * mode surfaces separate by colour). React Native's `boxShadow` works on iOS, Android and web.
 */
export const Shadows = {
  light: {
    card: '0px 1px 2px rgba(11, 26, 21, 0.05), 0px 6px 16px rgba(11, 26, 21, 0.06)',
    raised: '0px 2px 4px rgba(11, 26, 21, 0.06), 0px 12px 28px rgba(11, 26, 21, 0.12)',
  },
  dark: {
    card: 'none',
    raised: '0px 8px 24px rgba(0, 0, 0, 0.45)',
  },
} as const;

/** Body text: SF Pro (the system font) on iOS. */
export const Fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded', mono: 'ui-monospace' },
  web: { sans: 'var(--font-display)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
  default: { sans: 'normal', rounded: 'normal', mono: 'monospace' },
});

/**
 * Schibsted Grotesk (SIL Open Font License) for titles, prices, business names and buttons.
 * The root layout loads these four weights under these names. Each weight is its own family,
 * so pick the family with `displayFont(weight)` and never add `fontWeight` to display text.
 * Do not use tabular figures with it: the comma and full stop get too wide.
 */
export const DisplayFonts = {
  semiBold: 'SchibstedGrotesk_600SemiBold',
  bold: 'SchibstedGrotesk_700Bold',
  extraBold: 'SchibstedGrotesk_800ExtraBold',
  black: 'SchibstedGrotesk_900Black',
} as const;

/** The Schibsted Grotesk family for a weight (600 or less → SemiBold, 900 → Black). */
export function displayFont(weight: TextStyle['fontWeight']): string {
  const named: Record<string, number> = { bold: 700, heavy: 800, black: 900 };
  const value = weight === undefined ? 400 : (named[weight] ?? (Number(weight) || 400));
  if (value >= 900) return DisplayFonts.black;
  if (value >= 800) return DisplayFonts.extraBold;
  if (value >= 700) return DisplayFonts.bold;
  return DisplayFonts.semiBold;
}

/**
 * Type scale (docs/design/designsystem.md). `largeTitle`, `title1`/`price`, `title2` and
 * `title3` are set in Schibsted Grotesk by AppText; the rest in SF Pro unless AppText gets
 * `display`. Weights here are the display weights for the titles.
 */
export const Typography = {
  /** Stor titel. */
  largeTitle: { fontSize: 34, lineHeight: 38, fontWeight: '800' },
  /** Pris XL: the big hourly price. */
  title1: { fontSize: 28, lineHeight: 32, fontWeight: '800' },
  price: { fontSize: 28, lineHeight: 32, fontWeight: '800' },
  /** Titel 2: section titles such as "Hvem har tid i dag?". */
  title2: { fontSize: 22, lineHeight: 26, fontWeight: '800' },
  title3: { fontSize: 20, lineHeight: 24, fontWeight: '700' },
  /** Overskrift: card titles and business names (with `display`), otherwise SF Pro semibold. */
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  /** Fodnote. */
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  /** Mærkat: badge and tab labels. */
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '500' },
} as const;

export type TypographyVariant = keyof typeof Typography;

/** The variants AppText sets in Schibsted Grotesk unless told otherwise. */
export const DisplayVariants: readonly TypographyVariant[] = ['largeTitle', 'title1', 'price', 'title2', 'title3'];

/**
 * Tight letter-spacing of the display font, as a fraction of the font size (−3.5 % for large
 * titles and prices, −3 % for title 2, −1.5 % for headlines).
 */
export const DisplayTracking: Record<TypographyVariant, number> = {
  largeTitle: -0.035,
  title1: -0.035,
  price: -0.035,
  title2: -0.03,
  title3: -0.02,
  headline: -0.015,
  body: -0.01,
  callout: -0.01,
  subhead: -0.01,
  footnote: -0.005,
  caption: 0,
  label: 0,
  caption2: 0,
};

/**
 * Navigation bar fonts: inline titles stay SF Pro semibold, like the back chevron beside them;
 * large titles are Schibsted Grotesk ExtraBold (iOS takes no letter-spacing there).
 */
export const NavigationFonts = {
  largeTitle: DisplayFonts.extraBold,
} as const;
