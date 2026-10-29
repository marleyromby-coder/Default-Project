import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';

interface Props {
  score: number;
  size?: 'small' | 'large';
  /** For white text on photos. */
  onPhoto?: boolean;
}

/** FixMatch score (0–100). The number always carries the meaning, not the color. */
export function MatchBadge({ score, size = 'small', onPhoto }: Props) {
  const colors = useTheme();
  const strong = score >= 70;
  const background = onPhoto ? 'rgba(255,255,255,0.94)' : strong ? colors.successSoft : colors.surfaceAlt;
  const foreground = onPhoto ? '#1C1A17' : strong ? colors.success : colors.textSecondary;
  const large = size === 'large';
  return (
    <View
      accessible
      accessibilityLabel={t('Match-score {score} ud af 100', { score })}
      style={[
        styles.badge,
        large ? styles.large : styles.small,
        { backgroundColor: background, borderColor: onPhoto ? 'transparent' : colors.border },
      ]}>
      <AppText
        variant={large ? 'title2' : 'headline'}
        rounded
        tabular
        style={{ color: foreground }}
        maxFontSizeMultiplier={1.2}>
        {score}
      </AppText>
      <AppText variant="caption2" style={{ color: foreground, marginTop: -2 }} maxFontSizeMultiplier={1.2}>
        {t('match')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  small: { minWidth: 48, paddingHorizontal: 6, paddingVertical: 4, borderRadius: Radius.md },
  large: { minWidth: 64, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.lg },
});
