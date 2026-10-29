import { requireOptionalNativeModule } from 'expo';
import type { Widget } from 'expo-widgets';
import { Platform } from 'react-native';

import { quickHelpProps, savedProps, widgetTimeline, type WidgetInput } from './props';
import type { QuickHelpProps, SavedProps } from './types';

interface Widgets {
  quickHelp: Widget<QuickHelpProps>;
  saved: Widget<SavedProps>;
}

let widgets: Widgets | null | undefined;

/**
 * The widgets exist only in iOS builds (TestFlight and the App Store), not in Expo Go or on
 * the web. The widget modules are loaded lazily, because creating a widget needs the native
 * ExpoWidgets module.
 */
function loadWidgets(): Widgets | null {
  if (widgets !== undefined) return widgets;
  widgets = null;
  if (Platform.OS !== 'ios' || !requireOptionalNativeModule('ExpoWidgets')) return widgets;
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    widgets = {
      quickHelp: require('./quick-help').quickHelpWidget,
      saved: require('./saved').savedWidget,
    };
    /* eslint-enable @typescript-eslint/no-require-imports */
  } catch {
    widgets = null;
  }
  return widgets;
}

/** Sends the current location, language and saved businesses to the widgets. */
export function syncWidgets(input: WidgetInput, now: Date = new Date()): void {
  const loaded = loadWidgets();
  if (!loaded) return;
  try {
    loaded.quickHelp.updateTimeline(widgetTimeline((date) => quickHelpProps(input, date), now));
    loaded.saved.updateTimeline(widgetTimeline((date) => savedProps(input, date), now));
  } catch {
    // A widget that cannot update keeps its last content; the app must never crash for it.
  }
}
