import type { Region } from '@/lib/cluster';
import type { ScoredBusiness } from '@/lib/ranking';
import type { Coords } from '@/lib/types';

export interface BusinessMapProps {
  items: ScoredBusiness[];
  /** Where distances are measured from. Drawn as a dot unless the system shows the GPS position. */
  origin: Coords;
  showsUserLocation: boolean;
  selectedId?: string;
  onSelect: (id: string) => void;
  /** Where the camera should go. Pass a new object to move it again. */
  target: Region;
  onRegionChange: (region: Region) => void;
  /** Space covered by overlays, so pins and Apple's "Legal" link stay visible. */
  padding: { top: number; bottom: number };
}
