import { Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

interface Props extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Opacity while pressed. */
  pressedOpacity?: number;
}

/** Pressable with iOS-style dimming feedback and a pointer cursor on web. */
export function Tappable({ style, pressedOpacity = 0.6, disabled, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        Platform.OS === 'web' ? ({ cursor: disabled ? 'default' : 'pointer' } as ViewStyle) : null,
        style,
        pressed && !disabled ? { opacity: pressedOpacity } : null,
        disabled ? { opacity: 0.45 } : null,
      ]}
      {...rest}
    />
  );
}
