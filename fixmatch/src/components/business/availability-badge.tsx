import { Badge } from '@/components/ui/badge';
import { availableWhen } from '@/lib/availability';
import type { Business } from '@/lib/types';
import { t } from '@/i18n';

/** "Ledig i dag" / "Ledig i morgen" when the business has marked free time. */
export function AvailabilityBadge({ business, now }: { business: Business; now?: Date }) {
  const when = availableWhen(business, now);
  if (!when) return null;
  return when === 'today' ? (
    <Badge
      label={t('Ledig i dag')}
      tone="success"
      icon="calendar"
      accessibilityLabel={t('Har selv meldt ledig tid i dag')}
    />
  ) : (
    <Badge
      label={t('Ledig i morgen')}
      tone="info"
      icon="calendar"
      accessibilityLabel={t('Har selv meldt ledig tid i morgen')}
    />
  );
}
