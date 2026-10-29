import { router, Stack } from 'expo-router';
import { Fragment, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Photo } from '@/components/ui/photo';
import { Stars } from '@/components/ui/stars';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { useScored } from '@/hooks/use-results';
import { useTheme } from '@/hooks/use-theme';
import { callBusiness } from '@/lib/contact';
import { TRUSTPILOT_ENABLED } from '@/lib/features';
import { formatDistance, formatNumber, formatPrice, formatPriceRange, formatRating } from '@/lib/format';
import { getOpenStatus } from '@/lib/opening-hours';
import { priceIndex, reviewValue, type ScoredBusiness } from '@/lib/ranking';
import { t } from '@/i18n';
import { businessText, currencyOf, timeZoneOf } from '@/lib/business-text';
import { taxNote } from '@/lib/markets';
import { useApp, useMarket } from '@/state/app-state';

type Best = (items: ScoredBusiness[]) => string | undefined;

function bestBy(items: ScoredBusiness[], value: (s: ScoredBusiness) => number, lowest: boolean): string | undefined {
  if (items.length < 2) return undefined;
  const values = items.map(value);
  const target = lowest ? Math.min(...values) : Math.max(...values);
  const winners = items.filter((_, i) => values[i] === target);
  return winners.length === 1 ? winners[0].business.id : undefined;
}

const bestMatch: Best = (items) => bestBy(items, (s) => s.score, false);
const bestPrice: Best = (items) => bestBy(items, (s) => priceIndex(s.business), true);
const bestDistance: Best = (items) => bestBy(items, (s) => Math.round(s.distanceKm * 10), true);
const bestRating: Best = (items) => bestBy(items, (s) => reviewValue(s.business), false);

