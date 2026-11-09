import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { useSyncExternalStore } from 'react';

import { type HomeJob, isValidHomeJob } from '@/lib/home-log';

/**
 * "Min bolig" on the phone: the list of jobs and their pictures. Nothing here is sent to
 * FixMatch. The pictures are copied into the app's own folder, so they stay even when iOS
 * clears the cache the photo picker writes to.
 */
const KEY = 'fixmatch:home-jobs';

let jobs: HomeJob[] = [];
let ready = false;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
function emit() {
  listeners.forEach((listener) => listener());
}

AsyncStorage.getItem(KEY)
  .then((raw) => {
    const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
    jobs = Array.isArray(parsed) ? parsed.filter(isValidHomeJob) : [];
    ready = true;
    emit();
  })
  .catch(() => {
    ready = true;
    emit();
  });

function save() {
  AsyncStorage.setItem(KEY, JSON.stringify(jobs)).catch(() => undefined);
}

export function useHomeJobs(): HomeJob[] {
  return useSyncExternalStore(subscribe, () => jobs);
}

export function useHomeReady(): boolean {
  return useSyncExternalStore(subscribe, () => ready);
}

export function getHomeJobs(): HomeJob[] {
  return jobs;
}

function photoDirectory(): Directory | null {
  if (Platform.OS === 'web') return null;
  try {
    const directory = new Directory(Paths.document, 'min-bolig');
    if (!directory.exists) directory.create({ intermediates: true });
    return directory;
  } catch {
    return null;
  }
}

/** Copies a picked picture into the app's folder and returns its URI (the original on failure). */
export function keepPhoto(uri: string): string {
  const directory = photoDirectory();
  if (!directory) return uri;
  try {
    const extension = uri.split('?')[0].split('.').pop()?.toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension && extension.length <= 4 ? extension : 'jpg'}`;
    const target = new File(directory, name);
    new File(uri).copy(target);
    return target.uri;
  } catch {
    return uri;
  }
}

function dropPhoto(uri: string) {
  if (Platform.OS === 'web' || !uri.includes('/min-bolig/')) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // The picture may already be gone.
  }
}

export function addHomeJob(job: Omit<HomeJob, 'id'>): HomeJob {
  const entry: HomeJob = { ...job, id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
  jobs = [entry, ...jobs].sort((a, b) => b.date.localeCompare(a.date));
  emit();
  save();
  return entry;
}

export function updateHomeJob(id: string, changes: Partial<Omit<HomeJob, 'id'>>) {
  const current = jobs.find((j) => j.id === id);
  if (!current) return;
  for (const uri of current.photos) if (changes.photos && !changes.photos.includes(uri)) dropPhoto(uri);
  jobs = jobs.map((j) => (j.id === id ? { ...j, ...changes } : j)).sort((a, b) => b.date.localeCompare(a.date));
  emit();
  save();
}

export function removeHomeJob(id: string) {
  const current = jobs.find((j) => j.id === id);
  current?.photos.forEach(dropPhoto);
  jobs = jobs.filter((j) => j.id !== id);
  emit();
  save();
}

/** Forgets everything in "Min bolig" (Nulstil app-data). */
export function clearHomeJobs() {
  jobs.forEach((j) => j.photos.forEach(dropPhoto));
  jobs = [];
  emit();
  AsyncStorage.removeItem(KEY).catch(() => undefined);
}

/** For tests. */
export function resetHomeJobs() {
  jobs = [];
  ready = true;
  emit();
}
