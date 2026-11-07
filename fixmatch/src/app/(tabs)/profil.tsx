import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessMark } from '@/components/business/business-mark';
import { VerifiedMark } from '@/components/business/verified-mark';
import { ScreenHeader } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ListRow, ListSection } from '@/components/ui/list';
import { Segmented } from '@/components/ui/segmented';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { initials } from '@/lib/business-text';
import { showDialog } from '@/lib/dialog';
import { TRUSTPILOT_ENABLED } from '@/lib/features';
import { formatDate } from '@/lib/format';
import { countryName } from '@/lib/markets';
import { weightsFromPriorities } from '@/lib/ranking';
import type { Business } from '@/lib/types';
import { getLanguage, LANGUAGES, t } from '@/i18n';
import { clearContacts, deleteAccount, signOut, useAccount, useContacts, type ContactRecord } from '@/state/account';
import { useApp } from '@/state/app-state';
import { setAppearance, useAppearance } from '@/state/appearance';

import { changeLanguage } from './mere';

/**
 * Profil: who you are to the businesses (name and phone), the businesses you have contacted,
 * and your own settings. Everything about the app itself stays under Mere.
 */
export default function ProfileScreen() {
  const { column } = useLayout();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const account = useAccount();
  const contacts = useContacts();
  const appearance = useAppearance();
  const weights = weightsFromPriorities(state.priorities);
  const openAccount = (reason: 'settings' | 'profile') => () => router.push({ pathname: '/konto', params: { reason } });
  const signedIn = account.status === 'signedIn';
  const name = signedIn ? account.profile?.name : undefined;

  const confirmSignOut = () =>
    showDialog(t('Log ud?'), t('Du skal logge ind igen, før du kan kontakte en virksomhed.'), [
      { text: t('Annuller'), style: 'cancel' },
      { text: t('Log ud'), onPress: () => signOut() },
    ]);

  const confirmDelete = () =>
    showDialog(
      t('Slet din bruger?'),
      t('Din bruger, dit navn, dit telefonnummer og listen over virksomheder, du har kontaktet, slettes for altid.'),
      [
        { text: t('Annuller'), style: 'cancel' },
        {
          text: t('Slet bruger'),
          style: 'destructive',
          onPress: () =>
            deleteAccount().catch(() =>
              showDialog(t('Det lykkedes ikke'), t('Brugeren blev ikke slettet. Tjek internettet, og prøv igen.')),
            ),
        },
      ],
    );

  const confirmClearContacts = () =>
    showDialog(t('Ryd listen?'), t('Listen over virksomheder, du har kontaktet, slettes fra telefonen.'), [
      { text: t('Annuller'), style: 'cancel' },
      { text: t('Ryd'), style: 'destructive', onPress: clearContacts },
    ]);

  // One row per business, newest contact first.
  const recent = contacts
    .map((contact) => ({ contact, business: state.businesses.find((b) => b.id === contact.businessId) }))
    .filter((row): row is { contact: ContactRecord; business: Business } => row.business !== undefined)
    .filter((row, index, rows) => rows.findIndex((r) => r.business.id === row.business.id) === index)
    .slice(0, 10);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        column,
        { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 110 },
      ]}
      contentInsetAdjustmentBehavior="never">
      <ScreenHeader title={t('Profil')} />
      <View style={styles.sections}>
        <Tappable
          onPress={openAccount(signedIn ? 'profile' : 'settings')}
          accessibilityLabel={
            signedIn
              ? t('{name}. Ret navn og telefonnummer', { name: name ?? t('Tilføj navn og telefonnummer') })
              : t('Opret bruger eller log ind')
          }
          pressedOpacity={0.7}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: signedIn ? colors.brandSoft : colors.surfaceAlt }]}>
            {name ? (
              <AppText variant="title2" style={{ color: colors.brandText }}>
                {initials(name)}
              </AppText>
            ) : (
              <Icon name="person" size={30} color={colors.textSecondary} />
            )}
          </View>
          <View style={styles.flex}>
            <AppText variant="title3" numberOfLines={1}>
              {signedIn ? (name ?? t('Tilføj navn og telefonnummer')) : t('Du er ikke logget ind')}
            </AppText>
            <AppText variant="footnote" tone="textSecondary" numberOfLines={2}>
              {signedIn
                ? [account.profile?.phone, account.email].filter(Boolean).join(' · ') ||
                  t('Virksomhederne skal kunne se, hvem der ringer.')
                : t('Opret en bruger, så virksomhederne kan se dit navn og nummer, når du ringer.')}
            </AppText>
          </View>
          <Icon name="chevronRight" size={14} color={colors.textTertiary} weight="semibold" />
        </Tappable>

        {!signedIn ? (
          <Button title={t('Opret bruger eller log ind')} icon="person" onPress={openAccount('settings')} block />
        ) : null}

        <ListSection
          title={t('Dine opkald')}
          footer={
            recent.length > 0
              ? t('Listen ligger kun på din telefon. Virksomheden ser dit navn og nummer, når du ringer.')
              : t('Virksomheder, du ringer til eller skriver til gennem FixMatch, vises her.')
          }>
          {recent.length === 0 ? (
            <View style={styles.empty}>
              <Icon name="phone" size={22} color={colors.textTertiary} />
              <AppText variant="subhead" tone="textSecondary" align="center">
                {t('Du har ikke kontaktet nogen endnu.')}
              </AppText>
              <Button
                title={t('Find en håndværker')}
                variant="plain"
                size="small"
                onPress={() => router.navigate('/')}
              />
            </View>
          ) : (
            recent.map(({ contact, business }) => (
              <Tappable
                key={business.id}
                onPress={() => router.push({ pathname: '/virksomhed/[id]', params: { id: business.id } })}
                accessibilityLabel={t('{name}, {when}', { name: business.name, when: formatDate(contact.at) })}
                pressedOpacity={0.5}
                style={styles.contactRow}>
                <BusinessMark business={business} size={40} />
                <View style={styles.flex}>
                  <View style={styles.nameRow}>
                    <AppText variant="body" numberOfLines={1} style={styles.shrink}>
                      {business.name}
                    </AppText>
                    <VerifiedMark business={business} size={14} />
                  </View>
                  <AppText variant="footnote" tone="textSecondary">
                    {contact.channel === 'call'
                      ? t('Ringet {date}', { date: formatDate(contact.at) })
                      : t('Kontaktet {date}', { date: formatDate(contact.at) })}
                  </AppText>
                </View>
                <Icon name="chevronRight" size={13} color={colors.textTertiary} weight="semibold" />
              </Tappable>
            ))
          )}
          {recent.length > 0 ? <ListRow icon="trash" title={t('Ryd listen')} onPress={confirmClearContacts} /> : null}
        </ListSection>

        <ListSection title={t('Gemte')}>
          <ListRow
            icon="heartFill"
            title={t('Gemte håndværkere')}
            value={String(state.favorites.length)}
            onPress={() => router.navigate('/gemte')}
          />
        </ListSection>

        <ListSection title={t('Din søgning')}>
          <ListRow
            icon="pin"
            title={t('Placering')}
            value={
              (state.location.country ?? 'DK') === 'DK'
                ? state.location.label
                : `${state.location.label}, ${countryName(state.location.country ?? '')}`
            }
            onPress={() => router.push('/placering')}
          />
          <ListRow
            icon="globe"
            title={t('Sprog')}
            value={LANGUAGES.find((l) => l.value === getLanguage())?.label}
            onPress={changeLanguage}
          />
          <ListRow
            icon="sliders"
            title={t('Dine prioriteter')}
            value={[weights.price, weights.distance, ...(TRUSTPILOT_ENABLED ? [weights.reviews] : [])]
              .map((w) => Math.round(w * 100))
              .join('/')}
            onPress={() => router.push('/prioriteter')}
            accessibilityHint={
              TRUSTPILOT_ENABLED ? t('Pris, afstand og anmeldelser i procent') : t('Pris og afstand i procent')
            }
          />
        </ListSection>

        <ListSection title={t('Udseende')} footer={t('Automatisk følger telefonens indstilling.')}>
          <View style={styles.appearance}>
            <Segmented
              options={[
                { value: 'system', label: t('Automatisk') },
                { value: 'light', label: t('Lys') },
                { value: 'dark', label: t('Mørk') },
              ]}
              value={appearance}
              onChange={setAppearance}
              accessibilityLabel={t('Udseende')}
            />
          </View>
        </ListSection>

        {signedIn ? (
          <ListSection footer={t('Sletter du brugeren, slettes navn, telefonnummer og dine opkald for altid.')}>
            <ListRow icon="logout" title={t('Log ud')} onPress={confirmSignOut} />
            <ListRow icon="trash" title={t('Slet bruger')} destructive onPress={confirmDelete} />
          </ListSection>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  content: {},
  sections: { paddingHorizontal: ScreenPadding, gap: Spacing.xxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.lg },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 56,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  appearance: { padding: Spacing.md },
});
