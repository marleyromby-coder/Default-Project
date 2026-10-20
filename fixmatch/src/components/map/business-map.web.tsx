import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

import { AppText } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { bearingDegrees } from '@/lib/geo';

import type { BusinessMapProps } from './types';

const RINGS_KM = [2, 5, 10, 25];
const MAX_KM = 25;

/**
 * Web fallback for the map: a distance radar centred on the user. Rings are
 * drawn on a square-root scale so nearby businesses do not overlap.
 */
export function BusinessMap({ items, origin, selectedId, onSelect }: BusinessMapProps) {
  const colors = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const radius = Math.max(0, Math.min(size.width, size.height) / 2 - 28);
  const cx = size.width / 2;
  const cy = size.height / 2;
  const scale = (km: number) => (Math.sqrt(Math.min(km, MAX_KM)) / Math.sqrt(MAX_KM)) * radius;

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceAlt }]}
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
      {radius > 0 ? (
        <Svg width={size.width} height={size.height}>
          {RINGS_KM.map((km) => (
            <G key={km}>
              <Circle cx={cx} cy={cy} r={scale(km)} stroke={colors.border} strokeWidth={1} fill="none" />
              <SvgText x={cx + 4} y={cy - scale(km) - 4} fill={colors.textTertiary} fontSize={11}>
                {`${km} km`}
              </SvgText>
            </G>
          ))}
          {items.map(({ business, distanceKm }) => {
            if (distanceKm > MAX_KM) return null;
            const angle = (bearingDegrees(origin, business.coords) - 90) * (Math.PI / 180);
            const r = scale(distanceKm);
            const selected = business.id === selectedId;
            return (
              <G key={business.id} onPress={() => onSelect(business.id)}>
                <Circle cx={cx + r * Math.cos(angle)} cy={cy + r * Math.sin(angle)} r={16} fill="transparent" />
                <Circle
                  cx={cx + r * Math.cos(angle)}
                  cy={cy + r * Math.sin(angle)}
                  r={selected ? 10 : 7}
                  fill={selected ? colors.brandStrong : colors.brand}
                  stroke={colors.surface}
                  strokeWidth={2}
                />
              </G>
            );
          })}
          <Circle cx={cx} cy={cy} r={9} fill={colors.info} stroke={colors.surface} strokeWidth={3} />
        </Svg>
      ) : null}
      <View style={styles.legend} pointerEvents="none">
        <AppText variant="caption" tone="textSecondary">
          Afstandsradar · du er i midten · nord er op
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { position: 'absolute', bottom: 100, alignSelf: 'center' },
});
