import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import type { TradeColor } from '@/constants/theme';
import { useTradeColor } from '@/hooks/use-theme';
import type { CategoryId } from '@/lib/types';

import ART from '../../assets/brand/trade-art.json';

type Paint = 'white' | 'deep' | 'highlight' | 'tile' | 'none';

interface Shape {
  el: 'path' | 'rect' | 'circle';
  fill?: string;
  stroke?: string;
  d?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rx?: number;
  cx?: number;
  cy?: number;
  r?: number;
  transform?: string;
  opacity?: number;
  strokeWidth?: number;
  strokeLinecap?: 'round' | 'butt' | 'square';
  strokeLinejoin?: 'round' | 'miter' | 'bevel';
}

const SHAPES = ART.art as Record<CategoryId, Shape[]>;

function paint(value: string | undefined, colors: TradeColor): string | undefined {
  if (value === undefined) return undefined;
  const named: Record<Paint, string> = {
    white: '#FFFFFF',
    deep: colors.deep,
    highlight: colors.highlight,
    tile: colors.tile,
    none: 'none',
  };
  return named[value as Paint] ?? value;
}

interface TradeArtProps {
  trade: CategoryId;
  /** Width and height in points, or '100%' to fill a square parent. */
  size?: number | '100%';
  /**
   * Draw the coloured tile behind the drawing, with rounded corners. Leave it out when the
   * parent view is the tile, like TradeTile.
   */
  tile?: boolean;
  /** Corner radius of the tile as a fraction of its size (default 0.25). */
  radius?: number;
}

/**
 * One of the eight trade illustrations of the trade tiles: a flat drawing in white and the
 * trade's deep colour, with a lighter geometric shape behind it (assets/brand/trade-art.json).
 * Decorative: hidden from VoiceOver, so the tile's label says what it is.
 */
export function TradeArt({ trade, size = 64, tile = false, radius = 0.25 }: TradeArtProps) {
  const colors = useTradeColor(trade);
  // SVG ids are global on the web, so each drawing gets its own clip.
  const clipId = `trade-art-${useId().replace(/[^\w-]/g, '')}`;
  const drawing = (SHAPES[trade] ?? []).map((shape, index) => {
    const { el, fill, stroke, ...rest } = shape;
    const props = { ...rest, fill: paint(fill, colors), stroke: paint(stroke, colors) };
    if (el === 'circle') return <Circle key={index} {...props} />;
    if (el === 'rect') return <Rect key={index} {...props} />;
    return <Path key={index} {...props} />;
  });
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${ART.size} ${ART.size}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden>
      {tile ? (
        <>
          <Defs>
            <ClipPath id={clipId}>
              <Rect width={ART.size} height={ART.size} rx={radius * ART.size} />
            </ClipPath>
          </Defs>
          <G clipPath={`url(#${clipId})`}>
            <Rect width={ART.size} height={ART.size} fill={colors.tile} />
            {drawing}
          </G>
        </>
      ) : (
        drawing
      )}
    </Svg>
  );
}
