import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { ScreenPadding, Spacing } from '@/constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}

/** Large title for tab screens, which have no navigation bar. */
export function ScreenHeader({ title, subtitle, trailing }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <AppText variant="largeTitle">{title}</AppText>
        {subtitle ? (
          <AppText variant="subhead" tone="textSecondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  text: { flex: 1, gap: 2 },
});
