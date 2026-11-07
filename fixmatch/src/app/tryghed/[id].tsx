import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessMark } from '@/components/business/business-mark';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, Divider } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { ScreenPadding, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { AUTHORIZATION_REGISTER_URL, openCvr, openLink, reportProblem } from '@/lib/contact';
import { showDialog } from '@/lib/dialog';
import { formatDate, formatRegistryNumber } from '@/lib/format';
import { countryOf } from '@/lib/business-text';
import {
  complaintBoards,
  SAFETY_TITLES,
  type SafetyItem,
  type SafetyStatus,
  safetyItems,
  safetySummary,
} from '@/lib/safety';
import type { Business } from '@/lib/types';
import { t } from '@/i18n';
import { useBusiness } from '@/state/app-state';

const STATUS: Record<SafetyStatus, { icon: IconName; label: string }> = {
  checked: { icon: 'verified', label: t('Tjekket af FixMatch') },
  stated: { icon: 'info', label: t('Oplyst af virksomheden') },
  missing: { icon: 'help', label: t('Ikke oplyst') },
};

/** What each point means for the customer, depending on what is known. */
function explain(item: SafetyItem, business: Business): string {
  switch (item.key) {
    case 'cvr':
      return t('CVR {number}. Du kan selv se, om virksomheden er aktiv, og hvem der ejer den.', {
        number: formatRegistryNumber(business.cvr, countryOf(business)),
      });
    case 'identity':
      return item.status === 'checked'
        ? t('FixMatch har talt med ejeren og bekræftet, at det er dem, der står bag.')
        : t('FixMatch har ikke bekræftet, hvem ejeren er.');
    case 'authorization':
      if (item.status === 'missing') {
        return t(
          'Arbejde med el, VVS og kloak kræver autorisation. Spørg efter autorisationsnummeret, før arbejdet går i gang.',
        );
      }
      return t('Autorisationsnummer: {numbers}. Du kan selv slå det op hos Sikkerhedsstyrelsen.', {
        numbers: item.value ?? '',
      });
    case 'insurance':
      if (item.status === 'missing') {
        return t('Spørg, om virksomheden har en erhvervsansvarsforsikring, der dækker skader på dit hjem.');
      }
      return item.value
        ? t('Forsikret hos {name}. Den dækker, hvis virksomheden kommer til at skade dit hjem.', { name: item.value })
        : t('Virksomheden har en erhvervsansvarsforsikring. Den dækker, hvis den kommer til at skade dit hjem.');
    case 'guarantee':
      if (item.status === 'missing') {
        return t('Uden en garantiordning kan det være svært at få rettet fejl, hvis virksomheden lukker.');
      }
      return item.value
        ? t('Med i {name}. Den kan dække fejl ved arbejdet, også hvis virksomheden lukker.', { name: item.value })
        : t('Med i en garantiordning, der kan dække fejl ved arbejdet.');
  }
}

const BEFORE_YES = [
  t('Få et skriftligt tilbud med fast pris eller et overslag, før arbejdet går i gang.'),
  t('Aftal, hvad der sker, hvis opgaven bliver større end ventet.'),
  t('Aftal, hvornår arbejdet starter og er færdigt.'),
  t('Betal ikke det hele på forhånd. Betal efter regning, når arbejdet er gjort.'),
  t('Bed om en faktura med timer og materialer hver for sig. Den skal bruges til håndværkerfradraget.'),
];

export default function SafetyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const business = useBusiness(id);
  if (!business) {
    return (
      <EmptyState
        icon="help"
        title={t('Virksomheden findes ikke længere')}
        message={t('Linket virker ikke længere.')}
        action={<Button title={t('Tilbage')} onPress={() => router.back()} />}
      />
    );
  }
  return <Safety business={business} />;
}

