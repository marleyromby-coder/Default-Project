import * as Clipboard from 'expo-clipboard';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessCard } from '@/components/business/business-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { DEFAULT_LOCATION } from '@/data/places';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { localDay } from '@/lib/availability';
import { countryOf } from '@/lib/business-text';
import { sendProblem } from '@/lib/contact';
import { showDialog } from '@/lib/dialog';
import { formatDate } from '@/lib/format';
import { groupLink } from '@/lib/group-link';
import { scoreBusinesses } from '@/lib/ranking';
import type { Business } from '@/lib/types';
import { useAccount } from '@/state/account';
import { useApp, useMarket } from '@/state/app-state';
import {
  GROUP_DISCOUNT,
  GroupError,
  type GroupJob,
  joinGroup,
  leaveGroup,
  loadGroups,
  markGroupSent,
  MIN_GROUP,
  useGroup,
} from '@/state/groups';
import { t } from '@/i18n';

/** The message to the neighbours, with the link and the code. */
export function inviteText(group: GroupJob, jobName: string): string {
  return [
    t('Hej nabo! Vi går sammen om {job} i {area}, så vi får det lavet samme dag og billigere.', {
      job: jobName.toLowerCase(),
      area: group.area,
    }),
    t('Vil du med? Se gruppen og deltag her: {link}', { link: groupLink(group.code) }),
    t('Eller åbn FixMatch → Naborabat, og skriv koden {code}.', { code: group.code }),
  ].join('\n\n');
}

/** The joint request to a business. */
export function requestText(group: GroupJob, jobName: string, business: Business): string {
  return [
    t(
      'Hej {name}. Vi er {count} husstande i {area}, {postal}, der gerne vil have {job} lavet samme dag, gerne mellem {from} og {to}.',
      {
        name: business.name,
        count: group.members,
        area: group.area,
        postal: group.postalCode,
        job: jobName.toLowerCase(),
        from: formatDate(group.wantedFrom),
        to: formatDate(group.wantedTo),
      },
    ),
    group.note?.trim() || undefined,
    t('Kan I give en samlet pris med rabat, når I sparer kørslen? Vi har fundet jer på FixMatch.'),
  ]
    .filter(Boolean)
    .join('\n\n');
}

