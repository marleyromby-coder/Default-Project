/**
 * Photo keys used by the demo data. The app no longer shows stock photos: a business is
 * shown with its own picture (an https URL) or with its mark (see components/business/
 * business-mark.tsx). The keys stay valid so demo data and older imports still load.
 * The photos are from Pexels (https://www.pexels.com/license/).
 */

import { msg } from '@/i18n';

export interface PhotoInfo {
  /** Pexels photo id. */
  pexelsId: number;
  alt: string;
}

export const PHOTOS = {
  'vvs-1': { pexelsId: 6419128, alt: msg('VVS-installatør monterer rørfittings') },
  'vvs-2': { pexelsId: 14534738, alt: msg('Håndværktøj lagt frem til en opgave') },
  'vvs-3': { pexelsId: 9606740, alt: msg('Åben værktøjskasse') },
  'el-1': { pexelsId: 27928762, alt: msg('Elektriker arbejder i en eltavle') },
  'el-2': { pexelsId: 17842832, alt: msg('Elektriker ved et sikringsskab') },
  'el-3': { pexelsId: 17843269, alt: msg('Elektriker kontrollerer elinstallation') },
  'el-4': { pexelsId: 5691590, alt: msg('Elektriker reparerer stikkontakter med en tang') },
  'el-5': { pexelsId: 5691583, alt: msg('Afmonterede kontakter i en lys lejlighed') },
  'el-6': { pexelsId: 17924298, alt: msg('Elektriker arbejder ved et udendørs elskab') },
  'toemrer-1': { pexelsId: 5974279, alt: msg('Tømrer saver i træ på værkstedet') },
  'toemrer-2': { pexelsId: 37162562, alt: msg('Tømrer arbejder med træ i sit værksted') },
  'toemrer-3': { pexelsId: 32357250, alt: msg('Tømrer skærer træ på en bordsav') },
  'toemrer-4': { pexelsId: 8820180, alt: msg('Tømrer bruger rundsav på byggepladsen') },
  'toemrer-5': { pexelsId: 5710840, alt: msg('Håndværker ved bordsav i værksted') },
  'toemrer-6': { pexelsId: 28513061, alt: msg('Tømrer i et travlt værksted') },
  'toemrer-7': { pexelsId: 5691605, alt: msg('Håndværker saver en planke') },
  'murer-1': { pexelsId: 32913797, alt: msg('Murer lægger en mursten') },
  'murer-2': { pexelsId: 4509089, alt: msg('Brolægning med røde sten') },
  'murer-3': { pexelsId: 10383583, alt: msg('Murer pudser en væg med cement') },
  'murer-4': { pexelsId: 15806957, alt: msg('Murer læsser mursten i en trillebør') },
  'murer-5': { pexelsId: 29181494, alt: msg('Håndværker lægger fliser under renovering') },
  'mekaniker-1': { pexelsId: 3807799, alt: msg('Mekaniker tjekker hjul på en bil på lift') },
  'mekaniker-2': { pexelsId: 4116225, alt: msg('Mekaniker reparerer en bilmotor') },
  'mekaniker-3': { pexelsId: 8985860, alt: msg('Mekaniker arbejder på en motor') },
  'mekaniker-4': { pexelsId: 8986047, alt: msg('Mekaniker reparerer motor i værksted') },
  'mekaniker-5': { pexelsId: 8986119, alt: msg('Mekaniker under en bil på lift') },
  'mekaniker-6': { pexelsId: 8985514, alt: msg('Bil på lift i et autoværksted') },
  'mekaniker-7': { pexelsId: 8985603, alt: msg('Mekaniker afmonterer et dæk') },
  'mekaniker-8': { pexelsId: 11139242, alt: msg('Mekaniker reparerer en bil') },
  'mekaniker-9': { pexelsId: 8985615, alt: msg('Mekaniker bruger en skruenøgle') },
  'maler-1': { pexelsId: 5493653, alt: msg('Maler ruller maling på en væg') },
  'maler-2': { pexelsId: 6474471, alt: msg('Maler maler en indervæg') },
  'maler-3': { pexelsId: 7218011, alt: msg('To malere maler en væg') },
  'maler-4': { pexelsId: 5583116, alt: msg('Malerrulle med hvid maling') },
  'maler-5': { pexelsId: 1917849, alt: msg('Maler maler et hus udvendigt') },
  'tagdaekker-1': { pexelsId: 33404248, alt: msg('Tagdækker lægger tagbelægning') },
  'tagdaekker-2': { pexelsId: 7788264, alt: msg('Håndværker på et tag') },
  'tagdaekker-3': { pexelsId: 33501308, alt: msg('Udskiftning af tag på ældre hus') },
  'tagdaekker-4': { pexelsId: 33404981, alt: msg('Tagreparation i gang') },
  'laasesmed-1': { pexelsId: 279810, alt: msg('Nøgle i en dørlås') },
  'laasesmed-2': { pexelsId: 792031, alt: msg('Nøgler i sort-hvid') },
  'laasesmed-3': { pexelsId: 792034, alt: msg('Bundt af nøgler') },
  'vaerktoej-1': { pexelsId: 33000620, alt: msg('Værktøj hængt op på et værkstedsstativ') },
} as const satisfies Record<string, PhotoInfo>;

export type PhotoKey = keyof typeof PHOTOS;

export function isPhotoKey(value: string): value is PhotoKey {
  return value in PHOTOS;
}
