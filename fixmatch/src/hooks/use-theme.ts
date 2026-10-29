import { useColorScheme } from 'react-native';

import { Colors, type Palette } from '@/constants/theme';
import { useAppearance } from '@/state/appearance';

/** Light or dark: the user's choice under Mere → Udseende, otherwise the phone's setting. */
export function useIsDark(): boolean {
  const system = useColorScheme();
  const preference = useAppearance();
  return preference === 'system' ? system === 'dark' : preference === 'dark';
}

export function useTheme(): Palette {
  return useIsDark() ? Colors.dark : Colors.light;
}