export default function GroupScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const { id, ny } = useLocalSearchParams<{ id: string; ny?: string }>();
  const { state } = useApp();
  const { country, market } = useMarket();
  const account = useAccount();
  const group = useGroup(id);
  const [busy, setBusy] = useState(false);
  const [pickBusiness, setPickBusiness] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Opened from a link or a code before the list was fetched: fetch it now.
  useEffect(() => {
    if (group) return;
    const postalCode = state.location.postalCode ?? DEFAULT_LOCATION.postalCode;
    loadGroups(market.country, postalCode, localDay(new Date()))
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [group, market.country, state.location.postalCode]);

  if (!group && !loaded) return null;
  if (!group) {
    return (
      <EmptyState
        icon="people"
        title={t('Gruppen findes ikke længere')}
        message={t('Den er lukket, eller linket virker ikke.')}
        action={<Button title={t('Tilbage')} onPress={() => router.back()} />}
      />
    );
  }

  const category = getCategory(group.category);
  const job = category?.jobs.find((j) => j.id === group.job);
  const jobName = job?.name ?? group.job;
  const enough = group.members >= MIN_GROUP;
  const userId = account.status === 'signedIn' ? account.userId : undefined;

  const share = async () => {
    const message = inviteText(group, jobName);
    try {
      if (Platform.OS === 'web' && !('share' in globalThis.navigator)) throw new Error('no share');
      await Share.share({ message });
    } catch {
      await Clipboard.setStringAsync(message).catch(() => undefined);
      showDialog(t('Kopieret'), t('Beskeden er kopieret, så du kan sende den til naboerne.'));
    }
  };

  const join = async () => {
    setBusy(true);
    try {
      await joinGroup(group, userId);
    } catch (error) {
      const reason = error instanceof GroupError ? error.reason : 'network';
      showDialog(
        reason === 'signed-out' ? t('Log ind først') : t('Det lykkedes ikke'),
        reason === 'signed-out'
          ? t('Opret en bruger eller log ind, så vi ved, at I er rigtige naboer.')
          : t('Tjek internettet, og prøv igen.'),
      );
    } finally {
      setBusy(false);
    }
  };

  const leave = () =>
    showDialog(
      group.mine === 'created' ? t('Luk gruppen?') : t('Forlad gruppen?'),
      group.mine === 'created'
        ? t('Naboerne kan ikke længere melde sig til.')
        : t('Du kan melde dig til igen med koden.'),
      [
        { text: t('Annuller'), style: 'cancel' },
        {
          text: group.mine === 'created' ? t('Luk') : t('Forlad'),
          style: 'destructive',
          onPress: () => {
            leaveGroup(group).catch(() => undefined);
            router.back();
          },
        },
      ],
    );

  const candidates = category
    ? scoreBusinesses(
        state.businesses.filter((b) => countryOf(b) === country && b.categories.includes(category.id)),
        state.location.coords,
        state.priorities,
      ).slice(0, 3)
    : [];

  const send = async (business: Business) => {
    await sendProblem(business, { text: requestText(group, jobName, business), photos: [] }, { plain: true });
    if (!business.demo) markGroupSent(group).catch(() => undefined);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, column, { paddingBottom: insets.bottom + Spacing.xxl }]}
      contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: jobName }} />

      {ny === '1' ? (
        <View style={[styles.notice, { backgroundColor: colors.successSoft }]}>
          <Icon name="check" size={16} color={colors.success} weight="semibold" />
          <AppText variant="footnote" style={styles.flex}>
            {t('Gruppen er oprettet. Send koden til naboerne, så I bliver mindst {min}.', { min: MIN_GROUP })}
          </AppText>
        </View>
      ) : null}

      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: colors.brandSoft }]}>
          <Icon name={group.category} size={22} color={colors.brand} weight="semibold" />
        </View>
        <View style={styles.flex}>
          <AppText variant="title2">{jobName}</AppText>
          <AppText variant="subhead" tone="textSecondary">
            {group.area}, {group.postalCode}
          </AppText>
        </View>
      </View>
      <View style={styles.badges}>
        <Badge
          label={t('{count} husstande med', { count: group.members })}
          tone={enough ? 'success' : 'neutral'}
          icon="people"
        />
        <Badge label={`${formatDate(group.wantedFrom)}–${formatDate(group.wantedTo)}`} tone="neutral" icon="calendar" />
        {group.status === 'sent' ? <Badge label={t('Sendt til virksomhed')} tone="info" /> : null}
      </View>
      {group.note ? <AppText variant="body">{group.note}</AppText> : null}

      <Card>
        <CardTitle title={t('Koden til naboerne')} icon="share" />
        <View style={[styles.code, styles.spaced, { backgroundColor: colors.surfaceAlt }]}>
          <AppText
            variant="title1"
            rounded
            style={styles.codeText}
            accessibilityLabel={t('Kode {code}', { code: group.code.split('').join(' ') })}>
            {group.code}
          </AppText>
        </View>
        <AppText variant="footnote" tone="textSecondary" style={styles.spaced}>
          {enough
            ? t('I er nok til at få rabat. Flere kan stadig komme med.')
            : t('I mangler {count} for at være {min}. Så giver virksomheder typisk {min_pct}–{max_pct} % rabat.', {
                count: MIN_GROUP - group.members,
                min: MIN_GROUP,
                min_pct: GROUP_DISCOUNT.min,
                max_pct: GROUP_DISCOUNT.max,
              })}
        </AppText>
        <View style={[styles.actions, styles.spaced]}>
          <Button title={t('Send koden til naboerne')} icon="share" size="small" onPress={share} />
          {!group.mine ? (
            <Button title={t('Deltag')} icon="plus" variant="secondary" size="small" loading={busy} onPress={join} />
          ) : null}
        </View>
      </Card>

      {group.mine ? (
        <Card>
          <CardTitle title={t('Send forespørgslen til en virksomhed')} icon="message" />
          <AppText variant="footnote" tone="textSecondary" style={styles.spaced}>
            {enough
              ? t(
                  'Vælg en virksomhed, så sender vi en besked fra din telefon med antal, gade og periode. De svarer dig direkte.',
                )
              : t('Vent gerne, til I er {min}. Du kan dog godt spørge nu.', { min: MIN_GROUP })}
          </AppText>
          {!pickBusiness ? (
            <View style={styles.spaced}>
              <Button
                title={t('Vælg virksomhed')}
                icon={group.category}
                variant={enough ? 'primary' : 'secondary'}
                size="small"
                onPress={() => setPickBusiness(true)}
              />
            </View>
          ) : (
            <View style={[styles.list, styles.spaced]}>
              {candidates.map((item) => (
                <View key={item.business.id} style={styles.candidate}>
                  <BusinessCard item={item} job={job} />
                  <Button
                    title={t('Send til {name}', { name: item.business.name })}
                    icon="message"
                    size="small"
                    onPress={() => send(item.business)}
                    block
                  />
                </View>
              ))}
              <Button
                title={t('Se alle {plural}', { plural: (category?.plural ?? '').toLowerCase() })}
                variant="plain"
                size="small"
                onPress={() =>
                  router.push({ pathname: '/kategori/[id]', params: { id: group.category, job: group.job } })
                }
              />
            </View>
          )}
        </Card>
      ) : null}

      <AppText variant="caption" tone="textSecondary" align="center">
        {t(
          'FixMatch er ikke part i aftalen. Rabatten aftaler I direkte med virksomheden, og hver husstand får sin egen faktura.',
        )}
      </AppText>
      {group.mine ? (
        <Button
          title={group.mine === 'created' ? t('Luk gruppen') : t('Forlad gruppen')}
          variant="plain"
          size="small"
          onPress={leave}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.md },
  notice: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  icon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  spaced: { marginTop: Spacing.sm },
  code: { padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
  codeText: { letterSpacing: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  list: { gap: Spacing.md },
  candidate: { gap: Spacing.xs },
});
