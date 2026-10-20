import type { ScoredBusiness } from '@/lib/ranking';
import type { Coords } from '@/lib/types';

export interface BusinessMapProps {
  items: ScoredBusiness[];
  origin: Coords;
  selectedId?: string;
  onSelect: (id: string) => void;
}
