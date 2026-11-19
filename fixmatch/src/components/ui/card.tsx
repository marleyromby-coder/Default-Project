import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';

import { AppText } from './text';

interface CardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  /**
   * `raised` adds the stronger shadow of a card that floats over the panel (the search card,
   * the business page's stats); `flat` drops the shadow, e.g. for a card inside a card.
   */
  elevation?: 'flat' | 'card' | 'raised';
}

/**
 * A white surface (dark green-grey in dark mode) with a soft shadow in light mode. In dark mode
 * surfaces separate by colour alone.
 */
export function Card({ children, style, padded = true, elevation = 'card' }: CardProps) {
  const colors = useTheme();
  const shadows = Shadows[useIsDark() ? 'dark' : 'light'];
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        elevation === 'flat' ? null : { boxShadow: shadows[elevation] },
        padded ? styles.padded : null,
        style,
      ]}>
      {children}
    </View>
  );
}

interface CardTitleProps {
  title: string;
  trailing?: React.ReactNode;
}

/** A card's title in Schibsted Grotesk. No icon: the words say what the card is, like the section titles in iOS. */
export function CardTitle({ title, trailing }: CardTitleProps) {
  return (
    <View style={styles.titleRow}>
      <AppText variant="headline" display style={styles.titleText} accessibilityRole="header">
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
  // Surfaces separate from the background by fill and a soft shadow, not by an outline.
  card: { borderRadius: Radius.lg, borderCurve: 'continuous', overflow: 'hidden' },
  padded: { padding: Spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  titleText: { flex: 1 },
});
