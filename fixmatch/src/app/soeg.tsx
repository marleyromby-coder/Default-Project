import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/ui/chip';
import { Divider } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, type IconName } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { MinTouchSize, Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { CATEGORIES, getCategory } from '@/data/categories';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { formatPriceRange } from '@/lib/format';
import { summarizeJobPrice } from '@/lib/prices';
import { search, SEARCH_SUGGESTIONS } from '@/lib/search';
import { t } from '@/i18n';
import { countryOf } from '@/lib/business-text';
import { useApp, useMarket } from '@/state/app-state';

export default function SearchScreen() {
  const { column } = useLayout();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const { country, market } = useMarket();
  const local = useMemo(() => state.businesses.filter((b) => countryOf(b) === country), [state.businesses, country]);
  const results = useMemo(() => search(query, local), [query, local]);
  const hasQuery = query.trim().length >= 2;
  const empty = hasQuery && results.categories.length + results.jobs.length + results.businesses.length === 0;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const goCategory = (id: string, job?: string) => {
    router.back();
    router.push({ pathname: '/kategori/[id]', params: job ? { id, job } : { id } });
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.searchRow}>
        <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon name="search" size={18} color={colors.textSecondary} weight="semibold" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('Opgave, fag eller virksomhed')}
            placeholderTextColor={colors.textTertiary}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel={t('Søg')}
            style={[styles.input, { color: colors.text }]}
          />
        </View>
        <Tappable onPress={close} accessibilityLabel={t('Annuller søgning')} style={styles.cancel}>
          <AppText variant="body" tone="brandText">
            {t('Annuller')}
          </AppText>
        </Tappable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, column, { paddingBottom: insets.bottom + 40 }]}>
        {!hasQuery ? (
          <>
            <AppText variant="footnote" tone="textSecondary" style={styles.label}>
              {t('Populære søgninger')}
            </AppText>
            <View style={styles.suggestions}>
              {SEARCH_SUGGESTIONS.map((s) => (
                <Chip key={s} label={s} onPress={() => setQuery(s)} />
              ))}
            </View>
            <AppText variant="footnote" tone="textSecondary" style={styles.label}>
              {t('Alle fag')}
            </AppText>
            <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {CATEGORIES.map((c, i) => (
                <View key={c.id}>
                  {i > 0 ? <Divider inset={52} /> : null}
                  <ResultRow icon={c.id} title={c.plural} subtitle={c.description} onPress={() => goCategory(c.id)} />
                </View>
              ))}
            </View>
          </>
        ) : null}

        {empty ? (
          <EmptyState
            icon="search"
            title={t('Ingen resultater')}
            message={t('Prøv et andet ord, fx “vandhane”, “bremser” eller “tag”.')}
          />
        ) : null}

        {results.jobs.length > 0 ? (
          <ResultGroup title={t('Opgaver')}>
            {results.jobs.map(({ category, job }) => {
              const price = summarizeJobPrice(
                job,
                local.filter((b) => b.categories.includes(category.id)),
                market,
              );
              return (
                <ResultRow
                  key={`${category.id}-${job.id}`}
                  icon={category.id}
                  title={job.name}
                  subtitle={t('{name} · typisk {priceRange}', {
                    name: category.name,
                    priceRange: formatPriceRange(price.min, price.max, price.unit, price.currency),
                  })}
                  onPress={() => goCategory(category.id, job.id)}
                />
              );
            })}
          </ResultGroup>
        ) : null}

        {results.categories.length > 0 ? (
          <ResultGroup title={t('Fag')}>
            {results.categories.map((c) => (
              <ResultRow
                key={c.id}
                icon={c.id}
                title={c.plural}
                subtitle={c.description}
                onPress={() => goCategory(c.id)}
              />
            ))}
          </ResultGroup>
        ) : null}

        {results.businesses.length > 0 ? (
          <ResultGroup title={t('Virksomheder')}>
            {results.businesses.map((b) => (
              <ResultRow
                key={b.id}
                icon={b.categories[0]}
                title={b.name}
                subtitle={t('{name} · {city}', { name: getCategory(b.categories[0])?.name, city: b.address.city })}
                onPress={() => {
                  router.back();
                  router.push({ pathname: '/virksomhed/[id]', params: { id: b.id } });
                }}
              />
            ))}
          </ResultGroup>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode[] }) {
  const colors = useTheme();
  return (
    <View style={styles.resultGroup}>
      <AppText variant="subhead" weight="600" tone="textSecondary" style={styles.label} accessibilityRole="header">
        {title}
      </AppText>
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children.map((child, i) => (
          <View key={i}>
            {i > 0 ? <Divider inset={52} /> : null}
            {child}
          </View>
        ))}
      </View>
    </View>
  );
}

function ResultRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <Tappable
      onPress={onPress}
      accessibilityLabel={t('{title}, {subtitle}', { title, subtitle })}
      pressedOpacity={0.5}
      style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: colors.brandSoft }]}>
        <Icon name={icon} size={16} color={colors.brand} weight="semibold" />
      </View>
      <View style={styles.flex}>
        <AppText variant="body" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <Icon name="chevronRight" size={13} color={colors.textTertiary} weight="semibold" />
    </Tappable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: ScreenPadding },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 44,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
  },
  input: { flex: 1, fontSize: 17, minHeight: 44, outlineStyle: 'none' } as never,
  cancel: { minHeight: MinTouchSize, justifyContent: 'center' },
  content: { padding: ScreenPadding, gap: Spacing.md },
  label: { letterSpacing: 0.3, paddingHorizontal: Spacing.xs },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  group: { borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  resultGroup: { gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 56,
    paddingVertical: Spacing.sm,
  },
  rowIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
