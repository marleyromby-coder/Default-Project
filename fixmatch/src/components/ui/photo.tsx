import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { photoAlt, photoSource } from '@/data/photos';
import { useTheme } from '@/hooks/use-theme';
import type { CategoryId } from '@/lib/types';

import { Icon } from './icon';

interface Props {
  photo: string;
  category: CategoryId;
  style?: StyleProp<ViewStyle>;
  width?: number;
  /** Darken the bottom so white text on top stays readable. */
  scrim?: boolean;
  alt?: string;
}

/**
 * Photo with a branded placeholder underneath. If the photo cannot load
 * (offline, blocked CDN) the placeholder simply stays visible.
 */
export function Photo({ photo, category, style, width = 800, scrim, alt }: Props) {
  const colors = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.brandSoft }, style]}>
      <LinearGradient
        colors={[colors.brandSoft, colors.surfaceAlt]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.placeholderIcon} importantForAccessibility="no-hide-descendants">
        <Icon name={category} size={28} color={colors.brand} />
      </View>
      <Image
        source={photoSource(photo, width)}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={250}
        cachePolicy="memory-disk"
        recyclingKey={photo}
        accessibilityLabel={alt ?? photoAlt(photo, 'Foto')}
      />
      {scrim ? (
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.72)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  placeholderIcon: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', opacity: 0.55 },
});
