import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';
import { AppText } from './text';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'danger' | 'warning' | 'info';

interface Props {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
  accessibilityLabel?: string;
}

export function Badge({ label, tone = 'neutral', icon, accessibilityLabel }: Props) {
  const colors = useTheme();
  const palette = {
    neutral: { bg: colors.fill, fg: colors.textSecondary },
    brand: { bg: colors.brandSoft, fg: colors.brandText },
    success: { bg: colors.successSoft, fg: colors.success },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    info: { bg: colors.infoSoft, fg: colors.info },
  }[tone];
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.badge, { backgroundColor: palette.bg }]}>
      {icon ? <Icon name={icon} size={12} color={palette.fg} weight="semibold" /> : null}
      <AppText
        variant="caption"
        weight="600"
        style={{ color: palette.fg }}
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}>
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
    alignSelf: 'flex-start',
  },
});
