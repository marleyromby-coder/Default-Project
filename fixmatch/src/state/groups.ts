import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { DATA_MODE } from '@/lib/data-source';
import { supabase } from '@/lib/supabase';
import type { CategoryId, CountryCode } from '@/lib/types';

/**
 * "Naborabat": neighbours pool a job so one business does them all the same day and gives a
 * discount. Groups live on the server with a 6-letter code; the user's own groups are also
 * kept on the phone. In the demo, groups are made up and only on the phone.
 */
export interface GroupJob {
  id: string;
  code: string;
  country: CountryCode;
  postalCode: string;
  /** The street or area, as the creator wrote it. */
  area: string;
  category: CategoryId;
  job: string;
  note?: string;
  /** YYYY-MM-DD. */
  wantedFrom: string;
  wantedTo: string;
  status: 'open' | 'sent' | 'done' | 'closed';
  members: number;
  createdAt: string;
  /** Whether the user created it or joined it on this phone. */
  mine?: 'created' | 'joined';
}

/** From this many neighbours a business usually gives a discount. */
export const MIN_GROUP = 3;
export const GROUP_DISCOUNT = { min: 10, max: 20 };

/** Jobs that suit a street doing it together: the business saves the driving. */
export const GROUP_JOB_IDEAS: { category: CategoryId; job: string }[] = [
  { category: 'tagdaekker', job: 'tagrender' },
  { category: 'vvs', job: 'service-fyr' },
  { category: 'mekaniker', job: 'hjulskift' },
  { category: 'maler', job: 'vinduesmaling' },
  { category: 'murer', job: 'omfugning' },
  { category: 'elektriker', job: 'ladestander' },
];

const MINE_KEY = 'fixmatch:group-jobs';

interface Store {
  /** Groups loaded for the user's area. */
  nearby: GroupJob[];
  /** The user's own, newest first. */
  mine: GroupJob[];
}

let store: Store = { nearby: [], mine: [] };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
function set(next: Partial<Store>) {
  store = { ...store, ...next };
  listeners.forEach((listener) => listener());
}

function isGroup(value: unknown): value is GroupJob {
  if (typeof value !== 'object' || value === null) return false;
  const g = value as Partial<GroupJob>;
  return (
    typeof g.id === 'string' &&
    typeof g.code === 'string' &&
    typeof g.postalCode === 'string' &&
    typeof g.category === 'string' &&
    typeof g.job === 'string' &&
    typeof g.wantedFrom === 'string' &&
    typeof g.members === 'number'
  );
}

AsyncStorage.getItem(MINE_KEY)
  .then((raw) => {
    const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
    set({ mine: Array.isArray(parsed) ? parsed.filter(isGroup) : [] });
  })
  .catch(() => undefined);

function saveMine(mine: GroupJob[]) {
  set({ mine });
  AsyncStorage.setItem(MINE_KEY, JSON.stringify(mine)).catch(() => undefined);
}

export function useNearbyGroups(): GroupJob[] {
  return useSyncExternalStore(subscribe, () => store.nearby);
}

export function useMyGroups(): GroupJob[] {
  return useSyncExternalStore(subscribe, () => store.mine);
}

export function useGroup(id: string | undefined): GroupJob | undefined {
  const current = useSyncExternalStore(subscribe, () => store);
  if (!id) return undefined;
  return current.mine.find((g) => g.id === id) ?? current.nearby.find((g) => g.id === id);
}

/** A readable code without look-alike letters. */
export function makeCode(random = Math.random): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => letters[Math.floor(random() * letters.length)]).join('');
}

function fromRow(row: Record<string, unknown>): GroupJob {
  return {
    id: String(row.id),
    code: String(row.code),
    country: String(row.country) as CountryCode,
    postalCode: String(row.postal_code),
    area: String(row.area),
    category: String(row.category) as CategoryId,
    job: String(row.job),
    note: row.note ? String(row.note) : undefined,
    wantedFrom: String(row.wanted_from).slice(0, 10),
    wantedTo: String(row.wanted_to).slice(0, 10),
    status: (row.status as GroupJob['status']) ?? 'open',
    members: Number(row.members ?? 1),
    createdAt: String(row.created_at),
  };
}

/** Made-up groups near the demo's Copenhagen area, so the screen has something to show. */
export function demoGroups(postalCode: string, today: string): GroupJob[] {
  const area = postalCode.slice(0, 2);
  const plus = (days: number) => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };
  return [
    {
      id: 'demo-tagrender',
      code: 'TAGREN',
      country: 'DK',
      postalCode,
      area: area === '22' ? 'Stefansgade' : 'Hovedgaden',
      category: 'tagdaekker',
      job: 'tagrender',
      note: 'Vi er to huse, der vil have renset tagrender inden vinteren. Flere er velkomne.',
      wantedFrom: plus(7),
      wantedTo: plus(21),
      status: 'open',
      members: 2,
      createdAt: plus(-3),
    },
    {
      id: 'demo-fyr',
      code: 'FYRSRV',
      country: 'DK',
      postalCode,
      area: area === '22' ? 'Nørrebrogade' : 'Skolevej',
      category: 'vvs',
      job: 'service-fyr',
      note: 'Årligt service af gasfyr. Vi er tre, så vi mangler bare en VVS’er.',
      wantedFrom: plus(10),
      wantedTo: plus(30),
      status: 'open',
      members: 3,
      createdAt: plus(-6),
    },
  ];
}

