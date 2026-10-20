import { useColorScheme } from 'react-native';

import { Colors, type Palette } from '@/constants/theme';

export function useTheme(): Palette {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Colors.dark : Colors.light;
}

export function useIsDark(): boolean {
  return useColorScheme() === 'dark';
}
