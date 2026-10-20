import { Alert, Platform } from 'react-native';

export interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

/**
 * Alert.alert on iOS/Android. React Native Web has no Alert, so the browser's
 * own dialogs are used there (confirm() when there is a choice to make).
 */
export function showDialog(title: string, message: string, buttons: DialogButton[] = [{ text: 'OK' }]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  const action = buttons.find((b) => b.style !== 'cancel');
  const cancel = buttons.find((b) => b.style === 'cancel');
  if (buttons.length > 1 && action) {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) action.onPress?.();
    else cancel?.onPress?.();
    return;
  }
  globalThis.alert?.(`${title}\n\n${message}`);
  action?.onPress?.();
}
