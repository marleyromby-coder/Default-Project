import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { getOpenStatus } from '@/lib/opening-hours';
import type { Business } from '@/lib/types';

/** "Åben til 15.30" in green, or when it opens next. Døgnvagt is mentioned when closed. */
export function OpenStatus({ business }: { business: Business }) {
  const colors = useTheme();
  const status = getOpenStatus(business.hours);
  const text = !status.open && business.emergency ? `Døgnvagt · ${status.label.toLowerCase()}` : status.label;
  const color = status.open ? colors.success : business.emergency ? colors.warning : colors.textSecondary;
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <AppText variant="footnote" style={{ color }} numberOfLines={1}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