/** Loads the open groups in the user's postal code and the nearby ones (same two first digits). */
export async function loadGroups(country: CountryCode, postalCode: string | undefined, today: string): Promise<void> {
  if (!postalCode) return;
  if (!supabase || DATA_MODE === 'demo') {
    const mineIds = new Set(store.mine.map((g) => g.id));
    set({ nearby: demoGroups(postalCode, today).filter((g) => !mineIds.has(g.id)) });
    return;
  }
  const { data, error } = await supabase
    .from('open_group_jobs')
    .select('*')
    .eq('country', country)
    .like('postal_code', `${postalCode.slice(0, 2)}%`)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !data) return;
  const groups = (data as Record<string, unknown>[]).map(fromRow);
  // Refresh member counts on the user's own groups too.
  const mine = store.mine.map((g) => {
    const fresh = groups.find((x) => x.id === g.id);
    return fresh ? { ...fresh, mine: g.mine } : g;
  });
  set({ nearby: groups.filter((g) => !mine.some((m) => m.id === g.id)), mine });
}

export interface NewGroup {
  country: CountryCode;
  postalCode: string;
  area: string;
  category: CategoryId;
  job: string;
  note?: string;
  wantedFrom: string;
  wantedTo: string;
}

export class GroupError extends Error {
  constructor(public reason: 'signed-out' | 'not-found' | 'network') {
    super(reason);
  }
}

/** Starts a group. Without a server it lives on this phone only. */
export async function createGroup(input: NewGroup, userId: string | undefined): Promise<GroupJob> {
  const local: GroupJob = {
    id: `local-${Date.now()}`,
    code: makeCode(),
    ...input,
    status: 'open',
    members: 1,
    createdAt: new Date().toISOString(),
    mine: 'created',
  };
  if (!supabase || DATA_MODE === 'demo') {
    saveMine([local, ...store.mine]);
    return local;
  }
  if (!userId) throw new GroupError('signed-out');
  const { data, error } = await supabase
    .from('group_jobs')
    .insert({
      code: local.code,
      created_by: userId,
      country: input.country,
      postal_code: input.postalCode,
      area: input.area.trim(),
      category: input.category,
      job: input.job,
      note: input.note?.trim() || null,
      wanted_from: input.wantedFrom,
      wanted_to: input.wantedTo,
    })
    .select('*')
    .single();
  if (error || !data) throw new GroupError('network');
  const group = { ...fromRow({ ...(data as Record<string, unknown>), members: 1 }), mine: 'created' as const };
  saveMine([group, ...store.mine]);
  return group;
}

/** Joins with a code (or a group from the list). */
export async function joinGroup(codeOrGroup: string | GroupJob, userId: string | undefined): Promise<GroupJob> {
  const known =
    typeof codeOrGroup === 'string'
      ? store.nearby.find((g) => g.code === codeOrGroup.trim().toUpperCase())
      : codeOrGroup;
  if (!supabase || DATA_MODE === 'demo') {
    if (!known) throw new GroupError('not-found');
    const joined = { ...known, members: known.members + 1, mine: 'joined' as const };
    set({ nearby: store.nearby.filter((g) => g.id !== known.id) });
    saveMine([joined, ...store.mine.filter((g) => g.id !== known.id)]);
    return joined;
  }
  if (!userId) throw new GroupError('signed-out');
  const code = typeof codeOrGroup === 'string' ? codeOrGroup : codeOrGroup.code;
  const { data, error } = await supabase.rpc('join_group', { p_code: code.trim().toUpperCase() });
  if (error) throw new GroupError(error.code === 'P0002' ? 'not-found' : 'network');
  const row = await supabase.from('open_group_jobs').select('*').eq('id', String(data)).maybeSingle();
  const group = row.data ? fromRow(row.data as Record<string, unknown>) : known;
  if (!group) throw new GroupError('not-found');
  const joined = { ...group, mine: 'joined' as const };
  set({ nearby: store.nearby.filter((g) => g.id !== joined.id) });
  saveMine([joined, ...store.mine.filter((g) => g.id !== joined.id)]);
  return joined;
}

export async function leaveGroup(group: GroupJob): Promise<void> {
  saveMine(store.mine.filter((g) => g.id !== group.id));
  if (!supabase || DATA_MODE === 'demo' || group.id.startsWith('local-')) return;
  if (group.mine === 'created') {
    await supabase.from('group_jobs').update({ status: 'closed' }).eq('id', group.id);
  } else {
    await supabase.from('group_members').delete().eq('group_id', group.id);
  }
}

/** The creator marks that the request went to a business. */
export async function markGroupSent(group: GroupJob): Promise<void> {
  saveMine(store.mine.map((g) => (g.id === group.id ? { ...g, status: 'sent' } : g)));
  if (!supabase || DATA_MODE === 'demo' || group.id.startsWith('local-')) return;
  await supabase.from('group_jobs').update({ status: 'sent' }).eq('id', group.id);
}

export function clearGroups() {
  set({ mine: [] });
  AsyncStorage.removeItem(MINE_KEY).catch(() => undefined);
}

/** For tests. */
export function resetGroups() {
  store = { nearby: [], mine: [] };
  listeners.forEach((listener) => listener());
}
