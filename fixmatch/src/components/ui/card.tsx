import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';
import { AppText } from './text';

interface CardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export function Card({ children, style, padded = true }: CardProps) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        padded ? styles.padded : null,
        style,
      ]}>
      {children}
    </View>
  );
}

interface CardTitleProps {
  title: string;
  icon?: IconName;
  trailing?: React.ReactNode;
}

export function CardTitle({ title, icon, trailing }: CardTitleProps) {
  const colors = useTheme();
  return (
    <View style={styles.titleRow}>
      {icon ? <Icon name={icon} size={17} color={colors.brand} weight="semibold" /> : null}
      <AppText variant="headline" style={styles.titleText} accessibilityRole="header">
        {title}
      </AppText>
      {trailing}
    </View>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const colors = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: inset }} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  padded: { padding: Spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  titleText: { flex: 1 },
});
