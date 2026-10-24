import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoMark } from '@/components/logo';
import { ScreenHeader } from '@/components/screen-header';
import { ListRow, ListSection } from '@/components/ui/list';
import { AppText } from '@/components/ui/text';
import { APP_INFO } from '@/constants/app-info';
import { ScreenPadding, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { reportProblem } from '@/lib/contact';
import { DATA_MODE } from '@/lib/data-source';
import { showDialog } from '@/lib/dialog';
import { TRUSTPILOT_ENABLED } from '@/lib/features';
import { weightsFromPriorities } from '@/lib/ranking';
import { getLanguage, LANGUAGES, t } from '@/i18n';
import { countryName } from '@/lib/markets';
import { useApp } from '@/state/app-state';

/**
 * The app follows the phone's language. On iOS each app has its own language
 * setting, so we open Settings; the web demo reloads with ?lang=.
 */
function changeLanguage() {
  if (Platform.OS === 'web') {
    const next = getLanguage() === 'da' ? 'en' : 'da';
    const url = new URL(globalThis.location.href);
    url.searchParams.set('lang', next);
    globalThis.location.assign(url.toString());
    return;
  }
  showDialog(
    t('Skift sprog'),
    t('FixMatch følger telefonens sprog. Vælg sprog under Indstillinger → FixMatch → Sprog.'),
    [
      { text: t('Annuller'), style: 'cancel' },
      { text: t('Åbn Indstillinger'), onPress: () => Linking.openSettings().catch(() => undefined) },
    ],
  );
}

export default function MoreScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { state, resetAll } = useApp();
  const weights = weightsFromPriorities(state.priorities);
  const info = (slug: string) => () => router.push({ pathname: '/info/[slug]', params: { slug } });

  const confirmReset = () =>
    showDialog(t('Nulstil app-data?'), t('Gemte virksomheder, valgt by og dine prioriteter slettes fra telefonen.'), [
      { text: t('Annuller'), style: 'cancel' },
      { text: t('Nulstil'), style: 'destructive', onPress: resetAll },
    ]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 110 },
      ]}
      contentInsetAdjustmentBehavior="never">
      <ScreenHeader title={t('Mere')} />
      <View style={styles.sections}>
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

        <ListSection
          title={t('Gennemsigtighed')}
          footer={t('Ingen kan betale sig til en bedre placering i søgeresultaterne.')}>
          <ListRow icon="list" title={t('Sådan rangerer vi')} onPress={info('rangering')} />
          {TRUSTPILOT_ENABLED ? (
            <ListRow icon="star" title={t('Om anmeldelser')} onPress={info('anmeldelser')} />
          ) : null}
          <ListRow icon="tag" title={t('Om priserne')} onPress={info('priser')} />
          <ListRow icon="scale" title={t('Hvis noget går galt')} onPress={info('hjaelp')} />
        </ListSection>

        <ListSection title={t('For virksomheder')}>
          <ListRow icon="store" title={t('Få din virksomhed på FixMatch')} onPress={info('virksomheder')} />
          <ListRow icon="flag" title={t('Ret eller fjern oplysninger')} onPress={() => reportProblem()} />
        </ListSection>

        <ListSection title={t('Om')}>
          <ListRow icon="wrench" title={t('Om FixMatch')} onPress={info('om')} />
          <ListRow icon="privacy" title={t('Privatlivspolitik')} onPress={info('privatliv')} />
          <ListRow icon="doc" title={t('Vilkår for brug')} onPress={info('vilkaar')} />
          <ListRow icon="mail" title={t('Kontakt os')} value={APP_INFO.email} onPress={() => reportProblem()} />
        </ListSection>

        <ListSection>
          <ListRow icon="trash" title={t('Nulstil app-data')} destructive onPress={confirmReset} />
        </ListSection>

        <View style={styles.about}>
          <LogoMark size={36} />
          <AppText variant="footnote" tone="textSecondary" align="center">
            {`FixMatch ${Constants.expoConfig?.version ?? '1.0.0'}${DATA_MODE === 'demo' ? ` · ${t('demodata')}` : ''}`}
          </AppText>
          <AppText variant="caption" tone="textTertiary" align="center">
            {t('Lavet i Danmark · {company}', { company: APP_INFO.company })}
          </AppText>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {},
  sections: { paddingHorizontal: ScreenPadding, gap: Spacing.xxl },
  about: { alignItems: 'center', gap: Spacing.xs, paddingTop: Spacing.sm },
});
