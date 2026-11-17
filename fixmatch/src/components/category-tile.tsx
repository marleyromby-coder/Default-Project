import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Category } from '@/lib/types';
import { t } from '@/i18n';

interface Props {
  category: Category;
  nearby: number;
}

/**
 * A trade on the home screen, four to a row: the icon in pine and the name. How many
 * businesses are nearby is read out by VoiceOver. One colour for all trades keeps the grid calm.
 */
export function CategoryTile({ category, nearby }: Props) {
  const colors = useTheme();
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
      style={[styles.tile, { backgroundColor: colors.surface }]}>
      <Icon name={category.id} size={22} color={colors.brand} weight="semibold" />
      <AppText
        variant="caption"
        weight="600"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        maxFontSizeMultiplier={1.3}>
        {category.name}
      </AppText>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 76,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
});
