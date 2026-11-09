import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { DRIVE_ADVICE, type DriveAdvice, type LampColor, WARNING_LAMPS } from '@/data/warning-lamps';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { countryOf } from '@/lib/business-text';
import { formatPrice, formatPriceRange } from '@/lib/format';
import { summarizeJobPrice } from '@/lib/prices';
import { useApp, useMarket } from '@/state/app-state';
import { useSharedPrices } from '@/state/community';
import { t } from '@/i18n';

const LAMP_COLOR: Record<LampColor, string> = { red: '#D23B2F', yellow: '#E0A526', blue: '#2F6FD2' };

/**
 * "Advarselslampe i bilen": what the lamp means, whether you can drive on, what it typically
 * costs, and a button to the mechanics nearby. Picking the lamp from the list; a photo of the
 * dashboard can come later.
 */
export default function WarningLampsScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const { state } = useApp();
  const { country, market } = useMarket();
  const shared = useSharedPrices();
  const [open, setOpen] = useState<string>();
  const mechanics = getCategory('mekaniker');
  const garages = state.businesses.filter((b) => countryOf(b) === country && b.categories.includes('mekaniker'));
  const adviceTone: Record<DriveAdvice, string> = { stop: colors.danger, soon: colors.warning, ok: colors.success };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, column, { paddingBottom: insets.bottom + Spacing.xxl }]}
      contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: t('Advarselslampe i bilen') }} />
      <AppText variant="callout" tone="textSecondary">
        {t('Lyser der en lampe? Find den her, og se, om du kan køre videre, og hvad det typisk koster at få ordnet.')}
      </AppText>
      <View style={styles.legend}>
        {(
          [
            ['red', t('Rød: stop')],
            ['yellow', t('Gul: få det tjekket')],
          ] as const
        ).map(([color, label]) => (
          <View key={color} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: LAMP_COLOR[color] }]} />
            <AppText variant="caption" tone="textSecondary">
              {label}
            </AppText>
          </View>
        ))}
      </View>

      {WARNING_LAMPS.map((lamp) => {
        const expanded = open === lamp.id;
        const job = mechanics?.jobs.find((j) => j.id === lamp.job);
        const paid = shared
          .filter((r) => r.country === market.country && job && r.job === job.id)
          .map((r) => ({ job: r.job, total: r.total, quantity: r.quantity }));
        const typical = job ? summarizeJobPrice(job, garages, market, paid) : undefined;
        return (
          <View key={lamp.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Tappable
              onPress={() => setOpen(expanded ? undefined : lamp.id)}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityLabel={`${t(lamp.name)}. ${t(DRIVE_ADVICE[lamp.advice])}`}
              pressedOpacity={0.7}
              style={styles.head}>
              <View style={[styles.lamp, { backgroundColor: colors.ink }]}>
                <Icon name={lamp.icon} size={22} color={LAMP_COLOR[lamp.color]} weight="semibold" />
              </View>
              <View style={styles.flex}>
                <AppText variant="headline">{t(lamp.name)}</AppText>
                <AppText variant="footnote" weight="600" style={{ color: adviceTone[lamp.advice] }}>
                  {t(DRIVE_ADVICE[lamp.advice])}
                </AppText>
              </View>
              <Icon
                name={expanded ? 'chevronUp' : 'chevronDown'}
                size={14}
                color={colors.textTertiary}
                weight="semibold"
              />
            </Tappable>
            {expanded ? (
              <View style={styles.body}>
                <AppText variant="subhead">{t(lamp.meaning)}</AppText>
                <View style={[styles.advice, { backgroundColor: colors.surfaceAlt }]}>
                  <Icon name="warning" size={15} color={adviceTone[lamp.advice]} weight="semibold" />
                  <AppText variant="subhead" style={styles.flex}>
                    {t(lamp.adviceText)}
                  </AppText>
                </View>
                {lamp.costMax > 0 ? (
                  <AppText variant="footnote" tone="textSecondary">
                    {job && typical
                      ? t('{job} koster typisk {range}. Selve reparationen kommer oveni og ligger oftest på {cost}.', {
                          job: job.name,
                          range: formatPriceRange(typical.min, typical.max, typical.unit, typical.currency),
                          cost: formatPriceRange(lamp.costMin, lamp.costMax, 'opgave', market.currency),
                        })
                      : t('Det koster typisk {cost} at få ordnet, alt efter årsagen.', {
                          cost: formatPriceRange(lamp.costMin, lamp.costMax, 'opgave', market.currency),
                        })}
                  </AppText>
                ) : lamp.costMin === 0 && lamp.costMax === 0 ? null : (
                  <AppText variant="footnote" tone="textSecondary">
                    {t('Koster op til {cost}.', { cost: formatPrice(lamp.costMax, market.currency) })}
                  </AppText>
                )}
                {mechanics && lamp.job ? (
                  <Button
                    title={lamp.advice === 'stop' ? t('Find nærmeste mekaniker') : t('Find en mekaniker')}
                    icon="mekaniker"
                    size="small"
                    onPress={() =>
                      router.push({
                        pathname: '/kategori/[id]',
                        params: { id: 'mekaniker', job: lamp.job!, ...(lamp.advice === 'stop' ? { akut: '1' } : {}) },
                      })
                    }
                  />
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}

      <AppText variant="caption" tone="textSecondary" align="center">
        {t(
          'Generelle råd. Bilens instruktionsbog og værkstedet ved mest om netop din bil. Ved fare for liv: ring {number}.',
          {
            number: market.emergencyNumber,
          },
        )}
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.sm },
  legend: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  card: { borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  lamp: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  body: { gap: Spacing.sm, marginTop: Spacing.md },
  advice: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.md },
});
