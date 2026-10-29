import { Platform, useWindowDimensions, type ViewStyle } from 'react-native';

import { MaxContentWidth, ReadableWidth, ScreenPadding, WideLayout } from '@/constants/theme';

/**
 * The width the app lays out in – the window on iPhone, iPhone Duo and iPad, the phone-sized
 * column on the web demo – and whether it is wide enough to use the room beside the content.
 * Folding or unfolding a Duo only resizes the window, so screens just re-render.
 */
export function useLayout() {
  const window = useWindowDimensions();
  const width = Platform.OS === 'web' ? Math.min(window.width, MaxContentWidth) : window.width;
  const wide = width >= WideLayout;
  const roomy = width > ReadableWidth;
  /** On screens wider than a readable column (open iPhone Duo held sideways, iPad), centres it. */
  const column: ViewStyle | undefined = roomy
    ? { width: '100%', maxWidth: ReadableWidth, alignSelf: 'center' }
    : undefined;
  /** Side padding for full-width bars, so their buttons line up with `column`. */
  const gutter = roomy ? (width - ReadableWidth) / 2 + ScreenPadding : ScreenPadding;
  return { width, wide, column, gutter };
}
