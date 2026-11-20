import { Colors, displayFont, DisplayFonts, type Palette, TradeColors } from '@/constants/theme';

/** WCAG 2.2 contrast ratio of two #RRGGBB colours. */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, b2] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b2;
  };
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

/** An rgba(r, g, b, a) layer blended over a #RRGGBB colour, as #RRGGBB. */
function blend(base: string, layer: string): string {
  const match = layer.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (!match) throw new Error(`not an rgba colour: ${layer}`);
  const alpha = Number(match[4]);
  return `#${[1, 2, 3]
    .map((i) => {
      const under = parseInt(base.slice(i * 2 - 1, i * 2 + 1), 16);
      const value = Math.round(Number(match[i]) * alpha + under * (1 - alpha));
      return value.toString(16).padStart(2, '0');
    })
    .join('')}`;
}

/** HeroPanel's large decoration disc: `onPanel` at 7 %. */
const DISC_OPACITY = 0.07;

type Pair = [keyof Palette, keyof Palette];

/** Body text: at least 4.5:1. */
const BODY: Pair[] = [
  ['text', 'background'],
  ['text', 'surface'],
  ['text', 'surfaceAlt'],
  ['text', 'fill'],
  ['text', 'fillRaised'],
  ['text', 'brandSoft'],
  ['textSecondary', 'background'],
  ['textSecondary', 'surface'],
  ['textSecondary', 'fill'],
  ['textTertiary', 'background'],
  ['textTertiary', 'surface'],
  ['textTertiary', 'surfaceAlt'],
  ['textTertiary', 'fill'],
  ['brandText', 'background'],
  ['brandText', 'surface'],
  ['brandText', 'fill'],
  ['brandText', 'brandSoft'],
  ['onBrand', 'brandStrong'],
  ['onPanel', 'panel'],
  ['onPanel', 'panel2'],
  ['onPanelSoft', 'panel'],
  ['onPanelSoft', 'panel2'],
  ['onAccent', 'accent'],
  ['accentText', 'accentSoft'],
  ['skyText', 'skySoft'],
  ['coralText', 'coralSoft'],
  ['coralText', 'surface'],
  ['danger', 'dangerSoft'],
  ['danger', 'surface'],
  ['onInk', 'ink'],
  ['onInk', 'inkRaised'],
  ['onInkSoft', 'ink'],
  ['success', 'successSoft'],
  ['success', 'surface'],
  ['warning', 'warningSoft'],
  ['warning', 'surface'],
  ['info', 'infoSoft'],
  ['info', 'surface'],
];

/** Large text and icons: at least 3:1. */
const LARGE: Pair[] = [
  ['brand', 'background'],
  ['brand', 'surface'],
  ['sky', 'surface'],
  ['coral', 'surface'],
  ['onCoral', 'coral'],
  ['accent', 'ink'],
];

describe.each(['light', 'dark'] as const)('%s palette', (scheme) => {
  const colors: Palette = Colors[scheme];

  it('has the same roles as the other palette', () => {
    expect(Object.keys(Colors.dark).sort()).toEqual(Object.keys(Colors.light).sort());
  });

  it.each(BODY)('%s on %s reaches 4.5:1', (fg, bg) => {
    expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(LARGE)('%s on %s reaches 3:1', (fg, bg) => {
    expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(3);
  });

  it.each(['panel', 'panel2'] as const)('badge text on %s keeps 4.5:1, also over the decoration disc', (base) => {
    const white = parseInt(colors.onPanel.slice(1, 3), 16);
    const disc = blend(colors[base], `rgba(${white}, ${white}, ${white}, ${DISC_OPACITY})`);
    for (const under of [colors[base], disc]) {
      expect(contrast(colors.onPanel, blend(under, colors.panelInset))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(Object.keys(TradeColors[scheme]))('trade %s: initials on the soft tint reach 4.5:1', (id) => {
    const trade = TradeColors[scheme][id as keyof (typeof TradeColors)['light']];
    expect(contrast(trade.onSoft, trade.soft)).toBeGreaterThanOrEqual(4.5);
    // The drawing's deep colour stands out from the tile.
    expect(contrast(trade.deep, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('display font', () => {
  it('picks the family by weight', () => {
    expect(displayFont(undefined)).toBe(DisplayFonts.semiBold);
    expect(displayFont('600')).toBe(DisplayFonts.semiBold);
    expect(displayFont('bold')).toBe(DisplayFonts.bold);
    expect(displayFont('700')).toBe(DisplayFonts.bold);
    expect(displayFont('800')).toBe(DisplayFonts.extraBold);
    expect(displayFont(900)).toBe(DisplayFonts.black);
  });
});
