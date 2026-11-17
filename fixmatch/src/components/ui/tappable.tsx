import { Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

interface Props extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Opacity while pressed. */
  pressedOpacity?: number;
  /** Fade to 45 % when disabled. Off for controls that draw their own disabled look, like Button. */
  dimWhenDisabled?: boolean;
}

/** Pressable with iOS-style dimming feedback and a pointer cursor on web. */
export function Tappable({ style, pressedOpacity = 0.6, dimWhenDisabled = true, disabled, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        Platform.OS === 'web' ? ({ cursor: disabled ? 'default' : 'pointer' } as ViewStyle) : null,
        style,
        pressed && !disabled ? { opacity: pressedOpacity } : null,
        disabled && dimWhenDisabled ? { opacity: 0.45 } : null,
      ]}
      {...rest}
    />
  );
}
