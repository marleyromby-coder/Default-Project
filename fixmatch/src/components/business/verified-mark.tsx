import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { isVerified } from '@/lib/verification';
import type { Business } from '@/lib/types';

/**
 * The Verificeret seal next to a business's name, like a blue tick. Screen readers hear
 * "verificeret af FixMatch" in the row's own label, so the seal itself is silent.
 */
export function VerifiedMark({ business, size = 16 }: { business: Business; size?: number }) {
  const colors = useTheme();
  if (!isVerified(business)) return null;
  return <Icon name="verified" size={size} color={colors.brand} weight="semibold" />;
}
