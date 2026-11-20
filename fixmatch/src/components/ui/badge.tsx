import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';
import { AppText } from './text';

/**
 * `sun` is for "Billigst", `sky` only for "Nærmest", `brand` for "Bedste match" and similar,
 * `coral` for akut, and `panel` for badges on the coloured panel (Demoversion, Verificeret).
 */
export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'sun'
  | 'sky'
  | 'coral'
  | 'panel';

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
    sun: { bg: colors.accentSoft, fg: colors.accentText },
    sky: { bg: colors.skySoft, fg: colors.skyText },
    coral: { bg: colors.coralSoft, fg: colors.coralText },
    panel: { bg: colors.panelInset, fg: colors.onPanel },
  }[tone];
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.badge, { backgroundColor: palette.bg }]}>
      {icon ? <Icon name={icon} size={12} color={palette.fg} weight="semibold" /> : null}
      <AppText variant="label" style={{ color: palette.fg }} numberOfLines={1} maxFontSizeMultiplier={1.3}>
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
