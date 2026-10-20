import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Photo } from '@/components/ui/photo';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Category } from '@/lib/types';

interface Props {
  category: Category;
  nearby: number;
}

export function CategoryTile({ category, nearby }: Props) {
  const colors = useTheme();
  const count = nearby === 1 ? '1 i nærheden' : `${nearby} i nærheden`;
  return (
    <Tappable
      onPress={() => router.push({ pathname: '/kategori/[id]', params: { id: category.id } })}
      accessibilityLabel={`${category.plural}. ${category.description}. ${count}`}
      pressedOpacity={0.8}
      style={styles.tile}>
      <Photo photo={category.photo} category={category.id} width={600} scrim style={StyleSheet.absoluteFill} alt="" />
      <View style={[styles.iconBadge, { backgroundColor: colors.surface }]}>
        <Icon name={category.id} size={15} color={colors.brand} weight="semibold" />
      </View>
      <View style={styles.text}>
        <AppText variant="headline" style={styles.white} numberOfLines={1}>
          {category.name}
        </AppText>
        <AppText variant="caption" style={styles.whiteSoft} numberOfLines={1}>
          {count}
        </AppText>
      </View>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 1.25,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  iconBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { padding: Spacing.md, gap: 1 },
  white: { color: '#FFFFFF' },
  whiteSoft: { color: 'rgba(255,255,255,0.88)' },
});
