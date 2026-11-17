import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * System haptics, used sparingly like iOS does: a tick when a choice changes, a light tap
 * for small toggles, and a notification when something is saved or a limit is hit.
 * Every call is a no-op on the web demo and never throws.
 */
function run(feedback: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  try {
    feedback().catch(() => undefined);
  } catch {
    // The native module is missing (e.g. in tests): no feedback, no error.
  }
}

/** A choice changed: a chip, a segment, a call button. */
export function select() {
  run(() => Haptics.selectionAsync());
}

/** A small toggle, like saving a business with the heart. */
export function tap() {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Something was created, sent or saved. */
export function success() {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** A limit was hit, e.g. comparing more than three businesses. */
export function warning() {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}
