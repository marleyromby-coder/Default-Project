import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessMark } from '@/components/business/business-mark';
import { VerifiedMark } from '@/components/business/verified-mark';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, Divider } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { ListRow, ListSection } from '@/components/ui/list';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { ScreenPadding, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { localDay, nextDay } from '@/lib/availability';
import { currencyOf, timeZoneOf } from '@/lib/business-text';
import { showDialog } from '@/lib/dialog';
import {
  formatDate,
  formatDateTime,
  formatHourly,
  formatMonth,
  formatNumber,
  formatPhone,
  formatRating,
  phoneHref,
} from '@/lib/format';
import { MIN_PAID_PRICES } from '@/lib/prices';
import type { Business } from '@/lib/types';
import { t } from '@/i18n';
import { useApp, useBusiness } from '@/state/app-state';
import {
  type BusinessContact,
  leaveBusiness,
  loadBusinessContacts,
  loadMonthSummary,
  type ManagedBusiness,
  type MonthSummary,
  setMyAvailability,
  useLastChangeRequest,
  useManagedBusiness,
} from '@/state/business-account';
import { loadReviews, loadSharedPrices, useReviewSummary, useSharedPrices } from '@/state/community';

const SHOWN_CONTACTS = 15;

type FreeChoice = 'today' | 'both' | 'tomorrow' | 'none';

const FREE_CHOICES: { value: FreeChoice; label: string }[] = [
  { value: 'today', label: t('Ledig i dag') },
  { value: 'both', label: t('I dag og i morgen') },
  { value: 'tomorrow', label: t('Ledig i morgen') },
  { value: 'none', label: t('Ikke ledig') },
];

/**
 * "Min virksomhed": the business's own page. Who called, free time today, the monthly summary
 * and a way to ask for changes. Free for businesses, like the rest of FixMatch.
 */
export default function MyBusinessScreen() {
  const managed = useManagedBusiness();
  const business = useBusiness(managed?.businessId);

  if (!managed) {
    return (
      <EmptyState
        icon="store"
        title={t('Du er ikke logget ind som virksomhed')}
        message={t('Log ind med koden fra FixMatch for at se jeres opkald og melde ledig tid.')}
        action={<Button title={t('Log ind som virksomhed')} onPress={() => router.replace('/virksomhed-login')} />}
      />
    );
  }
  if (!business) {
    return (
      <EmptyState
        icon="help"
        title={t('Virksomheden findes ikke længere')}
        message={t('Den er ikke på FixMatch lige nu. Skriv til os, hvis det er en fejl.')}
        action={<Button title={t('Log ud af virksomheden')} onPress={() => leaveBusiness().catch(() => undefined)} />}
      />
    );
  }
  return <Dashboard managed={managed} business={business} />;
}

function Dashboard({ managed, business }: { managed: ManagedBusiness; business: Business }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const { setAvailability } = useApp();
  const [contacts, setContacts] = useState<BusinessContact[]>();
  const [months, setMonths] = useState<MonthSummary[]>();
  const [failed, setFailed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [saving, setSaving] = useState<FreeChoice>();
  const reviews = useReviewSummary(business.id);
  const shared = useSharedPrices().filter((r) => r.businessId === business.id);
  const lastRequest = useLastChangeRequest(business.id);

  const fetchAll = useCallback(() => {
    loadReviews(business.id).catch(() => undefined);
    loadSharedPrices(business.country ?? 'DK').catch(() => undefined);
    return Promise.all([loadBusinessContacts(managed), loadMonthSummary(managed)])
      .then(([list, summary]) => {
        setContacts(list);
        setMonths(summary);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, [managed, business.id, business.country]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const load = () => {
    setFailed(false);
    fetchAll();
  };

  const today = localDay(new Date(), timeZoneOf(business));
  const tomorrow = nextDay(today);
  const days = business.availableOn ?? [];
  const current: FreeChoice =
    days.includes(today) && days.includes(tomorrow)
      ? 'both'
      : days.includes(today)
        ? 'today'
        : days.includes(tomorrow)
          ? 'tomorrow'
          : 'none';

  const chooseFree = async (choice: FreeChoice) => {
    const wanted = { today: [today], both: [today, tomorrow], tomorrow: [tomorrow], none: [] }[choice];
    setSaving(choice);
    try {
      setAvailability(business.id, await setMyAvailability(managed, wanted));
    } catch {
      showDialog(t('Det blev ikke gemt'), t('Tjek internettet, og prøv igen.'));
    } finally {
      setSaving(undefined);
    }
  };

  const confirmLeave = () =>
    showDialog(
      t('Log ud af virksomheden?'),
      t('Du kan logge ind igen med koden fra FixMatch. Din egen bruger bliver ikke slettet.'),
      [
        { text: t('Annuller'), style: 'cancel' },
        {
          text: t('Log ud'),
          style: 'destructive',
          onPress: () => {
            leaveBusiness().catch(() => undefined);
            router.back();
          },
        },
      ],
    );

  const thisMonth = months?.[0];
  const shownContacts = showAll ? contacts : contacts?.slice(0, SHOWN_CONTACTS);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, column, { paddingBottom: insets.bottom + Spacing.xxl }]}
      contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: t('Min virksomhed') }} />

      <Card>
        <View style={styles.row}>
          <BusinessMark business={business} size={52} />
          <View style={styles.flex}>
            <View style={styles.nameRow}>
              <AppText variant="title3" numberOfLines={2} style={styles.shrink}>
                {business.name}
              </AppText>
              <VerifiedMark business={business} size={16} />
            </View>
            <AppText variant="footnote" tone="textSecondary">
              {formatHourly(business.pricing.hourlyMin, business.pricing.hourlyMax, currencyOf(business))}
            </AppText>
          </View>
        </View>
        {managed.demo ? (
          <View style={styles.spaced}>
            <Badge label={t('Eksempel: opkaldene er opdigtede')} tone="warning" />
          </View>
        ) : null}
        <View style={styles.spaced}>
          <Button
            title={t('Se jeres side, som kunderne ser den')}
            variant="plain"
            size="small"
            onPress={() => router.push({ pathname: '/virksomhed/[id]', params: { id: business.id } })}
          />
        </View>
      </Card>

      <Card>
        <CardTitle title={t('Har I tid?')} icon="calendar" />
        <AppText variant="footnote" tone="textSecondary" style={styles.spaced}>
          {t('Kunder, hvor det haster, ser jer først. Det forsvinder af sig selv ved midnat.')}
        </AppText>
        <View style={[styles.chips, styles.spaced]}>
          {FREE_CHOICES.map((choice) => (
            <Chip
              key={choice.value}
              label={saving === choice.value ? t('Gemmer…') : choice.label}
              selected={current === choice.value}
              onPress={() => chooseFree(choice.value)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <CardTitle title={t('Opgørelse')} icon="list" />
        {failed ? (
          <View style={styles.spaced}>
            <AppText variant="footnote" tone="textSecondary">
              {t('Opgørelsen kunne ikke hentes.')}
            </AppText>
            <Button title={t('Prøv igen')} variant="plain" size="small" onPress={load} />
          </View>
        ) : (
          <>
            <View style={[styles.stats, styles.spaced]}>
              <Stat
                value={thisMonth ? formatNumber(thisMonth.calls) : '–'}
                label={t('opkald i {month}', { month: thisMonth ? formatMonth(thisMonth.month) : '' })}
              />
              <Stat
                value={reviews ? formatRating(reviews.average) : '–'}
                label={
                  reviews ? t('stjerner fra {count} kunder', { count: reviews.reviews }) : t('ingen anmeldelser endnu')
                }
              />
              <Stat value={formatNumber(shared.length)} label={t('priser delt af kunder')} />
            </View>
            {(months ?? []).slice(0, 6).map((month) => (
              <View key={month.month}>
                <Divider />
                <View style={styles.monthRow}>
                  <AppText variant="subhead" style={styles.flex}>
                    {formatMonth(month.month)}
                  </AppText>
                  <AppText variant="subhead" tabular>
                    {t('{calls} opkald · {messages} beskeder', { calls: month.calls, messages: month.messages })}
                  </AppText>
                </View>
              </View>
            ))}
            {shared.length > 0 && shared.length < MIN_PAID_PRICES ? (
              <AppText variant="caption" tone="textSecondary" style={styles.spaced}>
                {t('Kundernes priser vises, når mindst {min} har delt for samme opgave.', { min: MIN_PAID_PRICES })}
              </AppText>
            ) : null}
          </>
        )}
      </Card>

      <Card>
        <CardTitle title={t('Hvem har kontaktet jer')} icon="phone" />
        {!contacts && !failed ? (
          <AppText variant="footnote" tone="textSecondary" style={styles.spaced}>
            {t('Henter…')}
          </AppText>
        ) : null}
        {contacts && contacts.length === 0 ? (
          <AppText variant="footnote" tone="textSecondary" style={styles.spaced}>
            {t('Ingen har kontaktet jer gennem FixMatch de sidste 90 dage.')}
          </AppText>
        ) : null}
        {shownContacts?.map((contact, index) => (
          <View key={`${contact.at}-${index}`}>
            {index > 0 ? <Divider inset={30} /> : null}
            <Tappable
              onPress={() => {
                if (!contact.phone || managed.demo) return;
                Linking.openURL(phoneHref(contact.phone)).catch(() => undefined);
              }}
              disabled={!contact.phone}
              accessibilityLabel={t('{name}, {when}. Ring tilbage', {
                name: contact.name ?? t('Ukendt'),
                when: formatDateTime(contact.at),
              })}
              style={styles.contactRow}>
              <Icon
                name={contact.channel === 'call' ? 'phone' : 'message'}
                size={15}
                color={colors.textSecondary}
                weight="semibold"
              />
              <View style={styles.flex}>
                <AppText variant="body" numberOfLines={1}>
                  {contact.name ?? t('Ukendt')}
                </AppText>
                <AppText variant="footnote" tone="textSecondary">
                  {[contact.phone ? formatPhone(contact.phone) : undefined, formatDateTime(contact.at)]
                    .filter(Boolean)
                    .join(' · ')}
                </AppText>
              </View>
              {contact.phone ? <Icon name="phone" size={15} color={colors.brand} weight="semibold" /> : null}
            </Tappable>
          </View>
        ))}
        {contacts && contacts.length > SHOWN_CONTACTS && !showAll ? (
          <Button
            title={t('Vis alle {count}', { count: contacts.length })}
            variant="plain"
            size="small"
            onPress={() => setShowAll(true)}
          />
        ) : null}
        <AppText variant="caption" tone="textSecondary" style={styles.spaced}>
          {t(
            'Kunderne har sagt ja til, at I ser navn og nummer, når de kontakter jer gennem FixMatch. Brug dem kun til at svare på henvendelsen. Listen viser de sidste 90 dage.',
          )}
        </AppText>
      </Card>

      <ListSection
        title={t('Jeres oplysninger')}
        footer={
          lastRequest
            ? t('Sendt {date}. Vi tjekker og lægger det ind inden for 2 hverdage.', {
                date: formatDate(lastRequest),
              })
            : t('Vi tjekker ændringerne og lægger dem ind inden for 2 hverdage.')
        }>
        <ListRow
          icon="tag"
          title={t('Ret priser, åbningstider og tekst')}
          onPress={() => router.push('/min-virksomhed/ret')}
        />
        <ListRow
          icon="verified"
          title={t('Bliv verificeret')}
          value={business.verified ? t('Verificeret') : undefined}
          onPress={() => router.push({ pathname: '/info/[slug]', params: { slug: 'verificering' } })}
        />
      </ListSection>

      <ListSection>
        <ListRow icon="logout" title={t('Log ud af virksomheden')} destructive onPress={confirmLeave} />
      </ListSection>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${value} ${label}`}>
      <AppText variant="title2" rounded>
        {value}
      </AppText>
      <AppText variant="caption" tone="textSecondary" numberOfLines={3}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  content: { padding: ScreenPadding, gap: Spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  spaced: { marginTop: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  stats: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  stat: { flex: 1, gap: 2 },
  monthRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 52,
  },
});
