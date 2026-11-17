import { t } from '@/i18n';

import { formatRating } from './format';
import type { ReviewSummary } from './types';

/**
 * What VoiceOver reads for FixMatch's own reviews, e.g. "4,5 af 5 stjerner fra 12 brugere via
 * FixMatch", with a singular for one review. Undefined when there are none, like ReviewRating.
 * Cards that set their own accessibilityLabel add it, so the rating is read there too.
 */
export function reviewRatingLabel(summary?: ReviewSummary): string | undefined {
  if (!summary || summary.reviews < 1) return undefined;
  const rating = formatRating(summary.average);
  return summary.reviews === 1
    ? t('{rating} af 5 stjerner fra 1 bruger via FixMatch', { rating })
    : t('{rating} af 5 stjerner fra {count} brugere via FixMatch', { rating, count: summary.reviews });
}
