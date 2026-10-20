import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
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
import { weightsFromPriorities } from '@/lib/ranking';
import { useApp } from '@/state/app-state';

export default function MoreScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { state, resetAll } = useApp();
  const weights = weightsFromPriorities(state.priorities);
  const info = (slug: string) => () => router.push({ pathname: '/info/[slug]', params: { slug } });

  const confirmReset = () =>
    showDialog('Nulstil app-data?', 'Gemte virksomheder, valgt by og dine prioriteter slettes fra telefonen.', [
      { text: 'Annuller', style: 'cancel' },
      { text: 'Nulstil', style: 'destructive', onPress: resetAll },
    ]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 110 }]}
      contentInsetAdjustmentBehavior="never">
      <ScreenHeader title="Mere" />
      <View style={styles.sections}>
        <ListSection title="Din søgning">
          <ListRow
            icon="pin"
            title="Placering"
            value={state.location.label}
            onPress={() => router.push('/placering')}
          />
          <ListRow
            icon="sliders"
            title="Dine prioriteter"
            value={`${Math.round(weights.price * 100)}/${Math.round(weights.distance * 100)}/${Math.round(weights.reviews * 100)}`}
            onPress={() => router.push('/prioriteter')}
            accessibilityHint="Pris, afstand og anmeldelser i procent"
          />
        </ListSection>

        <ListSection title="Gennemsigtighed" footer="Ingen kan betale sig til en bedre placering i søgeresultaterne.">
          <ListRow icon="list" title="Sådan rangerer vi" onPress={info('rangering')} />
          <ListRow icon="star" title="Om anmeldelser" onPress={info('anmeldelser')} />
          <ListRow icon="tag" title="Om priserne og håndværkerfradrag" onPress={info('priser')} />
          <ListRow icon="scale" title="Hvis noget går galt" onPress={info('hjaelp')} />
        </ListSection>

        <ListSection title="For virksomheder">
          <ListRow icon="store" title="Få din virksomhed på FixMatch" onPress={info('virksomheder')} />
          <ListRow icon="flag" title="Ret eller fjern oplysninger" onPress={() => reportProblem()} />
        </ListSection>

        <ListSection title="Om">
          <ListRow icon="wrench" title="Om FixMatch" onPress={info('om')} />
          <ListRow icon="privacy" title="Privatlivspolitik" onPress={info('privatliv')} />
          <ListRow icon="doc" title="Vilkår for brug" onPress={info('vilkaar')} />
          <ListRow icon="mail" title="Kontakt os" value={APP_INFO.email} onPress={() => reportProblem()} />
        </ListSection>

        <ListSection>
          <ListRow icon="trash" title="Nulstil app-data" destructive onPress={confirmReset} />
        </ListSection>

        <View style={styles.about}>
          <LogoMark size={36} />
          <AppText variant="footnote" tone="textSecondary" align="center">
            FixMatch {Constants.expoConfig?.version ?? '1.0.0'}
            {DATA_MODE === 'demo' ? ' · demodata' : ''}
          </AppText>
          <AppText variant="caption" tone="textTertiary" align="center">
            Lavet i Danmark · {APP_INFO.company}
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
