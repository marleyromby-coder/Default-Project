import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { AppText } from '@/components/ui/text';
import { MinTouchSize, Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { isCategoryId } from '@/data/categories';
import { useResults } from '@/hooks/use-results';
import { useTheme } from '@/hooks/use-theme';
import { TRUSTPILOT_ENABLED } from '@/lib/features';
import { DEFAULT_FILTERS, DISTANCE_OPTIONS, RATING_OPTIONS } from '@/lib/filters';
import type { Filters } from '@/lib/types';
import { useApp } from '@/state/app-state';
import { t } from '@/i18n';

const PRICE_OPTIONS: { value: Filters['priceLevel']; label: string }[] = [
  { value: null, label: t('Alle') },
  { value: 1, label: t('Lavt') },
  { value: 2, label: t('Middel') },
  { value: 3, label: t('Højt') },
];

export default function FiltersScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { kategori } = useLocalSearchParams<{ kategori?: string }>();
  const { state, setFilters } = useApp();
  const [draft, setDraft] = useState<Filters>(state.filters);
  const category = kategori && isCategoryId(kategori) ? kategori : undefined;
  const preview = useResults(category, 'match', draft);

  const update = (patch: Partial<Filters>) => setDraft({ ...draft, ...patch });
  const apply = () => {
    setFilters(draft);
    router.back();
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Group title={t('Maks. afstand')}>
          <View style={styles.options}>
            {DISTANCE_OPTIONS.map((o) => (
              <Chip
                key={o.label}
                label={o.label}
                selected={draft.maxDistanceKm === o.value}
                onPress={() => update({ maxDistanceKm: o.value })}
              />
            ))}
          </View>
        </Group>
        {TRUSTPILOT_ENABLED ? (
          <Group title={t('Mindst TrustScore')}>
            <View style={styles.options}>
              {RATING_OPTIONS.map((o) => (
                <Chip
                  key={o.label}
                  label={o.label}
                  selected={draft.minRating === o.value}
                  onPress={() => update({ minRating: o.value })}
                />
              ))}
            </View>
          </Group>
        ) : null}
        <Group title={t('Prisniveau')}>
          <View style={styles.options}>
            {PRICE_OPTIONS.map((o) => (
              <Chip
                key={o.label}
                label={o.label}
                selected={draft.priceLevel === o.value}
                onPress={() => update({ priceLevel: o.value })}
              />
            ))}
          </View>
          <AppText variant="caption" tone="textSecondary">
            {t('Sammenlignet med den typiske timepris i faget.')}
          </AppText>
        </Group>
        <View style={[styles.switches, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SwitchRow
            label={t('Åben nu')}
            hint={t('Virksomheder med døgnvagt tæller med')}
            value={draft.openNow}
            onChange={(v) => update({ openNow: v })}
          />
          <Divider inset={Spacing.lg} />
          <SwitchRow
            label={t('Døgnvagt')}
            hint={t('Kan ringes op uden for åbningstid')}
            value={draft.emergency}
            onChange={(v) => update({ emergency: v })}
          />
          <Divider inset={Spacing.lg} />
          <SwitchRow
            label={t('Kun autoriserede')}
            hint={t('Fx autoriseret til el, VVS eller gas')}
            value={draft.authorizedOnly}
            onChange={(v) => update({ authorizedOnly: v })}
          />
          {TRUSTPILOT_ENABLED ? (
            <>
              <Divider inset={Spacing.lg} />
              <SwitchRow
                label={t('Kun med Trustpilot-profil')}
                value={draft.trustpilotOnly}
                onChange={(v) => update({ trustpilotOnly: v })}
              />
            </>
          ) : null}
        </View>
      </ScrollView>
      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, Spacing.lg),
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}>
        <Button title={t('Nulstil')} variant="secondary" onPress={() => setDraft(DEFAULT_FILTERS)} />
        <Button
          title={t('Vis {count} resultater', { count: preview.items.length })}
          onPress={apply}
          style={styles.flex}
        />
      </View>
    </View>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <AppText variant="headline" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

function SwitchRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const colors = useTheme();
  return (
    <View style={styles.switchRow}>
      <View style={styles.flex}>
        <AppText variant="body">{label}</AppText>
        {hint ? (
          <AppText variant="footnote" tone="textSecondary">
            {hint}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.brandStrong }}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.xl, paddingTop: Spacing.xl },
  group: { gap: Spacing.sm },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  switches: { borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: MinTouchSize + 12,
    paddingVertical: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
