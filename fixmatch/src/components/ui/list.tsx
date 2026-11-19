import type { PropsWithChildren, ReactNode } from 'react';
import { Children, Fragment } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { IconWell, MinTouchSize, Radius, Shadows, Spacing } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';

import { Divider } from './card';
import { Icon, type IconName } from './icon';
import { Tappable } from './tappable';
import { AppText } from './text';

interface SectionProps extends PropsWithChildren {
  title?: string;
  footer?: string;
  /** `raised` gives the group the stronger shadow of a card that overlaps the panel. */
  elevation?: 'card' | 'raised';
  style?: StyleProp<ViewStyle>;
}

/** Grouped list section, like iOS Settings, on a card surface with a soft shadow. */
export function ListSection({ title, footer, elevation = 'card', style, children }: SectionProps) {
  const colors = useTheme();
  const shadows = Shadows[useIsDark() ? 'dark' : 'light'];
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.section, style]}>
      {title ? (
        <AppText
          variant="subhead"
          weight="600"
          tone="textSecondary"
          style={styles.sectionTitle}
          accessibilityRole="header">
          {title}
        </AppText>
      ) : null}
      <View style={[styles.group, { backgroundColor: colors.surface, boxShadow: shadows[elevation] }]}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? <Divider inset={52} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <AppText variant="footnote" tone="textSecondary" style={styles.footer}>
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

interface RowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  /** The icon well's colours, e.g. a trade's `soft`/`onSoft` or coral for akut. Default brand. */
  tint?: { background: string; color: string };
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  trailing?: ReactNode;
  accessibilityHint?: string;
  external?: boolean;
}

export function ListRow({
  title,
  subtitle,
  icon,
  iconColor,
  tint,
  value,
  onPress,
  destructive,
  trailing,
  accessibilityHint,
  external,
}: RowProps) {
  const colors = useTheme();
  const content = (
    <View style={styles.row}>
      {icon ? (
        <View
          style={[
            styles.iconTile,
            { backgroundColor: destructive ? colors.dangerSoft : (tint?.background ?? colors.brandSoft) },
          ]}>
          <Icon
            name={icon}
            size={17}
            color={destructive ? colors.danger : (tint?.color ?? iconColor ?? colors.brandText)}
            weight="semibold"
          />
        </View>
      ) : null}
      <View style={styles.rowText}>
        <AppText variant="body" style={destructive ? { color: colors.danger } : null}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="footnote" tone="textSecondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="body" tone="textSecondary" numberOfLines={1} style={styles.value}>
          {value}
        </AppText>
      ) : null}
      {trailing}
      {onPress && !destructive ? (
        <Icon name={external ? 'external' : 'chevronRight'} size={14} color={colors.textTertiary} weight="semibold" />
      ) : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Tappable
      onPress={onPress}
      accessibilityRole={external ? 'link' : 'button'}
      accessibilityLabel={[title, value].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      pressedOpacity={0.5}>
      {content}
    </Tappable>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  sectionTitle: { paddingHorizontal: Spacing.lg },
  group: { borderRadius: Radius.lg, borderCurve: 'continuous', overflow: 'hidden' },
  footer: { paddingHorizontal: Spacing.lg },
  row: {
    minHeight: MinTouchSize + 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
  },
  iconTile: {
    width: IconWell.row.size,
    height: IconWell.row.size,
    borderRadius: IconWell.row.radius,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  value: { maxWidth: '45%' },
});
