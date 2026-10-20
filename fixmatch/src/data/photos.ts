/**
 * Photo registry. Every photo is from Pexels (https://www.pexels.com/license/):
 * free for commercial use, no attribution required. We still credit the source
 * on the "Om FixMatch" page.
 *
 * Photos load from the Pexels CDN and are cached on the device by expo-image.
 * Run `npm run photos:bundle` to download them into the app bundle instead
 * (recommended before an App Store build, so the app also works offline).
 */

import { LOCAL_PHOTOS } from './photo-assets.generated';

export interface PhotoInfo {
  /** Pexels photo id. */
  pexelsId: number;
  alt: string;
}

export const PHOTOS = {
  'vvs-1': { pexelsId: 6419128, alt: 'VVS-installatør monterer rørfittings' },
  'vvs-2': { pexelsId: 14534738, alt: 'Håndværktøj lagt frem til en opgave' },
  'vvs-3': { pexelsId: 9606740, alt: 'Åben værktøjskasse' },
  'el-1': { pexelsId: 27928762, alt: 'Elektriker arbejder i en eltavle' },
  'el-2': { pexelsId: 17842832, alt: 'Elektriker ved et sikringsskab' },
  'el-3': { pexelsId: 17843269, alt: 'Elektriker kontrollerer elinstallation' },
  'el-4': { pexelsId: 5691590, alt: 'Elektriker reparerer stikkontakter med en tang' },
  'el-5': { pexelsId: 5691583, alt: 'Afmonterede kontakter i en lys lejlighed' },
  'el-6': { pexelsId: 17924298, alt: 'Elektriker arbejder ved et udendørs elskab' },
  'toemrer-1': { pexelsId: 5974279, alt: 'Tømrer saver i træ på værkstedet' },
  'toemrer-2': { pexelsId: 37162562, alt: 'Tømrer arbejder med træ i sit værksted' },
  'toemrer-3': { pexelsId: 32357250, alt: 'Tømrer skærer træ på en bordsav' },
  'toemrer-4': { pexelsId: 8820180, alt: 'Tømrer bruger rundsav på byggepladsen' },
  'toemrer-5': { pexelsId: 5710840, alt: 'Håndværker ved bordsav i værksted' },
  'toemrer-6': { pexelsId: 28513061, alt: 'Tømrer i et travlt værksted' },
  'toemrer-7': { pexelsId: 5691605, alt: 'Håndværker saver en planke' },
  'murer-1': { pexelsId: 32913797, alt: 'Murer lægger en mursten' },
  'murer-2': { pexelsId: 4509089, alt: 'Brolægning med røde sten' },
  'murer-3': { pexelsId: 10383583, alt: 'Murer pudser en væg med cement' },
  'murer-4': { pexelsId: 15806957, alt: 'Murer læsser mursten i en trillebør' },
  'murer-5': { pexelsId: 29181494, alt: 'Håndværker lægger fliser under renovering' },
  'mekaniker-1': { pexelsId: 3807799, alt: 'Mekaniker tjekker hjul på en bil på lift' },
  'mekaniker-2': { pexelsId: 4116225, alt: 'Mekaniker reparerer en bilmotor' },
  'mekaniker-3': { pexelsId: 8985860, alt: 'Mekaniker arbejder på en motor' },
  'mekaniker-4': { pexelsId: 8986047, alt: 'Mekaniker reparerer motor i værksted' },
  'mekaniker-5': { pexelsId: 8986119, alt: 'Mekaniker under en bil på lift' },
  'mekaniker-6': { pexelsId: 8985514, alt: 'Bil på lift i et autoværksted' },
  'mekaniker-7': { pexelsId: 8985603, alt: 'Mekaniker afmonterer et dæk' },
  'mekaniker-8': { pexelsId: 11139242, alt: 'Mekaniker reparerer en bil' },
  'mekaniker-9': { pexelsId: 8985615, alt: 'Mekaniker bruger en skruenøgle' },
  'maler-1': { pexelsId: 5493653, alt: 'Maler ruller maling på en væg' },
  'maler-2': { pexelsId: 6474471, alt: 'Maler maler en indervæg' },
  'maler-3': { pexelsId: 7218011, alt: 'To malere maler en væg' },
  'maler-4': { pexelsId: 5583116, alt: 'Malerrulle med hvid maling' },
  'maler-5': { pexelsId: 1917849, alt: 'Maler maler et hus udvendigt' },
  'tagdaekker-1': { pexelsId: 33404248, alt: 'Tagdækker lægger tagbelægning' },
  'tagdaekker-2': { pexelsId: 7788264, alt: 'Håndværker på et tag' },
  'tagdaekker-3': { pexelsId: 33501308, alt: 'Udskiftning af tag på ældre hus' },
  'tagdaekker-4': { pexelsId: 33404981, alt: 'Tagreparation i gang' },
  'laasesmed-1': { pexelsId: 279810, alt: 'Nøgle i en dørlås' },
  'laasesmed-2': { pexelsId: 792031, alt: 'Nøgler i sort-hvid' },
  'laasesmed-3': { pexelsId: 792034, alt: 'Bundt af nøgler' },
  'vaerktoej-1': { pexelsId: 33000620, alt: 'Værktøj hængt op på et værkstedsstativ' },
} as const satisfies Record<string, PhotoInfo>;

export type PhotoKey = keyof typeof PHOTOS;

export function pexelsUrl(id: number, width = 1200): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
}

export function pexelsPage(id: number): string {
  return `https://www.pexels.com/photo/${id}/`;
}

export function isPhotoKey(value: string): value is PhotoKey {
  return value in PHOTOS;
}

/** Resolves a photo key or URL to an image source, preferring a bundled copy. */
export function photoSource(photo: string, width = 1200): number | { uri: string } {
  if (isPhotoKey(photo)) {
    const local = LOCAL_PHOTOS[photo];
    if (local !== undefined) return local;
    return { uri: pexelsUrl(PHOTOS[photo].pexelsId, width) };
  }
  return { uri: photo };
}

export function photoAlt(photo: string, fallback: string): string {
  return isPhotoKey(photo) ? PHOTOS[photo].alt : fallback;
}
