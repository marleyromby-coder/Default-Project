import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import { useApp } from '@/state/app-state';

import { Icon, type IconName } from './icon';
import { Tappable } from './tappable';
import { AppText } from './text';

/** The first-time tips. A closed tip is remembered on the phone and never shown again. */
export type HintId = 'list' | 'business';

interface Props {
  id: HintId;
  title: string;
  points: { icon: IconName; text: string }[];
  style?: StyleProp<ViewStyle>;
}

/**
 * A first-time tip: a soft green card with a few short points and "Forstået" to close it. It is part of
 * the page, not an overlay, so VoiceOver reads it in order and nothing is covered.
 */
export function Hint({ id, title, points, style }: Props) {
  const colors = useTheme();
  const { state, dismissHint } = useApp();
  if (state.hints.includes(id)) return null;
  return (
    <View style={[styles.card, { backgroundColor: colors.brandSoft }, style]}>
      <View style={styles.head}>
        <AppText variant="headline" display accessibilityRole="header" style={styles.text}>
          {title}
        </AppText>
        <Tappable
          onPress={() => dismissHint(id)}
          accessibilityRole="button"
          accessibilityLabel={t('Forstået. Skjul tippet')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <AppText variant="subhead" weight="600" tone="brandText" maxFontSizeMultiplier={1.3}>
            {t('Forstået')}
          </AppText>
        </Tappable>
      </View>
      <View style={styles.points}>
        {points.map((point) => (
          <View key={point.text} style={styles.point}>
            <Icon name={point.icon} size={17} color={colors.brandText} weight="semibold" style={styles.icon} />
            <AppText variant="subhead" style={styles.text}>
              {point.text}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm, padding: Spacing.lg, borderRadius: Radius.card, borderCurve: 'continuous' },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  points: { gap: Spacing.sm },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  icon: { marginTop: 2 },
  text: { flex: 1 },
});
