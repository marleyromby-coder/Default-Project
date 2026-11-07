import { useSyncExternalStore } from 'react';

/**
 * The problem the user described under "Beskriv dit problem": the text and up to three
 * pictures. It is kept in memory only, so it is gone when the app closes, and it never
 * leaves the phone unless the user sends it to a business (lib/contact.ts → sendProblem).
 */
export interface ProblemPhoto {
  uri: string;
  width: number;
  height: number;
  mimeType?: string;
  fileName?: string;
}

export interface Problem {
  text: string;
  photos: ProblemPhoto[];
}

export const MAX_PHOTOS = 3;

let problem: Problem = { text: '', photos: [] };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
function set(next: Partial<Problem>) {
  problem = { ...problem, ...next };
  listeners.forEach((listener) => listener());
}

export function useProblem(): Problem {
  return useSyncExternalStore(subscribe, () => problem);
}

export function getProblem(): Problem {
  return problem;
}

export function setProblemText(text: string) {
  if (text !== problem.text) set({ text });
}

/** Adds pictures, keeping at most MAX_PHOTOS (the newest). */
export function addProblemPhotos(photos: ProblemPhoto[]) {
  set({ photos: [...problem.photos, ...photos].slice(-MAX_PHOTOS) });
}

export function removeProblemPhoto(uri: string) {
  set({ photos: problem.photos.filter((p) => p.uri !== uri) });
}

export function hasProblem(value: Problem): boolean {
  return value.text.trim().length > 0 || value.photos.length > 0;
}

export function clearProblem() {
  set({ text: '', photos: [] });
}
