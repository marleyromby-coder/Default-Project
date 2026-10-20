import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';
import { AppText } from './text';

type BadgeTone = 'neutral' | 'brand' | 'success' | 'danger' | 'warning' | 'info';

interface Props {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
  accessibilityLabel?: string;
}

export function Badge({ label, tone = 'neutral', icon, accessibilityLabel }: Props) {
  const colors = useTheme();
  const palette = {
    neutral: { bg: colors.surfaceAlt, fg: colors.textSecondary, border: colors.border },
    brand: { bg: colors.brandSoft, fg: colors.brandText, border: 'transparent' },
    success: { bg: colors.successSoft, fg: colors.success, border: 'transparent' },
    danger: { bg: colors.dangerSoft, fg: colors.danger, border: 'transparent' },
    warning: { bg: colors.warningSoft, fg: colors.warning, border: 'transparent' },
    info: { bg: colors.infoSoft, fg: colors.info, border: 'transparent' },
  }[tone];
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.badge, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      {icon ? <Icon name={icon} size={12} color={palette.fg} weight="semibold" /> : null}
      <AppText variant="caption" weight="600" style={{ color: palette.fg }} numberOfLines={1} maxFontSizeMultiplier={1.3}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
});
