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

/** FixMatch score (0–100). The number carries the meaning, so it needs no colour or frame. */
export function MatchBadge({ score, size = 'small', onPhoto }: Props) {
  const colors = useTheme();
  const background = onPhoto ? 'rgba(255,255,255,0.94)' : 'transparent';
  const foreground = onPhoto ? '#1C1A17' : colors.text;
  const label = onPhoto ? '#1C1A17' : colors.textSecondary;
  const large = size === 'large';
  return (
    <View
      accessible
      accessibilityLabel={t('Match-score {score} ud af 100', { score })}
      style={[styles.badge, large ? styles.large : styles.small, { backgroundColor: background }]}>
      <AppText
        variant={large ? 'title2' : 'headline'}
        rounded
        tabular
        style={{ color: foreground }}
        maxFontSizeMultiplier={1.2}>
        {score}
      </AppText>
      <AppText variant="caption2" style={{ color: label, marginTop: -2 }} maxFontSizeMultiplier={1.2}>
        {t('match')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
  small: { minWidth: 48, paddingHorizontal: 6, paddingVertical: 4, borderRadius: Radius.md },
  large: { minWidth: 64, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.lg },
});