function Safety({ business }: { business: Business }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const items = safetyItems(business);
  const { checked, total } = safetySummary(items);
  const boards = complaintBoards(business);
  const tone: Record<SafetyStatus, string> = {
    checked: colors.success,
    stated: colors.info,
    missing: colors.warning,
  };

  const lookUp = (item: SafetyItem) => {
    if (item.key === 'cvr') return () => openCvr(business);
    if (item.key === 'authorization' && item.status !== 'missing' && countryOf(business) === 'DK') {
      return () =>
        business.demo
          ? showDialog(
              t('Eksempelvirksomhed'),
              t('I den færdige app kan du slå autorisationen op i Sikkerhedsstyrelsens register.'),
            )
          : openLink(AUTHORIZATION_REGISTER_URL);
    }
    return undefined;
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, column, { paddingBottom: insets.bottom + Spacing.xxl }]}
      contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: t('Tryghed') }} />

      <View style={styles.row}>
        <BusinessMark business={business} size={52} />
        <View style={styles.flex}>
          <AppText variant="title3" numberOfLines={2}>
            {business.name}
          </AppText>
          <AppText variant="footnote" tone="textSecondary">
            {t('{checked} af {total} punkter er tjekket af FixMatch', { checked, total })}
          </AppText>
        </View>
      </View>
      <AppText variant="callout" tone="textSecondary">
        {t(
          'Her er det, du bør vide, før du siger ja. Vi skriver altid, om FixMatch selv har tjekket det, eller om virksomheden bare har oplyst det.',
        )}
      </AppText>

      <Card>
        {items.map((item, index) => {
          const action = lookUp(item);
          return (
            <View key={item.key}>
              {index > 0 ? <Divider /> : null}
              <View
                style={styles.item}
                accessible
                accessibilityLabel={`${t(SAFETY_TITLES[item.key])}. ${STATUS[item.status].label}. ${explain(item, business)}`}>
                <Icon name={STATUS[item.status].icon} size={20} color={tone[item.status]} weight="semibold" />
                <View style={styles.flex}>
                  <AppText variant="headline">{t(SAFETY_TITLES[item.key])}</AppText>
                  <AppText variant="caption" weight="600" style={{ color: tone[item.status] }}>
                    {item.status === 'checked' && business.verified
                      ? t('Tjekket af FixMatch {date}', { date: formatDate(business.verified.date) })
                      : STATUS[item.status].label}
                  </AppText>
                  <AppText variant="subhead" tone="textSecondary">
                    {explain(item, business)}
                  </AppText>
                </View>
              </View>
              {action ? (
                <View style={styles.action}>
                  <Button
                    title={item.key === 'cvr' ? t('Slå op i CVR-registret') : t('Tjek hos Sikkerhedsstyrelsen')}
                    variant="plain"
                    size="small"
                    onPress={action}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </Card>

      <Card>
        <CardTitle title={t('Før du siger ja')} icon="check" />
        {BEFORE_YES.map((line) => (
          <View key={line} style={styles.bullet}>
            <Icon name="check" size={13} color={colors.brand} weight="bold" />
            <AppText variant="subhead" style={styles.flex}>
              {line}
            </AppText>
          </View>
        ))}
      </Card>

      <Card>
        <CardTitle title={t('Hvis noget går galt')} icon="scale" />
        <Step number={1} text={t('Klag skriftligt til virksomheden, og giv den mulighed for at rette fejlen.')} />
        {boards.length > 0 ? (
          <>
            <Step number={2} text={t('Kan I ikke blive enige, kan du klage til et ankenævn:')} />
            {boards.map((board) => (
              <View key={board.name} style={styles.board}>
                <AppText variant="subhead" weight="600">
                  {t(board.name)}
                </AppText>
                <AppText variant="footnote" tone="textSecondary">
                  {t(board.detail)}
                </AppText>
                {board.url ? (
                  <Button
                    title={t('Gå til {name}', { name: board.url.replace(/^https:\/\//, '') })}
                    variant="plain"
                    size="small"
                    onPress={() => openLink(board.url!)}
                  />
                ) : null}
              </View>
            ))}
            <AppText variant="caption" tone="textSecondary" style={styles.spaced}>
              {t('Hvilket nævn der kan tage sagen, afhænger af opgaven og af virksomhedens medlemskab.')}
            </AppText>
          </>
        ) : null}
        <Step
          number={boards.length > 0 ? 3 : 2}
          text={t('Se dine rettigheder og andre klagemuligheder på forbrug.dk.')}
        />
        <Button
          title={t('Gå til forbrug.dk')}
          variant="plain"
          size="small"
          onPress={() => openLink('https://forbrug.dk')}
        />
        <Step
          number={boards.length > 0 ? 4 : 3}
          text={t('Er oplysningerne her forkerte, så sig det til os. Vi svarer inden for 2 hverdage.')}
        />
        <Button
          title={t('Rapportér fejl eller ulovligt indhold')}
          variant="plain"
          size="small"
          onPress={() => reportProblem(business)}
        />
      </Card>

      <AppText variant="caption" tone="textSecondary" align="center">
        {t('FixMatch er ikke part i aftalen mellem dig og virksomheden.')}
      </AppText>
      <Button
        title={t('Sådan verificerer vi')}
        variant="plain"
        size="small"
        onPress={() => router.push({ pathname: '/info/[slug]', params: { slug: 'verificering' } })}
      />
    </ScrollView>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  const colors = useTheme();
  return (
    <View style={styles.step}>
      <View style={[styles.number, { backgroundColor: colors.brandSoft }]}>
        <AppText variant="caption" weight="700" style={{ color: colors.brandText }}>
          {number}
        </AppText>
      </View>
      <AppText variant="subhead" style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  item: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.md },
  action: { marginLeft: 32, marginTop: -Spacing.sm, marginBottom: Spacing.xs, alignItems: 'flex-start' },
  bullet: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, alignItems: 'flex-start' },
  step: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md, alignItems: 'flex-start' },
  number: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  board: { marginLeft: 34, marginTop: Spacing.sm, gap: 2, alignItems: 'flex-start' },
  spaced: { marginTop: Spacing.sm, marginLeft: 34 },
});
