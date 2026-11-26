import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';

import { showDialog } from '@/lib/dialog';
import { formatPrice } from '@/lib/format';
import { taxNote, type Market } from '@/lib/markets';
import type { PriceUnit } from '@/lib/types';
import { t } from '@/i18n';

/**
 * The project brief ("Min opgave"): what the user described under "Beskriv dit problem",
 * shared from "Dit match" as plain text they can send to a business themselves – the same brief the
 * website's project planner makes. It is built on the phone and only leaves it through the
 * share sheet the user opens; FixMatch never receives it.
 */
export interface ProjectBriefInput {
  /** The trade's name, already translated. */
  trade: string;
  job?: { name: string; unit: PriceUnit };
  quantity?: number;
  budget?: number;
  urgent: boolean;
  text: string;
  /** Where the job is, e.g. "8000 Aarhus C". */
  place?: string;
  market: Market;
}

export function projectBrief(input: ProjectBriefInput): string {
  const { job, market } = input;
  const unit = job?.unit === 'm2' ? 'm²' : t('stk.');
  const lines = [
    t('Min opgave · FixMatch'),
    '',
    t('Fag: {trade}', { trade: input.trade }),
    t('Opgave: {job}', { job: job ? job.name : t('Ved ikke') }),
    job && job.unit !== 'opgave' && input.quantity
      ? t('Antal: {quantity}', { quantity: `${input.quantity} ${unit}` })
      : undefined,
    input.place ? t('Sted: {place}', { place: input.place }) : undefined,
    t('Tidspunkt: {timing}', { timing: input.urgent ? t('Det haster') : t('Jeg er fleksibel') }),
    input.budget
      ? t('Budget: {price} {tax}', { price: formatPrice(input.budget, market.currency), tax: taxNote(market) })
      : undefined,
    '',
    t('Beskrivelse:'),
    input.text.trim() || '—',
    '',
    t('Bed om en samlet pris med materialer og kørsel ({tax}). Aftal omfang, tidspunkt og eventuelle ekstraarbejder skriftligt.', {
      tax: taxNote(market),
    }),
  ];
  return lines.filter((line) => line !== undefined).join('\n');
}

/** Opens the share sheet with the brief; where that fails, the brief is copied instead. */
export async function shareProjectBrief(brief: string): Promise<void> {
  try {
    await Share.share({ message: brief, title: t('Min opgave · FixMatch') });
  } catch {
    await Clipboard.setStringAsync(brief).catch(() => undefined);
    showDialog(t('Kopieret'), t('Beskrivelsen er kopieret, så du kan indsætte den i en besked.'));
  }
}
