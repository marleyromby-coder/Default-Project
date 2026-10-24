import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { TRUSTPILOT_ENABLED } from '@/lib/features';
import { PRIORITY_PRESETS, weightsFromPriorities } from '@/lib/ranking';
import type { Priorities } from '@/lib/types';
import { useApp } from '@/state/app-state';
import { t } from '@/i18n';

const FACTORS: { key: keyof Priorities; label: string; hint: string; icon: IconName }[] = [
  { key: 'price', label: t('Lav pris'), hint: t('Timepris inkl. moms'), icon: 'tag' },
  { key: 'distance', label: t('Kort afstand'), hint: t('Afstand fra din placering'), icon: 'pin' },
  { key: 'reviews', label: t('Gode anmeldelser'), hint: t('TrustScore på Trustpilot'), icon: 'star' },
];

const LEVELS = [t('Lidt'), t('Noget'), t('Middel'), t('Meget'), t('Mest')];

export default function PrioritiesScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { state, setPriorities } = useApp();
  const [draft, setDraft] = useState<Priorities>(state.priorities);
  const weights = weightsFromPriorities(draft);

  const save = () => {
    setPriorities(draft);
    router.back();
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="subhead" tone="textSecondary">
          {t('Hvad betyder mest for dig? FixMatch-scoren og rækkefølgen tilpasser sig dine valg.')}
        </AppText>

        <View style={styles.presets}>
          {PRIORITY_PRESETS.map((preset) => {
            const p = preset.priorities;
            const selected = p.price === draft.price && p.distance === draft.distance && p.reviews === draft.reviews;
            return <Chip key={preset.id} label={preset.label} selected={selected} onPress={() => setDraft(p)} />;
          })}
        </View>

        {FACTORS.filter((f) => TRUSTPILOT_ENABLED || f.key !== 'reviews').map((factor) => (
          <View
            key={factor.key}
            style={[styles.factor, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.factorHeader}>
              <View style={[styles.factorIcon, { backgroundColor: colors.brandSoft }]}>
                <Icon name={factor.icon} size={16} color={colors.brand} weight="semibold" />
              </View>
              <View style={styles.flex}>
                <AppText variant="headline">{factor.label}</AppText>
                <AppText variant="footnote" tone="textSecondary">
                  {factor.hint}
                </AppText>
              </View>
              <AppText variant="title3" rounded tabular tone="brandText">
                {Math.round(weights[factor.key] * 100)} %
              </AppText>
            </View>
            <View
              style={styles.levels}
              accessibilityRole="radiogroup"
              accessibilityLabel={t('Vigtighed af {label}', { label: factor.label.toLowerCase() })}>
              {LEVELS.map((level, index) => {
                const value = index + 1;
                const selected = draft[factor.key] === value;
                return (
                  <Tappable
                    key={level}
                    onPress={() => setDraft({ ...draft, [factor.key]: value })}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    aria-checked={selected}
                    accessibilityLabel={t('{level} vigtigt', { level })}
                    style={[
                      styles.level,
                      selected
                        ? { backgroundColor: colors.brandStrong, borderColor: colors.brandStrong }
                        : { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                    ]}>
                    <AppText
                      variant="caption"
                      weight="600"
                      style={{ color: selected ? colors.onBrand : colors.textSecondary }}
                      maxFontSizeMultiplier={1.2}>
                      {level}
                    </AppText>
                  </Tappable>
                );
              })}
            </View>
          </View>
        ))}

        <AppText variant="caption" tone="textSecondary">
          {t('Vægtene lægges sammen til 100 %. Betaling påvirker aldrig rækkefølgen.')}
        </AppText>
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
        <Button title={t('Gem prioriteter')} onPress={save} block />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.lg, paddingTop: Spacing.xl },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  factor: { borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.lg, gap: Spacing.md },
  factorHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  factorIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  levels: { flexDirection: 'row', gap: 6 },
  level: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { paddingHorizontal: ScreenPadding, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
});
