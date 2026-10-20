import { View } from 'react-native';
import Svg, { ClipPath, Defs, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

const STAR = 'M12 2.5l2.94 6.12 6.56.83-4.82 4.62 1.2 6.53L12 17.4l-5.88 3.2 1.2-6.53L2.5 9.45l6.56-.83z';

interface Props {
  value: number;
  size?: number;
}

/** Five stars with partial fill, e.g. 4.3 → four full stars and one 30 % star. Decorative only. */
export function Stars({ value, size = 14 }: Props) {
  const colors = useTheme();
  const gap = Math.round(size * 0.12);
  return (
    <View style={{ flexDirection: 'row', gap }} accessible={false} importantForAccessibility="no-hide-descendants">
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.max(0, Math.min(1, value - index));
        const id = `clip-${index}-${Math.round(fill * 100)}`;
        return (
          <Svg key={index} width={size} height={size} viewBox="0 0 24 24">
            <Defs>
              <ClipPath id={id}>
                <Rect x="0" y="0" width={24 * fill} height="24" />
              </ClipPath>
            </Defs>
            <Path d={STAR} fill={colors.starEmpty} />
            {fill > 0 ? <Path d={STAR} fill={colors.star} clipPath={`url(#${id})`} /> : null}
          </Svg>
        );
      })}
    </View>
  );
}
