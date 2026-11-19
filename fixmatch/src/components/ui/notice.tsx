import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';
import { Tappable } from './tappable';
import { AppText } from './text';

interface Props {
  text: string;
  icon?: IconName;
  /** One optional text button at the end of the note, e.g. "Vælg by". */
  action?: { label: string; onPress: () => void; accessibilityLabel?: string; disabled?: boolean };
  /** On the coloured panel: white text and icon (`onPanelSoft`). */
  onPanel?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * A quiet note: a small grey icon and secondary text, with no fill and no border. Use it
 * for demo disclosures and side notes instead of tinted banners, so colour keeps its meaning
 * (live status, warnings) and every screen says "good to know" the same way.
 */
export function Notice({ text, icon = 'info', action, onPanel = false, style }: Props) {
  const colors = useTheme();
  return (
    <View style={[styles.row, style]}>
      <Icon
        name={icon}
        size={15}
        color={onPanel ? colors.onPanelSoft : colors.textTertiary}
        weight="semibold"
        style={styles.icon}
      />
      <AppText variant="footnote" tone={onPanel ? 'onPanelSoft' : 'textSecondary'} style={styles.text}>
        {text}
      </AppText>
      {action ? (
        <Tappable
          onPress={action.onPress}
          disabled={action.disabled}
          accessibilityLabel={action.accessibilityLabel ?? action.label}
          // The label sits on the first line of the note; the slop gives it a 44 pt target.
          hitSlop={{ top: 13, bottom: 13, left: Spacing.sm, right: Spacing.sm }}
          style={styles.action}>
          <AppText variant="footnote" weight="600" tone={onPanel ? 'onPanel' : 'brandText'} maxFontSizeMultiplier={1.3}>
            {action.label}
          </AppText>
        </Tappable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  icon: { marginTop: 2 },
  text: { flex: 1 },
  action: { paddingLeft: Spacing.xs },
});
