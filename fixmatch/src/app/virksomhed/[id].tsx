import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, type ScrollViewInstance, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomerCard } from '@/components/business/customer-card';
import { HeroMark } from '@/components/business/hero-mark';
import { WorkPhotosCard } from '@/components/business/work-photos';
import { PhotoStrip } from '@/components/problem-photos';
import { OpenStatus } from '@/components/business/open-status';
import { PriceInsightView } from '@/components/business/price-insight';
import { ScoreBars } from '@/components/business/score-bars';
import { HeroPanel } from '@/components/hero-panel';
import { Badge } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import { Card, CardTitle, Divider } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, type IconName } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { Stars } from '@/components/ui/stars';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { IconWell, MinTouchSize, Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { AUTHORIZATION_LABELS, getCategory } from '@/data/categories';
import { useScored } from '@/hooks/use-results';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import {
  AUTHORIZATION_REGISTER_URL,
  callBusiness,
  requestVideoCheck,
  sendProblem,
  startFaceTime,
  registryUrl,
  openCvr,
  openDirections,
  openLink,
  openWebsite,
  reportProblem,
  shareBusiness,
} from '@/lib/contact';
import { showDialog } from '@/lib/dialog';
import {
  currencySymbol,
  displayHost,
  formatDate,
  formatDistance,
  formatNumber,
  formatPhone,
  formatPrice,
  formatPriceRange,
  formatRating,
  formatRegistryNumber,
} from '@/lib/format';
import { formatTime, mondayIndex, WEEKDAYS } from '@/lib/opening-hours';
import { priceInsight } from '@/lib/price-insight';
import { matchLabel, reviewCount, weightsFromPriorities } from '@/lib/ranking';
import { reviewRatingLabel } from '@/lib/review-label';
import type { Business } from '@/lib/types';
import { t } from '@/i18n';
import { availableWhen } from '@/lib/availability';
import { businessText, countryOf, currencyOf } from '@/lib/business-text';
import { type Currency, getMarket, taxNote } from '@/lib/markets';
import { CHECK_TEXT, isTopRated, isVerified, passedChecks, verificationExpiry } from '@/lib/verification';
import { MAX_COMPARE, useApp, useBusiness } from '@/state/app-state';
import { answerRateText, useAnswerRate } from '@/state/answers';
import { useReviewSummary } from '@/state/community';
import { hasProblem, useProblem } from '@/state/problem';

/** How far the page scrolls before the compact title bar appears. */
const HEADER_SCROLL = 140;
/** How far the facts card reaches up into the panel. */
const OVERLAP = 44;

export default function BusinessScreen() {
  const { column, gutter } = useLayout();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const business = useBusiness(id);
  const ids = useMemo(() => (id ? [id] : []), [id]);
  const [scored] = useScored(ids);
  const { state, toggleFavorite, toggleCompare } = useApp();
  const problem = useProblem();
  const answers = answerRateText(useAnswerRate(business));
  const [scrolled, setScrolled] = useState(false);
  const scroller = useRef<ScrollViewInstance>(null);
  // Where "Kundernes erfaringer" starts, so "Læs" in the review bar can scroll to it.
  const bodyY = useRef(0);
  const reviewsY = useRef(0);

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
  const verified = isVerified(business);
  const country = countryOf(business);
  const market = getMarket(country);
  const currency = currencyOf(business);
  const jobName = (jobId: string | undefined, fallback: string) =>
    category?.jobs.find((j) => j.id === jobId)?.name ?? fallback;
  const favorite = state.favorites.includes(business.id);
  const comparing = state.compare.includes(business.id);
  const weights = weightsFromPriorities(state.priorities);
  const insight = priceInsight(business, state.businesses);

  const today = mondayIndex(new Date());
  const free = availableWhen(business);
  const hourly = splitPrice(business.pricing.hourlyMin, business.pricing.hourlyMax, currency);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const onCompare = () => {
    if (!toggleCompare(business.id)) {
      showDialog(
        t('Højst 3 ad gangen'),
        t('Du kan sammenligne op til {MAX_COMPARE} virksomheder. Fjern en for at vælge en ny.', { MAX_COMPARE }),
      );
    }
  };
  const showReviews = () =>
    scroller.current?.scrollTo({ y: Math.max(0, bodyY.current + reviewsY.current - insets.top - 64), animated: true });

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scroller}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        contentInsetAdjustmentBehavior="never"
        scrollEventThrottle={32}
        onScroll={(event) => {
          const past = event.nativeEvent.contentOffset.y > HEADER_SCROLL;
          if (past !== scrolled) setScrolled(past);
        }}>
        <HeroPanel overlap={OVERLAP} contentStyle={styles.hero}>
          {/* Room for the back, share and save buttons, which stay at the top while the page scrolls. */}
          <View style={styles.heroButtonsSpace} />
          <View style={styles.heroRow}>
            <HeroMark business={business} />
            <View style={styles.flex}>
              <AppText variant="title1" tone="onPanel" numberOfLines={3}>
                {business.name}
              </AppText>
              <AppText variant="footnote" tone="onPanelSoft" numberOfLines={2} style={styles.heroMeta}>
                {[text.tagline, business.address.city].filter(Boolean).join(' · ')}
              </AppText>
            </View>
          </View>
          <View style={styles.heroBadges}>
            {verified ? (
              <Badge
                label={t('Verificeret')}
                tone="panel"
                icon="verified"
                accessibilityLabel={t('Verificeret af FixMatch')}
              />
            ) : null}
            {business.authorizations.map((auth) => (
              <Badge key={auth.kind} label={AUTHORIZATION_LABELS[auth.kind]} tone="panel" icon="shield" />
            ))}
            {business.demo ? (
              <Badge label={t('Demo')} tone="panel" icon="info" accessibilityLabel={t('Eksempelvirksomhed')} />
            ) : null}
            {free ? (
              <Badge
                label={free === 'today' ? t('Ledig i dag') : t('Ledig i morgen')}
                tone="panel"
                icon="calendar"
                accessibilityLabel={
                  free === 'today' ? t('Har selv meldt ledig tid i dag') : t('Har selv meldt ledig tid i morgen')
                }
              />
            ) : null}
            {isTopRated(business) ? <Badge label={t('Topbedømt')} tone="panel" icon="star" /> : null}
            {business.videoCheck ? <Badge label={t('Videotjek')} tone="panel" icon="video" /> : null}
          </View>
        </HeroPanel>

        <View
          style={[styles.body, column]}
          onLayout={(event) => {
            bodyY.current = event.nativeEvent.layout.y;
          }}>
          <Card elevation="raised" padded={false} style={[styles.facts, { marginTop: -OVERLAP }]}>
            <Stat
              label={t('Match')}
              value={String(scored.score)}
              detail={t('af 100')}
              spoken={t('{score} af 100, {label}', { score: scored.score, label: matchLabel(scored.score) })}
              first
            />
            <Stat
              label={t('Timepris')}
              value={hourly.value}
              detail={[hourly.unit, taxNote(market)].filter(Boolean).join(' ')}
              spoken={formatPriceRange(business.pricing.hourlyMin, business.pricing.hourlyMax, 'opgave', currency)}
              brand
              wide
            />
            <Stat
              label={t('Afstand')}
              value={formatDistance(scored.distanceKm)}
              detail={state.location.label ? t('fra {place}', { place: state.location.label }) : t('i luftlinje')}
            />
          </Card>

          <ReviewBar business={business} onPress={showReviews} />

          {business.demo ? (
            <Notice
              text={t(
                'Fiktiv eksempelvirksomhed. Navn, telefonnummer, CVR og anmeldelser er opdigtede, og opkald er slået fra.',
              )}
              style={styles.notice}
            />
          ) : null}

          <Card>
            <PriceInsightView
              business={business}
              insight={insight}
              tradePlural={category?.plural ?? t('virksomheder')}
              country={t(market.name)}
              currency={currency}
            />
            {business.pricing.examples.length > 0 ? (
              <View style={styles.examples}>
                <Divider />
                <View style={styles.examplesHead}>
                  <AppText variant="subhead" weight="700" style={styles.flex}>
                    {t('Eksempelpriser')}
                  </AppText>
                  <AppText variant="caption" tone="textSecondary">
                    {taxNote(market)}
                  </AppText>
                </View>
                {business.pricing.examples.map((example, index) => (
                  <View key={example.label}>
                    {index > 0 ? <Divider /> : null}
                    <View style={styles.exampleRow}>
                      <AppText variant="subhead" style={styles.flex}>
                        {jobName(example.job, example.label)}
                      </AppText>
                      <AppText variant="subhead" display weight="700">
                        {formatPriceRange(example.min, example.max, example.unit, currency)}
                      </AppText>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Divider />
            )}
            <AppText variant="footnote" tone="textSecondary" style={styles.spaced}>
              {[
                t('Timepris {tax}', { tax: taxNote(market) }),
                business.pricing.calloutFee
                  ? t('kørsel/opstart {price} pr. besøg', {
                      price: formatPrice(business.pricing.calloutFee, currency),
                    })
                  : t('ingen kørselsgebyr'),
              ].join(' · ')}
            </AppText>
            <AppText variant="caption" tone="textSecondary" style={styles.spacedSmall}>
              {t(
                'Vejledende priser oplyst af virksomheden {date}. Materialer kan komme oveni. Bed altid om et skriftligt tilbud.',
                { date: formatDate(business.pricing.updatedAt) },
              )}
            </AppText>
            <InfoLink label={t('Om priserne og håndværkerfradrag')} slug="priser" />
            <Button
              title={t('Har du fået et tilbud? Tjek prisen')}
              variant="link"
              chevron
              onPress={() => router.push({ pathname: '/tilbudstjek', params: { kategori: business.categories[0] } })}
            />
          </Card>

          {business.videoCheck ? (
            <Card>
              <CardTitle title={t('Videotjek før besøg')} />
              <AppText variant="subhead" tone="textSecondary" style={styles.spaced}>
                {t(
                  '{name} ser gerne problemet over FaceTime først. Det tager 5 minutter, er gratis, og du får et overslag uden at betale for en forgæves tur.',
                  { name: business.name },
                )}
              </AppText>
              <View style={[styles.quickActions, styles.spaced]}>
                <Button
                  title={t('Foreslå et tidspunkt')}
                  icon="message"
                  size="small"
                  onPress={() => requestVideoCheck(business, problem)}
                />
                {Platform.OS === 'ios' ? (
                  <Button
                    title={t('Start FaceTime nu')}
                    icon="video"
                    variant="secondary"
                    size="small"
                    onPress={() => startFaceTime(business)}
                  />
                ) : null}
              </View>
              <AppText variant="caption" tone="textSecondary" style={styles.spaced}>
                {t('Tag gerne billeder under "Beskriv dit problem" først, så de kommer med i beskeden.')}
              </AppText>
            </Card>
          ) : null}

          {hasProblem(problem) ? (
            <Card>
              <CardTitle title={t('Dit problem')} />
              {problem.text.trim() ? (
                <AppText variant="subhead" tone="textSecondary" numberOfLines={3} style={styles.spaced}>
                  “{problem.text.trim()}”
                </AppText>
              ) : null}
              <View style={styles.spaced}>
                <PhotoStrip size={64} />
              </View>
              <View style={styles.spaced}>
                <Button
                  title={problem.photos.length > 0 ? t('Send billeder og beskrivelse') : t('Send beskrivelsen')}
                  icon="message"
                  variant="secondary"
                  onPress={() => sendProblem(business, problem)}
                  block
                />
              </View>
              <AppText variant="caption" tone="textSecondary" style={styles.spaced}>
                {t('Sendes som en besked fra din egen telefon til {phone}. FixMatch ser den ikke.', {
                  phone: formatPhone(business.contact.phone),
                })}
              </AppText>
            </Card>
          ) : null}

          <Card>
            <CardTitle title={t('Kontakt')} />
            <InfoRow
              icon="phone"
              label={t('Telefon')}
              value={formatPhone(business.contact.phone)}
              detail={
                answers
                  ? t('Tager telefonen {answered} ud af {outOf} gange', {
                      answered: answers.answered,
                      outOf: answers.outOf,
                    })
                  : undefined
              }
              onPress={() => callBusiness(business)}
            />
            <Divider inset={IconWell.row.size + Spacing.md} />
            {business.contact.website ? (
              <>
                <InfoRow
                  icon="globe"
                  label={t('Hjemmeside')}
                  value={business.demo ? t('Fiktiv (demo)') : displayHost(business.contact.website)}
                  onPress={() => openWebsite(business)}
                />
                <Divider inset={IconWell.row.size + Spacing.md} />
              </>
            ) : null}
            <InfoRow
              icon="pin"
              label={t('Adresse')}
              value={`${business.address.street}, ${business.address.postalCode} ${business.address.city}`}
              onPress={() => openDirections(business)}
            />
            {text.responseTime ? (
              <>
                <Divider inset={IconWell.row.size + Spacing.md} />
                <InfoRow icon="chat" label={t('Svartid')} value={text.responseTime} />
              </>
            ) : null}
          </Card>

          <View
            onLayout={(event) => {
              reviewsY.current = event.nativeEvent.layout.y;
            }}>
            <CustomerCard business={business} />
          </View>

          <Card>
            <CardTitle
              title={t('Match-score {score} · {matchLabel}', {
                score: scored.score,
                matchLabel: matchLabel(scored.score),
              })}
            />
            <ScoreBars parts={scored.parts} weights={weights} noReviews={reviewCount(business) === 0} />
            <View style={styles.buttonRow}>
              <Button
                title={t('Juster dine prioriteter')}
                icon="sliders"
                variant="tinted"
                size="small"
                onPress={() => router.push('/prioriteter')}
              />
            </View>
            <InfoLink label={t('Sådan rangerer vi')} slug="rangering" />
          </Card>

          <Card>
            <CardTitle title={t('Åbningstider')} trailing={<OpenStatus business={business} />} />
            {business.hours.map((slot, index) => (
              <View key={WEEKDAYS[index]} style={styles.hoursRow} accessible>
                <AppText variant="subhead" weight={index === today ? '600' : '400'} style={styles.flex}>
                  {WEEKDAYS[index]}
                  {index === today ? ` (${t('i dag')})` : ''}
                </AppText>
                <AppText
                  variant="subhead"
                  tone={slot ? 'text' : 'textSecondary'}
                  weight={index === today ? '600' : '400'}
                  tabular>
                  {slot ? `${formatTime(slot[0])}–${formatTime(slot[1])}` : t('Lukket')}
                </AppText>
              </View>
            ))}
            {free ? (
              <Notice
                icon="calendar"
                text={
                  free === 'today'
                    ? t('Ledig i dag: virksomheden har selv meldt, at den har tid i dag. Ring og aftal et tidspunkt.')
                    : t(
                        'Ledig i morgen: virksomheden har selv meldt, at den har tid i morgen. Ring og aftal et tidspunkt.',
                      )
                }
                style={styles.spaced}
              />
            ) : null}
            {business.emergency ? (
              <Notice
                icon="bolt"
                text={t('Døgnvagt: kan ringes op uden for åbningstid. Der kan være tillæg for akut udkald.')}
                style={styles.spaced}
              />
            ) : null}
          </Card>

          <WorkPhotosCard business={business} />

          <Card>
            <CardTitle title={t('Om virksomheden')} />
            <AppText variant="body">{text.description}</AppText>
            <View style={styles.tags}>
              {text.services.map((service) => (
                <Badge key={service} label={service} tone="brand" />
              ))}
            </View>
            <View style={styles.facts2}>
              {business.founded ? (
                <Fact icon="calendar" label={t('Etableret')} value={String(business.founded)} />
              ) : null}
              {business.employees ? <Fact icon="people" label={t('Ansatte')} value={business.employees} /> : null}
            </View>
          </Card>

          <Card>
            <CardTitle title={t('Tryghed')} />
            {verified && business.verified ? (
              <>
                <InfoRow
                  icon="verified"
                  label={t('Verificeret af FixMatch')}
                  value={t('Tjekket {date} · gælder til {until}', {
                    date: formatDate(business.verified.date),
                    until: formatDate(verificationExpiry(business.verified).toISOString().slice(0, 10)),
                  })}
                  onPress={() => router.push({ pathname: '/info/[slug]', params: { slug: 'verificering' } })}
                />
                <View style={styles.checks}>
                  {passedChecks(business).map((check) => (
                    <View key={check} style={styles.checkRow}>
                      <Icon name="check" size={13} color={colors.brand} weight="bold" />
                      <AppText variant="footnote" style={styles.flex}>
                        {t(CHECK_TEXT[check])}
                      </AppText>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <InfoRow
                icon="info"
                label={t('Ikke verificeret endnu')}
                value={t('Se, hvad FixMatch tjekker')}
                onPress={() => router.push({ pathname: '/info/[slug]', params: { slug: 'verificering' } })}
              />
            )}
            <Divider inset={IconWell.row.size + Spacing.md} />
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
                <Divider inset={IconWell.row.size + Spacing.md} />
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
                <Divider inset={IconWell.row.size + Spacing.md} />
                <InfoRow icon="handshake" label={t('Medlem af')} value={membership} />
              </View>
            ))}
            <Divider inset={IconWell.row.size + Spacing.md} />
            <InfoRow
              icon="check"
              label={t('Samtykke')}
              value={t('Godkendt af virksomheden {date}', { date: formatDate(business.consent.date) })}
            />
            <View style={styles.spaced}>
              <Button
                title={t('Se tryghed og klagevej')}
                icon="shield"
                variant="secondary"
                onPress={() => router.push({ pathname: '/tryghed/[id]', params: { id: business.id } })}
                block
              />
            </View>
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
        <View style={[styles.topBar, { height: insets.top + 60, backgroundColor: colors.panel }]} pointerEvents="none">
          <AppText variant="headline" display tone="onPanel" numberOfLines={1} style={styles.topBarTitle}>
            {business.name}
          </AppText>
        </View>
      ) : null}
      <View
        style={[styles.topButtons, { top: insets.top + Spacing.sm, left: gutter, right: gutter }]}
        pointerEvents="box-none">
        <IconButton icon="back" accessibilityLabel={t('Tilbage')} onPress={goBack} onPanel />
        <View style={styles.topRight}>
          <IconButton icon="share" accessibilityLabel={t('Del')} onPress={() => shareBusiness(business)} onPanel />
          <IconButton
            icon={favorite ? 'heartFill' : 'heart'}
            accessibilityLabel={favorite ? t('Fjern fra gemte') : t('Gem')}
            onPress={() => toggleFavorite(business.id)}
            selected={favorite}
            onPanel
          />
        </View>
      </View>

      <View
        style={[
          styles.contactBar,
          {
            paddingHorizontal: gutter,
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
        <Tappable
          onPress={onCompare}
          accessibilityRole="button"
          accessibilityLabel={
            comparing ? t('Fjern fra sammenligning') : t('Sammenlign {name}', { name: business.name })
          }
          accessibilityState={{ selected: comparing }}
          style={[styles.compare, { backgroundColor: comparing ? colors.brandStrong : colors.brandSoft }]}>
          <Icon
            name={comparing ? 'check' : 'compare'}
            size={20}
            color={comparing ? colors.onBrand : colors.brandText}
            weight="bold"
          />
        </Tappable>
      </View>
    </View>
  );
}

/** "560–660" big, with "kr." in the line under it; "£60–90" stays whole. */
function splitPrice(min: number, max: number, currency: Currency): { value: string; unit: string } {
  const full = formatPriceRange(min, max, 'opgave', currency);
  const symbol = currencySymbol(currency);
  if (symbol.length > 1 && full.endsWith(symbol)) return { value: full.slice(0, -symbol.length).trim(), unit: symbol };
  if (symbol.length > 1 && full.startsWith(symbol)) return { value: full.slice(symbol.length).trim(), unit: symbol };
  return { value: full, unit: '' };
}

/**
 * FixMatch's own reviews in one bar under the facts: the average, how many and where they come
 * from. "Læs" scrolls to "Kundernes erfaringer". Without reviews it says so.
 */
function ReviewBar({ business, onPress }: { business: Business; onPress: () => void }) {
  const colors = useTheme();
  const summary = useReviewSummary(business);
  const has = !!summary && summary.reviews > 0;
  return (
    <Tappable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={has ? reviewRatingLabel(summary) : t('Ingen anmeldelser endnu')}
      accessibilityHint={t('Viser kundernes erfaringer')}
      style={[styles.reviewBar, { backgroundColor: colors.surface }]}>
      <Stars value={has ? 1 : 0} count={1} size={18} />
      {has ? (
        <AppText variant="title3" display weight="800">
          {formatRating(summary.average)}
        </AppText>
      ) : null}
      <View style={styles.flex}>
        <AppText variant="subhead" weight="700" numberOfLines={1}>
          {!has
            ? t('Ingen anmeldelser endnu')
            : summary.reviews === 1
              ? t('1 anmeldelse')
              : t('{count} anmeldelser', { count: formatNumber(summary.reviews) })}
        </AppText>
        <AppText variant="footnote" tone="textSecondary" numberOfLines={2}>
          {has
            ? t('fra brugere via FixMatch')
            : t('Kun brugere, der har kontaktet virksomheden gennem FixMatch, kan anmelde den.')}
        </AppText>
      </View>
      <View style={styles.reviewLink}>
        <AppText variant="subhead" weight="600" tone="brandText">
          {t('Læs')}
        </AppText>
        <Icon name="chevronRight" size={12} color={colors.brandText} weight="semibold" />
      </View>
    </Tappable>
  );
}

function InfoRow({
  icon,
  label,
  value,
  detail,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string;
  /** A quiet line under the value, e.g. how often the business answers the phone. */
  detail?: string;
  onPress?: () => void;
}) {
  const colors = useTheme();
  const content = (
    <View style={styles.infoRow}>
      <View style={[styles.iconWell, { backgroundColor: colors.brandSoft }]}>
        <Icon name={icon} size={15} color={colors.brandText} weight="semibold" />
      </View>
      <View style={styles.flex}>
        <AppText variant="caption" tone="textSecondary">
          {label}
        </AppText>
        <AppText variant="subhead" style={onPress ? { color: colors.brandText } : null} selectable={!onPress}>
          {value}
        </AppText>
        {detail ? (
          <AppText variant="caption" tone="textSecondary">
            {detail}
          </AppText>
        ) : null}
      </View>
      {onPress ? <Icon name="chevronRight" size={13} color={colors.textTertiary} weight="semibold" /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Tappable
      onPress={onPress}
      accessibilityLabel={[t('{label}: {value}', { label, value }), detail].filter(Boolean).join(', ')}
      pressedOpacity={0.5}>
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

function InfoLink({ label, slug }: { label: string; slug: string }) {
  return (
    <Button
      title={label}
      variant="link"
      chevron
      onPress={() => router.push({ pathname: '/info/[slug]', params: { slug } })}
    />
  );
}

/**
 * One column of the facts card that overlaps the panel: label, value, detail, with a hairline
 * between the columns. The hourly rate is in the brand colour, as the design asks.
 */
function Stat({
  label,
  value,
  detail,
  spoken,
  first,
  wide,
  brand,
}: {
  label: string;
  value: string;
  detail: string;
  /** What VoiceOver reads for the value, when it differs from the text. */
  spoken?: string;
  first?: boolean;
  /** Gets more of the width, for a price range that is longer than the other values. */
  wide?: boolean;
  brand?: boolean;
}) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.stat,
        wide ? styles.statWide : null,
        first ? null : { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border },
      ]}
      accessible
      accessibilityLabel={`${label}: ${spoken ?? `${value}, ${detail}`}`}>
      <AppText variant="footnote" tone="textSecondary" numberOfLines={1} maxFontSizeMultiplier={1.3}>
        {label}
      </AppText>
      {/* iOS shrinks a long value, like a price range, to fit; the web cannot, so it starts smaller. */}
      <AppText
        variant="title1"
        tone={brand ? 'brandText' : 'text'}
        numberOfLines={1}
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1.3}
        style={Platform.OS === 'web' ? styles.statValueWeb : null}>
        {value}
      </AppText>
      <AppText variant="caption" tone="textSecondary" numberOfLines={1} maxFontSizeMultiplier={1.3}>
        {detail}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { gap: Spacing.md },
  heroButtonsSpace: { height: MinTouchSize },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  heroMeta: { marginTop: Spacing.xs },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs + 2 },
  checks: { gap: 6, paddingLeft: IconWell.row.size + Spacing.md, paddingBottom: Spacing.sm },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  facts: {
    flexDirection: 'row',
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.card,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 3 },
  statWide: { flex: 1.3 },
  statValueWeb: { fontSize: 25, lineHeight: 30 },
  reviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    minHeight: 64,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
  },
  reviewLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  notice: { paddingHorizontal: Spacing.xs },
  body: { paddingHorizontal: ScreenPadding, gap: Spacing.md + 2 },
  quickActions: { flexDirection: 'row', gap: Spacing.sm },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: MinTouchSize + 8,
    paddingVertical: Spacing.xs,
  },
  iconWell: {
    width: IconWell.row.size,
    height: IconWell.row.size,
    borderRadius: IconWell.row.radius,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaced: { marginTop: Spacing.md },
  spacedSmall: { marginTop: Spacing.xs },
  buttonRow: { flexDirection: 'row', marginTop: Spacing.md },
  examples: { marginTop: Spacing.lg },
  examplesHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 40,
    paddingVertical: Spacing.xs,
  },
  hoursRow: { flexDirection: 'row', paddingVertical: 5 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.md },
  facts2: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  fact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
  },
  footer: { gap: Spacing.sm, alignItems: 'center', paddingTop: Spacing.sm },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 18,
  },
  // Clear of the back button on the left and the two buttons on the right.
  topBarTitle: { alignSelf: 'stretch', textAlign: 'center', marginHorizontal: MinTouchSize * 2 + Spacing.xxl },
  topButtons: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topRight: { flexDirection: 'row', gap: Spacing.sm },
  contactBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  compare: {
    width: 56,
    height: 54,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
