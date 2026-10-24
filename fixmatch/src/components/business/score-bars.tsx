import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { TRUSTPILOT_ENABLED } from '@/lib/features';
import { formatDecimal } from '@/lib/format';
import type { ScoreParts, Weights } from '@/lib/ranking';
import { t } from '@/i18n';

const ALL_ROWS: { key: keyof ScoreParts; label: string }[] = [
  { key: 'price', label: t('Pris') },
  { key: 'distance', label: t('Afstand') },
  { key: 'reviews', label: t('Anmeldelser') },
];
const ROWS = ALL_ROWS.filter((row) => TRUSTPILOT_ENABLED || row.key !== 'reviews');

/** Shows each part score out of 10 and the user's weight for it. */
export function ScoreBars({ parts, weights }: { parts: ScoreParts; weights: Weights }) {
  const colors = useTheme();
  return (
    <View style={styles.list}>
      {ROWS.map(({ key, label }) => {
        const value = parts[key];
        return (
          <View
            key={key}
            style={styles.row}
            accessible
            accessibilityLabel={t('{label}: {decimal} ud af 10, vægt {value} procent', {
              label,
              decimal: formatDecimal(value * 10),
              value: Math.round(weights[key] * 100),
            })}>
            <AppText variant="subhead" style={styles.label}>
              {label}
            </AppText>
            <View style={[styles.track, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <View style={[styles.fill, { width: `${Math.max(4, value * 100)}%`, backgroundColor: colors.brand }]} />
            </View>
            <AppText variant="subhead" weight="600" tabular style={styles.value}>
              {formatDecimal(value * 10)}
            </AppText>
            <AppText variant="caption" tone="textSecondary" tabular style={styles.weight}>
              {Math.round(weights[key] * 100)} %
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  label: { width: 96 },
  track: { flex: 1, height: 8, borderRadius: Radius.pill, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  fill: { height: '100%', borderRadius: Radius.pill },
  value: { width: 40, textAlign: 'right' },
  weight: { width: 38, textAlign: 'right' },
});
