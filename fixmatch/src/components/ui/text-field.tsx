import { type ComponentRef, type Ref, useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { MinTouchSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextFieldHandle = ComponentRef<typeof TextInput>;

interface TextFieldProps extends Omit<TextInputProps, 'style' | 'ref'> {
  ref?: Ref<TextFieldHandle>;
  label: string;
  /** Shown under the field, e.g. what the value is used for. */
  hint?: string;
  /** Replaces the hint in red when the value is wrong. */
  error?: string;
}

/** A labelled text field whose border shows focus, matching the fields in beskriv.tsx. */
export function TextField({ ref, label, hint, error, onFocus, onBlur, ...input }: TextFieldProps) {
  const colors = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrapper}>
      <AppText variant="subhead" weight="600" tone="textSecondary">
        {label}
      </AppText>
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : focused ? colors.brand : colors.border,
          },
        ]}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...input}
          style={[styles.input, input.multiline ? styles.multiline : null, { color: colors.text }]}
        />
      </View>
      {error || hint ? (
        <AppText variant="footnote" tone={error ? 'danger' : 'textTertiary'}>
          {error ?? hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  field: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    minHeight: MinTouchSize + 6,
    justifyContent: 'center',
  },
  // The field's border shows focus, so the browser's own ring is hidden (as in beskriv.tsx).
  input: { fontSize: 17, paddingVertical: Spacing.sm, outlineStyle: 'none' } as never,
  multiline: { minHeight: 88, textAlignVertical: 'top', paddingTop: Spacing.md },
});
