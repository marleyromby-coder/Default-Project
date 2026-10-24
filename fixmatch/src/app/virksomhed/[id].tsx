import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MatchBadge } from '@/components/business/match-badge';
import { OpenStatus } from '@/components/business/open-status';
import { PriceLevel } from '@/components/business/price-level';
import { ScoreBars } from '@/components/business/score-bars';
import { TrustpilotRating } from '@/components/business/trustpilot-rating';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, Divider } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, type IconName } from '@/components/ui/icon';
import { Photo } from '@/components/ui/photo';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { MinTouchSize, Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { AUTHORIZATION_LABELS, getCategory } from '@/data/categories';
import { useScored } from '@/hooks/use-results';
import { useTheme } from '@/hooks/use-theme';
import {
  AUTHORIZATION_REGISTER_URL,
  callBusiness,
  registryUrl,
  openCvr,
  openDirections,
  openLink,
  openTrustpilot,
  openWebsite,
  reportProblem,
  shareBusiness,
} from '@/lib/contact';
import { showDialog } from '@/lib/dialog';
import { TRUSTPILOT_ENABLED } from '@/lib/features';
import {
  displayHost,
  formatDate,
  formatDistance,
  formatHourly,
  formatPhone,
  formatPrice,
  formatPriceRange,
  formatRegistryNumber,
} from '@/lib/format';
import { formatTime, mondayIndex, WEEKDAYS } from '@/lib/opening-hours';
import { matchLabel, priceLevel, weightsFromPriorities } from '@/lib/ranking';
import { t } from '@/i18n';
import { businessText, countryOf, currencyOf } from '@/lib/business-text';
import { getMarket, taxNote } from '@/lib/markets';
import { MAX_COMPARE, useApp, useBusiness } from '@/state/app-state';

const HERO_HEIGHT = 300;

export default function BusinessScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const business = useBusiness(id);
  const ids = useMemo(() => (id ? [id] : []), [id]);
  const [scored] = useScored(ids);
  const { state, toggleFavorite, toggleCompare } = useApp();
  const [scrolled, setScrolled] = useState(false);

  if (!business || !scored) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <EmptyState
          icon="store"
          title={t('Virksomheden findes ikke længere')}
          message={t('Den kan være fjernet fra FixMatch efter eget ønske.')}
          action={<Button title={t('Til forsiden')} onPress={() => router.replace('/')} />}
        />
      </View>
    );
  }

  const category = getCategory(business.categories[0]);
  const text = businessText(business);
  const country = countryOf(business);
  const market = getMarket(country);
  const currency = currencyOf(business);
  const jobName = (jobId: string | undefined, fallback: string) =>
    category?.jobs.find((j) => j.id === jobId)?.name ?? fallback;
  const favorite = state.favorites.includes(business.id);
  const comparing = state.compare.includes(business.id);
  const weights = weightsFromPriorities(state.priorities);
  const level = priceLevel(business, state.businesses);

  const today = mondayIndex(new Date());
  const tradePlural = (category?.plural ?? t('virksomheder')).toLowerCase();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const onCompare = () => {
    if (!toggleCompare(business.id)) {
      showDialog(
        t('Højst 3 ad gangen'),
        t('Du kan sammenligne op til {MAX_COMPARE} virksomheder. Fjern en for at vælge en ny.', { MAX_COMPARE }),
      );
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        contentInsetAdjustmentBehavior="never"
        scrollEventThrottle={32}
        onScroll={(event) => {
          const past = event.nativeEvent.contentOffset.y > HERO_HEIGHT - 40;
          if (past !== scrolled) setScrolled(past);
        }}>
        <View style={{ height: HERO_HEIGHT + insets.top }}>
          <Photo
            photo={business.photo}
            category={business.categories[0]}
            width={1200}
            scrim
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroText}>
            <View style={styles.heroBadges}>
              {category ? <Badge label={category.name} tone="neutral" icon={category.id} /> : null}
              {business.demo ? <Badge label={t('Eksempel')} tone="warning" /> : null}
            </View>
            <View style={styles.heroTitleRow}>
              <View style={styles.flex}>
                <AppText variant="title1" style={styles.white} numberOfLines={2}>
                  {business.name}
                </AppText>
                <AppText variant="subhead" style={styles.whiteSoft} numberOfLines={2}>
                  {text.tagline}
                </AppText>
              </View>
              <MatchBadge score={scored.score} size="large" onPhoto />
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {business.demo ? (
            <View style={[styles.notice, { backgroundColor: colors.warningSoft }]}>
              <Icon name="info" size={16} color={colors.warning} weight="semibold" />
              <AppText variant="footnote" style={styles.flex}>
                {t(
                  'Fiktiv eksempelvirksomhed. Navn, telefonnummer, CVR og anmeldelser er opdigtede, og opkald er slået fra.',
                )}
              </AppText>
            </View>
          ) : null}

          <View style={styles.quickActions}>
            <QuickAction icon="phone" label={t('Ring')} onPress={() => callBusiness(business)} primary />
            {business.contact.website ? (
              <QuickAction icon="globe" label={t('Hjemmeside')} onPress={() => openWebsite(business)} />
            ) : null}
            <QuickAction icon="directions" label={t('Rute')} onPress={() => openDirections(business)} />
            <QuickAction
              icon={comparing ? 'check' : 'compare'}
              label={comparing ? t('Valgt') : t('Sammenlign')}
              onPress={onCompare}
              selected={comparing}
            />
          </View>

          <Card>
            <CardTitle title={t('Kontakt')} icon="phone" />
            <InfoRow
              icon="phone"
              label={t('Telefon')}
              value={formatPhone(business.contact.phone)}
              onPress={() => callBusiness(business)}
            />
            <Divider inset={30} />
            {business.contact.website ? (
              <>
                <InfoRow
                  icon="globe"
                  label={t('Hjemmeside')}
                  value={business.demo ? t('Fiktiv (demo)') : displayHost(business.contact.website)}
                  onPress={() => openWebsite(business)}
                />
                <Divider inset={30} />
              </>
            ) : null}
            <InfoRow
              icon="pin"
              label={t('Adresse')}
              value={`${business.address.street}, ${business.address.postalCode} ${business.address.city}`}
              onPress={() => openDirections(business)}
            />
            <Divider inset={30} />
            <InfoRow
              icon="route"
              label={t('Afstand')}
              value={t('{distance} i luftlinje · kører op til {radius}', {
                distance: formatDistance(scored.distanceKm),
                radius: formatDistance(business.serviceRadiusKm),
              })}
            />
            {text.responseTime ? (
              <>
                <Divider inset={30} />
                <InfoRow icon="chat" label={t('Svartid')} value={text.responseTime} />
              </>
            ) : null}
          </Card>

          {TRUSTPILOT_ENABLED ? (
            <Card>
              <CardTitle title={t('Anmeldelser')} icon="star" />
              <TrustpilotRating trustpilot={business.trustpilot} size="large" />
              {business.trustpilot ? (
                <>
                  <AppText variant="caption" tone="textSecondary" style={styles.spaced}>
                    {t('Hentet fra Trustpilot {date}. FixMatch ændrer eller udvælger ikke anmeldelser.', {
                      date: formatDate(business.trustpilot.updatedAt),
                    })}
                  </AppText>
                  <View style={styles.buttonRow}>
                    <Button
                      title={t('Se anmeldelser på Trustpilot')}
                      icon="external"
                      variant="secondary"
                      size="small"
                      onPress={() => openTrustpilot(business)}
                    />
                  </View>
                </>
              ) : (
                <AppText variant="footnote" tone="textSecondary" style={styles.spaced}>
                  {t(
                    'Virksomheden har endnu ingen anmeldelser på Trustpilot. Den rangeres derfor med en neutral score.',
                  )}
                </AppText>
              )}
              <LinkText label={t('Om anmeldelser i FixMatch')} slug="anmeldelser" />
            </Card>
          ) : null}

          <Card>
            <CardTitle title={t('Priser')} icon="tag" />
            <View style={styles.priceHeader}>
              <AppText variant="title2" rounded>
                {formatHourly(business.pricing.hourlyMin, business.pricing.hourlyMax, currency)}
              </AppText>
              <AppText variant="footnote" tone="textSecondary">
                {[
                  t('Timepris {tax}', { tax: taxNote(market) }),
                  business.pricing.calloutFee
                    ? t('kørsel/opstart {price} pr. besøg', {
                        price: formatPrice(business.pricing.calloutFee, currency),
                      })
                    : t('ingen kørselsgebyr'),
                ].join(' · ')}
              </AppText>
              <PriceLevel level={level} trade={tradePlural} />
            </View>
            {business.pricing.examples.length > 0 ? (
              <View style={styles.examples}>
                <AppText variant="subhead" weight="600">
                  {t('Eksempelpriser')}
                </AppText>
                {business.pricing.examples.map((example) => (
                  <View key={example.label} style={styles.exampleRow}>
                    <AppText variant="subhead" style={styles.flex}>
                      {jobName(example.job, example.label)}
                    </AppText>
                    <AppText variant="subhead" weight="600" tabular>
                      {formatPriceRange(example.min, example.max, example.unit, currency)}
                    </AppText>
                  </View>
                ))}
              </View>
            ) : null}
            <AppText variant="caption" tone="textSecondary" style={styles.spaced}>
              {t(
                'Vejledende priser oplyst af virksomheden {date}. Materialer kan komme oveni. Bed altid om et skriftligt tilbud.',
                { date: formatDate(business.pricing.updatedAt) },
              )}
            </AppText>
            <LinkText label={t('Om priserne og håndværkerfradrag')} slug="priser" />
          </Card>

          <Card>
            <CardTitle
              title={t('Match-score {score} · {matchLabel}', {
                score: scored.score,
                matchLabel: matchLabel(scored.score),
              })}
              icon="sparkles"
            />
            <ScoreBars parts={scored.parts} weights={weights} />
            <View style={styles.buttonRow}>
              <Button
                title={t('Justér dine prioriteter')}
                icon="sliders"
                variant="tinted"
                size="small"
                onPress={() => router.push('/prioriteter')}
              />
            </View>
            <LinkText label={t('Sådan rangerer vi')} slug="rangering" />
          </Card>

          <Card>
            <CardTitle title={t('Åbningstider')} icon="clock" trailing={<OpenStatus business={business} />} />
            {business.hours.map((slot, index) => (
              <View key={WEEKDAYS[index]} style={styles.hoursRow} accessible>
                <AppText variant="subhead" weight={index === today ? '700' : '400'} style={styles.flex}>
                  {WEEKDAYS[index]}
                  {index === today ? ` (${t('i dag')})` : ''}
                </AppText>
                <AppText
                  variant="subhead"
                  tone={slot ? 'text' : 'textSecondary'}
                  weight={index === today ? '700' : '400'}
                  tabular>
                  {slot ? `${formatTime(slot[0])}–${formatTime(slot[1])}` : t('Lukket')}
                </AppText>
              </View>
            ))}
            {business.emergency ? (
              <View style={[styles.notice, styles.spaced, { backgroundColor: colors.warningSoft }]}>
                <Icon name="bolt" size={15} color={colors.warning} weight="semibold" />
                <AppText variant="footnote" style={styles.flex}>
                  {t('Døgnvagt: kan ringes op uden for åbningstid. Der kan være tillæg for akut udkald.')}
                </AppText>
              </View>
            ) : null}
          </Card>

          <Card>
            <CardTitle title={t('Om virksomheden')} icon="store" />
            <AppText variant="body">{text.description}</AppText>
            <View style={styles.tags}>
              {text.services.map((service) => (
                <Badge key={service} label={service} tone="brand" />
              ))}
            </View>
            <View style={styles.facts}>
              {business.founded ? (
                <Fact icon="calendar" label={t('Etableret')} value={String(business.founded)} />
              ) : null}
              {business.employees ? <Fact icon="people" label={t('Ansatte')} value={business.employees} /> : null}
            </View>
          </Card>

          <Card>
            <CardTitle title={t('Tjekket af FixMatch')} icon="verified" />
            {business.cvr && market.registryLabel ? (
              <InfoRow
                icon="building"
                label={t(market.registryLabel)}
                value={`${formatRegistryNumber(business.cvr, country)}${business.demo ? ` (${t('fiktivt')})` : ''}`}
                onPress={business.demo || registryUrl(business) ? () => openCvr(business) : undefined}
              />
            ) : null}
            {business.authorizations.map((auth) => (
              <View key={auth.kind}>
                <Divider inset={30} />
                <InfoRow
                  icon="shield"
                  label={AUTHORIZATION_LABELS[auth.kind]}
                  value={t('Aut.nr. {number}', { number: auth.number })}
                  onPress={() =>
                    business.demo
                      ? showDialog(
                          t('Eksempelvirksomhed'),
                          country === 'DK'
                            ? t('I den færdige app kan du slå autorisationen op i Sikkerhedsstyrelsens register.')
                            : t(market.licenceNote),
                        )
                      : country === 'DK'
                        ? openLink(AUTHORIZATION_REGISTER_URL)
                        : showDialog(t('Autorisation'), t(market.licenceNote))
                  }
                />
              </View>
            ))}
            {business.memberships.map((membership) => (
              <View key={membership}>
                <Divider inset={30} />
                <InfoRow icon="handshake" label={t('Medlem af')} value={membership} />
              </View>
            ))}
            <Divider inset={30} />
            <InfoRow
              icon="check"
              label={t('Samtykke')}
              value={t('Godkendt af virksomheden {date}', { date: formatDate(business.consent.date) })}
            />
          </Card>

          <View style={styles.footer}>
            <AppText variant="caption" tone="textSecondary" align="center">
              {t('Oplysningerne er opdateret {date}. FixMatch er ikke part i aftaler mellem dig og virksomheden.', {
                date: formatDate(business.updatedAt),
              })}
            </AppText>
            <Button
              title={t('Rapportér fejl eller ulovligt indhold')}
              icon="flag"
              variant="plain"
              size="small"
              onPress={() => reportProblem(business)}
            />
          </View>
        </View>
      </ScrollView>

      {scrolled ? (
        <View
          style={[
            styles.topBar,
            { height: insets.top + 60, backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
          pointerEvents="none">
          <AppText variant="headline" numberOfLines={1} style={styles.topBarTitle}>
            {business.name}
          </AppText>
        </View>
      ) : null}
      <View style={[styles.topButtons, { top: insets.top + Spacing.sm }]} pointerEvents="box-none">
        <FloatingButton icon="back" label={t('Tilbage')} onPress={goBack} />
        <View style={styles.topRight}>
          <FloatingButton icon="share" label={t('Del')} onPress={() => shareBusiness(business)} />
          <FloatingButton
            icon={favorite ? 'heartFill' : 'heart'}
            label={favorite ? t('Fjern fra gemte') : t('Gem')}
            onPress={() => toggleFavorite(business.id)}
            active={favorite}
          />
        </View>
      </View>

      <View
        style={[
          styles.contactBar,
          {
            paddingBottom: Math.max(insets.bottom, Spacing.md),
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}>
        <Button
          title={t('Ring {phone}', { phone: formatPhone(business.contact.phone) })}
          icon="phone"
          onPress={() => callBusiness(business)}
          size="large"
          style={styles.flex}
          accessibilityLabel={t('Ring til {name}', { name: business.name })}
        />
        {business.contact.website ? (
          <Button
            title={t('Web')}
            icon="globe"
            variant="secondary"
            size="large"
            onPress={() => openWebsite(business)}
            accessibilityLabel={t('Åbn {name}s hjemmeside', { name: business.name })}
          />
        ) : null}
      </View>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  primary,
  selected,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  primary?: boolean;
  selected?: boolean;
}) {
  const colors = useTheme();
  const filled = primary || selected;
  return (
    <Tappable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      style={[
        styles.quickAction,
        {
          backgroundColor: filled ? colors.brandStrong : colors.surface,
          borderColor: filled ? colors.brandStrong : colors.border,
        },
      ]}>
      <Icon name={icon} size={20} color={filled ? colors.onBrand : colors.brandText} weight="semibold" />
      <AppText
        variant="caption"
        weight="600"
        style={{ color: filled ? colors.onBrand : colors.text }}
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}>
        {label}
      </AppText>
    </Tappable>
  );
}

function InfoRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const colors = useTheme();
  const content = (
    <View style={styles.infoRow}>
      <Icon name={icon} size={17} color={colors.textSecondary} />
      <View style={styles.flex}>
        <AppText variant="caption" tone="textSecondary">
          {label}
        </AppText>
        <AppText variant="subhead" style={onPress ? { color: colors.brandText } : null} selectable={!onPress}>
          {value}
        </AppText>
      </View>
      {onPress ? <Icon name="chevronRight" size={13} color={colors.textTertiary} weight="semibold" /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Tappable onPress={onPress} accessibilityLabel={t('{label}: {value}', { label, value })} pressedOpacity={0.5}>
      {content}
    </Tappable>
  );
}

function Fact({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const colors = useTheme();
  return (
    <View
      style={[styles.fact, { backgroundColor: colors.surfaceAlt }]}
      accessible
      accessibilityLabel={t('{label}: {value}', { label, value })}>
      <Icon name={icon} size={16} color={colors.brand} />
      <View>
        <AppText variant="caption" tone="textSecondary">
          {label}
        </AppText>
        <AppText variant="subhead" weight="600">
          {value}
        </AppText>
      </View>
    </View>
  );
}

function LinkText({ label, slug }: { label: string; slug: string }) {
  return (
    <Tappable
      onPress={() => router.push({ pathname: '/info/[slug]', params: { slug } })}
      accessibilityRole="link"
      style={styles.linkText}>
      <AppText variant="footnote" tone="brandText" weight="600">
        {label} ›
      </AppText>
    </Tappable>
  );
}

function FloatingButton({
  icon,
  label,
  onPress,
  active,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  const colors = useTheme();
  return (
    <Tappable onPress={onPress} accessibilityLabel={label} style={styles.floating}>
      <Icon name={icon} size={18} color={active ? colors.brand : '#0E1726'} weight="bold" />
    </Tappable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  white: { color: '#FFFFFF' },
  whiteSoft: { color: 'rgba(255,255,255,0.9)' },
  heroText: { position: 'absolute', left: ScreenPadding, right: ScreenPadding, bottom: Spacing.lg, gap: Spacing.sm },
  heroBadges: { flexDirection: 'row', gap: Spacing.xs },
  heroTitleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md },
  body: { padding: ScreenPadding, gap: Spacing.lg },
  notice: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md },
  quickActions: { flexDirection: 'row', gap: Spacing.sm },
  quickAction: {
    flex: 1,
    minHeight: 64,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: MinTouchSize + 8,
    paddingVertical: Spacing.xs,
  },
  spaced: { marginTop: Spacing.md },
  buttonRow: { flexDirection: 'row', marginTop: Spacing.md },
  priceHeader: { gap: Spacing.xs },
  examples: { marginTop: Spacing.lg, gap: Spacing.sm },
  exampleRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.md },
  hoursRow: { flexDirection: 'row', paddingVertical: 5 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.md },
  facts: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  fact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  linkText: { marginTop: Spacing.sm, minHeight: 36, justifyContent: 'center', alignSelf: 'flex-start' },
  footer: { gap: Spacing.sm, alignItems: 'center', paddingTop: Spacing.sm },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarTitle: { maxWidth: '50%' },
  topButtons: {
    position: 'absolute',
    left: ScreenPadding,
    right: ScreenPadding,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topRight: { flexDirection: 'row', gap: Spacing.sm },
  floating: {
    width: MinTouchSize,
    height: MinTouchSize,
    borderRadius: MinTouchSize / 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.18)' },
      default: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
    }),
  },
  contactBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
