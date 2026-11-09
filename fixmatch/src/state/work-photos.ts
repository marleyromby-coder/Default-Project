import * as Crypto from 'expo-crypto';
import { useSyncExternalStore } from 'react';

import { MAX_WORK_PHOTOS } from '@/lib/data-source';
import { supabase } from '@/lib/supabase';
import type { Business } from '@/lib/types';

import type { ManagedBusiness } from './business-account';

/**
 * Photos of finished work on a business's profile. Real businesses upload them from
 * "Min virksomhed" to Supabase Storage; the data file can also carry them (CSV column
 * billeder_arbejde). Demo businesses show stock photos of the trade.
 */
export interface WorkPhoto {
  id: string;
  url: string;
}

const BUCKET = 'work-photos';

let loaded: Record<string, WorkPhoto[]> = {};
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
function set(businessId: string, photos: WorkPhoto[]) {
  loaded = { ...loaded, [businessId]: photos };
  listeners.forEach((listener) => listener());
}

/** The photos from the data file, as WorkPhoto entries. */
function bundled(business: Business): WorkPhoto[] {
  return (business.workPhotos ?? []).map((url) => ({ id: url, url }));
}

/** Loads the business's uploaded photos when its page opens. Data-file photos come first. */
export async function loadWorkPhotos(business: Business): Promise<void> {
  if (!supabase || business.demo) return;
  const { data, error } = await supabase
    .from('business_photos')
    .select('id, url')
    .eq('business_id', business.id)
    .order('sort')
    .order('created_at');
  if (error || !data) return;
  const uploaded = (data as { id: string; url: string }[]).map((row) => ({ id: row.id, url: row.url }));
  set(business.id, [...bundled(business), ...uploaded].slice(0, MAX_WORK_PHOTOS));
}

export function useWorkPhotos(business: Business | undefined): WorkPhoto[] {
  const all = useSyncExternalStore(subscribe, () => loaded);
  if (!business) return [];
  return all[business.id] ?? bundled(business);
}

/** Uploads a picture the owner picked. In the demo it is only shown on this phone. */
export async function addWorkPhoto(
  managed: ManagedBusiness,
  business: Business,
  photo: { uri: string; mimeType?: string },
): Promise<void> {
  const current = loaded[business.id] ?? bundled(business);
  if (current.length >= MAX_WORK_PHOTOS) throw new Error('full');
  if (managed.demo || !supabase) {
    set(business.id, [...current, { id: `local-${Date.now()}`, url: photo.uri }]);
    return;
  }
  const extension = photo.mimeType === 'image/png' ? 'png' : photo.mimeType === 'image/webp' ? 'webp' : 'jpg';
  const path = `${business.id}/${Crypto.randomUUID()}.${extension}`;
  const file = await (await fetch(photo.uri)).blob();
  const upload = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: photo.mimeType ?? 'image/jpeg', upsert: false });
  if (upload.error) throw upload.error;
  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { data, error } = await supabase
    .from('business_photos')
    .insert({ business_id: business.id, url, sort: current.length })
    .select('id')
    .single();
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
  set(business.id, [...current, { id: String(data.id), url }]);
}

export async function removeWorkPhoto(managed: ManagedBusiness, business: Business, photo: WorkPhoto): Promise<void> {
  const current = loaded[business.id] ?? bundled(business);
  set(
    business.id,
    current.filter((p) => p.id !== photo.id),
  );
  if (managed.demo || !supabase || photo.id === photo.url) return;
  const { error } = await supabase.from('business_photos').delete().eq('id', photo.id);
  if (error) throw error;
  const path = photo.url.split(`/${BUCKET}/`)[1];
  if (path) await supabase.storage.from(BUCKET).remove([path]);
}

/** For tests. */
export function resetWorkPhotos() {
  loaded = {};
  listeners.forEach((listener) => listener());
}
