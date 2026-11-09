import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/format';
import { type GroupJob, MIN_GROUP } from '@/state/groups';
import { t } from '@/i18n';

/** One group in a list: the job, the street, how many are in, and when. */
export function GroupCard({ group }: { group: GroupJob }) {
  const colors = useTheme();
  const category = getCategory(group.category);
  const job = category?.jobs.find((j) => j.id === group.job);
  const title = job?.name ?? group.job;
  const enough = group.members >= MIN_GROUP;
  return (
    <Tappable
      onPress={() => router.push({ pathname: '/faelles/[id]', params: { id: group.id } })}
      accessibilityLabel={t('{title} i {area}, {count} deltagere, {from} til {to}', {
        title,
        area: group.area,
        count: group.members,
        from: formatDate(group.wantedFrom),
        to: formatDate(group.wantedTo),
      })}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.icon, { backgroundColor: colors.brandSoft }]}>
        <Icon name={group.category} size={18} color={colors.brand} weight="semibold" />
      </View>
      <View style={styles.flex}>
        <AppText variant="headline" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
          {group.area}, {group.postalCode} · {formatDate(group.wantedFrom)}–{formatDate(group.wantedTo)}
        </AppText>
        <View style={styles.badges}>
          <Badge
            label={t('{count} med', { count: group.members })}
            tone={enough ? 'success' : 'neutral'}
            icon="people"
          />
          {group.mine === 'created' ? <Badge label={t('Din gruppe')} tone="brand" /> : null}
          {group.mine === 'joined' ? <Badge label={t('Du er med')} tone="brand" /> : null}
          {group.status === 'sent' ? <Badge label={t('Sendt til virksomhed')} tone="info" /> : null}
        </View>
      </View>
      <Icon name="chevronRight" size={13} color={colors.textTertiary} weight="semibold" />
    </Tappable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
});
