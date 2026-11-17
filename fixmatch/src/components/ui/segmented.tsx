import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Tappable } from './tappable';
import { AppText } from './text';

interface Option<T extends string> {
  value: T;
  label: string;
  accessibilityLabel?: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

/** iOS-style segmented control. */
export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel }: Props<T>) {
  const colors = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { backgroundColor: colors.fill }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Tappable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            pressedOpacity={0.75}
            style={[styles.segment, selected ? [styles.selected, { backgroundColor: colors.fillRaised }] : null]}>
            <AppText
              variant="footnote"
              weight={selected ? '600' : '500'}
              tone={selected ? 'text' : 'textSecondary'}
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}>
              {option.label}
            </AppText>
          </Tappable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: Radius.sm + 2,
    borderCurve: 'continuous',
    padding: 2,
  },
  segment: {
    flex: 1,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.sm,
    borderCurve: 'continuous',
  },
  selected: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});
