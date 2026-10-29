import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { tradeTone } from '@/constants/trade-colors';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import type { Category } from '@/lib/types';
import { t } from '@/i18n';

interface Props {
  category: Category;
  nearby: number;
}

/** A trade on the home screen: its icon in the trade colour (the same as on the map), name and count. */
export function CategoryTile({ category, nearby }: Props) {
  const colors = useTheme();
  const tone = tradeTone(category.id, useIsDark() ? 'dark' : 'light');
  const count = nearby === 1 ? t('1 i nærheden') : t('{nearby} i nærheden', { nearby });
  return (
    <Tappable
      onPress={() => router.push({ pathname: '/kategori/[id]', params: { id: category.id } })}
      accessibilityLabel={t('{plural}. {description}. {count}', {
        plural: category.plural,
        description: category.description,
        count,
      })}
      pressedOpacity={0.7}
      style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.icon, { backgroundColor: tone.soft }]}>
        <Icon name={category.id} size={22} color={tone.onSoft} weight="semibold" />
      </View>
      <View style={styles.text}>
        <AppText variant="headline" numberOfLines={1}>
          {category.name}
        </AppText>
        <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
          {count}
        </AppText>
      </View>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 112,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { gap: 1 },
});