export default function CompareScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { state, toggleCompare, clearCompare } = useApp();
  const { market } = useMarket();
  const items = useScored(state.compare);

  if (items.length === 0) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="compare"
          title={t('Intet at sammenligne endnu')}
          message={t('Tryk på “Sammenlign” ved op til tre virksomheder i et fag, så vises de her side om side.')}
          action={<Button title={t('Find virksomheder')} onPress={() => router.dismissTo('/')} />}
        />
      </View>
    );
  }

  // A job every compared business has priced, so prices can be compared like for like.
  const sharedJob = items[0].business.pricing.examples.find((example) =>
    items.every((s) => s.business.pricing.examples.some((e) => e.job && e.job === example.job)),
  );
  const winners = {
    match: bestMatch(items),
    price: bestPrice(items),
    distance: bestDistance(items),
    rating: bestRating(items),
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Tappable onPress={clearCompare} accessibilityLabel={t('Ryd sammenligning')} style={styles.headerButton}>
              <AppText variant="body" tone="brandText">
                {t('Ryd')}
              </AppText>
            </Tappable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}>
        <View style={styles.columns}>
          {items.map(({ business }) => (
            <View
              key={business.id}
              style={[styles.headerCell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Photo photo={business.photo} category={business.categories[0]} width={400} style={styles.photo} />
              <Tappable
                onPress={() => toggleCompare(business.id)}
                accessibilityLabel={t('Fjern {name} fra sammenligning', { name: business.name })}
                style={styles.remove}>
                <Icon name="close" size={12} color="#0E1726" weight="bold" />
              </Tappable>
              <View style={styles.headerText}>
                <AppText variant="footnote" weight="700" numberOfLines={2}>
                  {business.name}
                </AppText>
                <AppText variant="caption" tone="textSecondary" numberOfLines={1}>
                  {getCategory(business.categories[0])?.name}
                </AppText>
              </View>
            </View>
          ))}
        </View>

        <Row label={t('Match-score')}>
          {items.map((s) => (
            <Value key={s.business.id} best={winners.match === s.business.id} bestLabel={t('Bedste match')}>
              <AppText variant="title3" rounded tabular>
                {s.score}
              </AppText>
            </Value>
          ))}
        </Row>
        <Row label={t('Timepris {tax}', { tax: taxNote(market) })}>
          {items.map((s) => (
            <Value key={s.business.id} best={winners.price === s.business.id} bestLabel={t('Billigst')}>
              <AppText variant="subhead" weight="600">
                {formatPriceRange(
                  s.business.pricing.hourlyMin,
                  s.business.pricing.hourlyMax,
                  'opgave',
                  currencyOf(s.business),
                )}
              </AppText>
              <AppText variant="caption" tone="textSecondary">
                {t('pr. time')}
              </AppText>
            </Value>
          ))}
        </Row>
        {sharedJob?.job ? (
          <Row
            label={
              getCategory(items[0].business.categories[0])?.jobs.find((j) => j.id === sharedJob.job)?.name ??
              sharedJob.label
            }>
            {items.map((s) => {
              const example = s.business.pricing.examples.find((e) => e.job === sharedJob.job);
              return (
                <Value key={s.business.id}>
                  <AppText variant="subhead" weight="600">
                    {example ? formatPriceRange(example.min, example.max, example.unit, currencyOf(s.business)) : '–'}
                  </AppText>
                </Value>
              );
            })}
          </Row>
        ) : null}
        <Row label={t('Kørsel/opstart')}>
          {items.map((s) => (
            <Value key={s.business.id}>
              <AppText variant="subhead">
                {s.business.pricing.calloutFee
                  ? formatPrice(s.business.pricing.calloutFee, currencyOf(s.business))
                  : t('Ingen')}
              </AppText>
            </Value>
          ))}
        </Row>
        <Row label={t('Afstand')}>
          {items.map((s) => (
            <Value key={s.business.id} best={winners.distance === s.business.id} bestLabel={t('Nærmest')}>
              <AppText variant="subhead" weight="600">
                {formatDistance(s.distanceKm)}
              </AppText>
            </Value>
          ))}
        </Row>
        {TRUSTPILOT_ENABLED ? (
          <Row label={t('Trustpilot')}>
            {items.map((s) => (
              <Value key={s.business.id} best={winners.rating === s.business.id} bestLabel={t('Bedst anmeldt')}>
                {s.business.trustpilot ? (
                  <>
                    <AppText variant="subhead" weight="600">
                      {formatRating(s.business.trustpilot.score)}
                    </AppText>
                    <Stars value={s.business.trustpilot.score} size={11} />
                    <AppText variant="caption" tone="textSecondary">
                      {t('{number} anm.', { number: formatNumber(s.business.trustpilot.reviews) })}
                    </AppText>
                  </>
                ) : (
                  <AppText variant="footnote" tone="textSecondary">
                    {t('Ingen profil')}
                  </AppText>
                )}
              </Value>
            ))}
          </Row>
        ) : null}
        <Row label={t('Åben nu')}>
          {items.map((s) => {
            const status = getOpenStatus(s.business.hours, undefined, timeZoneOf(s.business));
            return (
              <Value key={s.business.id}>
                <AppText variant="footnote" tone={status.open ? 'success' : 'textSecondary'} weight="600">
                  {status.open ? t('Ja') : t('Nej')}
                </AppText>
                <AppText variant="caption" tone="textSecondary">
                  {status.label}
                </AppText>
              </Value>
            );
          })}
        </Row>
        <Row label={t('Døgnvagt')}>
          {items.map((s) => (
            <Value key={s.business.id}>
              <YesNo value={s.business.emergency} />
            </Value>
          ))}
        </Row>
        <Row label={t('Autorisation')}>
          {items.map((s) => (
            <Value key={s.business.id}>
              <YesNo value={s.business.authorizations.length > 0} />
            </Value>
          ))}
        </Row>
        <Row label={t('Svartid')}>
          {items.map((s) => (
            <Value key={s.business.id}>
              <AppText variant="caption">
                {businessText(s.business).responseTime?.replace(t('Svarer typisk '), '') ?? '–'}
              </AppText>
            </Value>
          ))}
        </Row>

        <View style={styles.columns}>
          {items.map(({ business }) => (
            <View key={business.id} style={styles.actionCell}>
              <Button
                title={t('Ring')}
                icon="phone"
                size="small"
                onPress={() => callBusiness(business)}
                block
                accessibilityLabel={t('Ring til {name}', { name: business.name })}
              />
              <Button
                title={t('Se side')}
                variant="secondary"
                size="small"
                block
                onPress={() => router.push({ pathname: '/virksomhed/[id]', params: { id: business.id } })}
                accessibilityLabel={t('Se {name}', { name: business.name })}
              />
            </View>
          ))}
        </View>

        <AppText variant="caption" tone="textSecondary" align="center" style={styles.note}>
          {t('Priserne er vejledende og oplyst af virksomhederne. Afstand er i luftlinje fra {label}.', {
            label: state.location.label,
          })}
        </AppText>
      </ScrollView>
    </View>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  const colors = useTheme();
  return (
    <View style={styles.row}>
      <AppText variant="caption" tone="textSecondary" weight="600" style={styles.rowLabel} accessibilityRole="header">
        {label.toUpperCase()}
      </AppText>
      <View style={[styles.columns, styles.rowCells, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        {Array.isArray(children)
          ? children.map((child, index) => (
              <Fragment key={index}>
                {index > 0 ? <View style={[styles.cellDivider, { backgroundColor: colors.border }]} /> : null}
                {child}
              </Fragment>
            ))
          : children}
      </View>
    </View>
  );
}

function Value({ children, best, bestLabel }: { children: ReactNode; best?: boolean; bestLabel?: string }) {
  const colors = useTheme();
  return (
    <View style={styles.cell} accessible accessibilityLabel={best && bestLabel ? bestLabel : undefined}>
      {children}
      {best && bestLabel ? (
        <View style={[styles.best, { backgroundColor: colors.successSoft }]}>
          <Icon name="trophy" size={10} color={colors.success} weight="bold" />
          <AppText variant="caption2" tone="success" numberOfLines={1}>
            {bestLabel}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

function YesNo({ value }: { value: boolean }) {
  const colors = useTheme();
  return (
    <View style={styles.yesNo}>
      <Icon
        name={value ? 'check' : 'close'}
        size={14}
        color={value ? colors.success : colors.textTertiary}
        weight="bold"
      />
      <AppText variant="footnote" tone={value ? 'success' : 'textSecondary'}>
        {value ? t('Ja') : t('Nej')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.md },
  headerButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.sm,
  },
  columns: { flexDirection: 'row', gap: Spacing.sm },
  headerCell: { flex: 1, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  photo: { height: 84 },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { padding: Spacing.sm, gap: 1 },
  row: { gap: 6 },
  rowLabel: { letterSpacing: 0.3, paddingHorizontal: Spacing.xs },
  rowCells: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, gap: 0, overflow: 'hidden' },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    gap: 3,
  },
  cellDivider: { width: StyleSheet.hairlineWidth },
  best: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  yesNo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCell: { flex: 1, gap: Spacing.sm },
  note: { marginTop: Spacing.sm },
});
