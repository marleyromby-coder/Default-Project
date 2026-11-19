import { useColorScheme } from 'react-native';

import { Colors, type Palette, type TradeColor, TradeColors } from '@/constants/theme';
import type { CategoryId } from '@/lib/types';
import { useAppearance } from '@/state/appearance';

/** Light or dark: the user's choice under Profil → Udseende, otherwise the phone's setting. */
export function useIsDark(): boolean {
  const system = useColorScheme();
  const preference = useAppearance();
  return preference === 'system' ? system === 'dark' : preference === 'dark';
}

export function useTheme(): Palette {
  return useIsDark() ? Colors.dark : Colors.light;
}

/** The colours of a trade's tile and small trade markers, for the current light/dark mode. */
export function useTradeColor(trade: CategoryId): TradeColor {
  return TradeColors[useIsDark() ? 'dark' : 'light'][trade];
}
