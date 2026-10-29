/**
 * Props sent from the app to the home and lock screen widgets. Everything is plain JSON and
 * already translated and formatted, because the widget layouts run in a small JS runtime
 * inside the widget extension without the app's code (see expo-widgets).
 */

export interface WidgetTrade {
  id: string;
  label: string;
  /** SF Symbol name. */
  symbol: string;
  url: string;
}

/** Colours of a business mark, see markTone in src/constants/trade-colors.ts. */
export interface WidgetMarkTone {
  background: string;
  letters: string;
}

export interface WidgetBusiness {
  id: string;
  name: string;
  initials: string;
  /** The widget picks the tone for its own light or dark appearance. */
  mark: { light: WidgetMarkTone; dark: WidgetMarkTone };
  trade: string;
  /** "Åben til 16.00", "Åbner i morgen kl. 7.00" … at the time of the timeline entry. */
  status: string;
  open: boolean;
  price: string;
  url: string;
}

export interface QuickHelpProps {
  place: string;
  describe: string;
  describeHint: string;
  describeUrl: string;
  /** Short button label in the medium and large widgets. */
  describeShort: string;
  tradesTitle: string;
  trades: WidgetTrade[];
  urgent: string;
  urgentHint: string;
  urgentUrl: string;
  saved: WidgetBusiness[];
  savedTitle: string;
}

export interface SavedProps {
  title: string;
  empty: string;
  emptyHint: string;
  /** "2 åbne nu". */
  openSummary: string;
  saved: WidgetBusiness[];
  appUrl: string;
}
