import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';
import { AppText } from './text';

interface Props {
  icon: IconName;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: Props) {
  const colors = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.brandSoft }]}>
        <Icon name={icon} size={30} color={colors.brand} weight="semibold" />
      </View>
      <AppText variant="title3" align="center">
        {title}
      </AppText>
      <AppText variant="subhead" tone="textSecondary" align="center" style={styles.message}>
        {message}
      </AppText>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.huge, gap: Spacing.sm },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  message: { maxWidth: 320 },
  action: { marginTop: Spacing.md, alignSelf: 'stretch', alignItems: 'center' },
});
