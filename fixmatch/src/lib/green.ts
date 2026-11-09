import { msg } from '@/i18n';

import { DEDUCTION_VALUE, GREEN_DEDUCTION_MAX } from './quote-check';
import type { CategoryId } from './types';

/**
 * "Grøn guide": the green jobs on a home, what the tax deduction and the subsidies give, and
 * what they save on the bills. Figures are typical for a Danish house in 2026 and are a guide;
 * the rules change every year, so the screen links to skat.dk and sparenergi.dk.
 */
export interface GreenMeasure {
  id: string;
  title: string;
  summary: string;
  category: CategoryId;
  /** The job in the category, when FixMatch has one. */
  job?: string;
  /** Typical total price incl. VAT, and how much of it is labour. */
  priceMin: number;
  priceMax: number;
  labourShare: number;
  /** Typical saving on the bills per year, DKK. */
  savingMin: number;
  savingMax: number;
  /** Subsidy or scheme besides the tax deduction, if any. */
  subsidy?: string;
  /** Whether the labour counts for the håndværkerfradrag (grøn istandsættelse). */
  deductible: boolean;
}

export const GREEN_MEASURES: GreenMeasure[] = [
  {
    id: 'varmepumpe',
    title: msg('Varmepumpe i stedet for olie- eller gasfyr'),
    summary: msg(
      'Den største besparelse i de fleste huse. En luft til vand-varmepumpe bruger en tredjedel af energien.',
    ),
    category: 'vvs',
    priceMin: 90000,
    priceMax: 160000,
    labourShare: 0.3,
    savingMin: 8000,
    savingMax: 18000,
    subsidy: msg('Tilskud fra Varmepumpepuljen eller skrotningsordningen, når puljen er åben. Se sparenergi.dk.'),
    deductible: true,
  },
  {
    id: 'fjernvarme',
    title: msg('Tilslutning til fjernvarme'),
    summary: msg('Hvor der er fjernvarme i vejen, er det ofte billigst og kræver ingen pasning.'),
    category: 'vvs',
    priceMin: 30000,
    priceMax: 70000,
    labourShare: 0.4,
    savingMin: 5000,
    savingMax: 12000,
    subsidy: msg('Mange fjernvarmeselskaber giver rabat på tilslutningen i kampagneperioder.'),
    deductible: true,
  },
  {
    id: 'loft',
    title: msg('Efterisolering af loft'),
    summary: msg('Det billigste energitiltag. 300 mm isolering på loftet betaler sig på få år.'),
    category: 'toemrer',
    priceMin: 15000,
    priceMax: 40000,
    labourShare: 0.45,
    savingMin: 2000,
    savingMax: 5000,
    subsidy: msg('Energitilskud fra energiselskaberne. Spørg før arbejdet går i gang.'),
    deductible: true,
  },
  {
    id: 'hulmur',
    title: msg('Hulmursisolering'),
    summary: msg('Huse fra før 1980 har ofte tomme hulmure. Isoleringen blæses ind på en dag.'),
    category: 'murer',
    priceMin: 15000,
    priceMax: 35000,
    labourShare: 0.5,
    savingMin: 3000,
    savingMax: 6000,
    subsidy: msg('Energitilskud fra energiselskaberne.'),
    deductible: true,
  },
  {
    id: 'vinduer',
    title: msg('Nye energivinduer'),
    summary: msg('Energiruder holder på varmen og fjerner træk. Størst gevinst ved gamle termoruder.'),
    category: 'toemrer',
    job: 'vindue',
    priceMin: 40000,
    priceMax: 120000,
    labourShare: 0.3,
    savingMin: 1500,
    savingMax: 4000,
    deductible: true,
  },
  {
    id: 'solceller',
    title: msg('Solceller på taget'),
    summary: msg('Dækker en stor del af elforbruget om dagen. Bedst sammen med varmepumpe eller elbil.'),
    category: 'elektriker',
    priceMin: 60000,
    priceMax: 120000,
    labourShare: 0.25,
    savingMin: 4000,
    savingMax: 9000,
    deductible: true,
  },
  {
    id: 'ladestander',
    title: msg('Ladestander til elbil'),
    summary: msg('Hjemmeopladning er billigst. Vælg en lader, der kan styres efter elprisen.'),
    category: 'elektriker',
    job: 'ladestander',
    priceMin: 4500,
    priceMax: 9000,
    labourShare: 0.4,
    savingMin: 3000,
    savingMax: 8000,
    subsidy: msg('Elafgiften refunderes for strøm til bilen gennem en ladeoperatør.'),
    deductible: true,
  },
  {
    id: 'regnvand',
    title: msg('Regnvand væk fra kloakken'),
    summary: msg('Faskine eller regnbed sikrer mod oversvømmet kælder og aflaster kloakken.'),
    category: 'vvs',
    priceMin: 15000,
    priceMax: 40000,
    labourShare: 0.5,
    savingMin: 0,
    savingMax: 0,
    subsidy: msg('Mange forsyninger betaler tilslutningsbidraget tilbage, ofte over 20.000 kr. Spørg jeres forsyning.'),
    deductible: true,
  },
  {
    id: 'energimaerke',
    title: msg('Energimærke og rådgivning'),
    summary: msg('En energikonsulent fortæller, hvad der kan betale sig i netop jeres hus.'),
    category: 'toemrer',
    priceMin: 4000,
    priceMax: 8000,
    labourShare: 1,
    savingMin: 0,
    savingMax: 0,
    deductible: true,
  },
];

export interface GreenBenefit {
  /** Typical labour part of the price. */
  labour: number;
  /** Tax back on the labour, up to the yearly cap per adult. */
  taxBack: number;
  /** Years before the saving has paid for the work (after tax back), or undefined when it saves nothing on the bills. */
  paybackYears?: number;
}

/** What a measure gives: the deduction on a typical labour part, and the payback time at the typical price. */
export function greenBenefit(measure: GreenMeasure, adults = 1): GreenBenefit {
  const price = (measure.priceMin + measure.priceMax) / 2;
  const labour = Math.round(price * measure.labourShare);
  const deduction = measure.deductible ? Math.min(labour, GREEN_DEDUCTION_MAX * adults) : 0;
  const taxBack = Math.round((deduction * DEDUCTION_VALUE) / 100) * 100;
  const saving = (measure.savingMin + measure.savingMax) / 2;
  return {
    labour,
    taxBack,
    paybackYears: saving > 0 ? Math.round(((price - taxBack) / saving) * 10) / 10 : undefined,
  };
}
