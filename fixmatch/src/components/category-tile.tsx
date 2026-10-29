import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

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
 * A trade on the home screen, four to a row: the icon in pine, the name, and how many
 * businesses are nearby in the corner. One colour for all trades keeps the grid calm.
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
      style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.top}>
        <Icon name={category.id} size={22} color={colors.brand} weight="semibold" />
        {nearby > 0 ? (
          <AppText variant="caption2" tone="textTertiary" tabular maxFontSizeMultiplier={1.2}>
            {nearby}
          </AppText>
        ) : null}
      </View>
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
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
});
