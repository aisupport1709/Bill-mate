import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { normalizePhone } from '../lib/phone';
import { UserProfile } from '../types/models';

const profileCache = new Map<string, UserProfile>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeProfileCache(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function cachedProfile(uid: string): UserProfile | undefined {
  return profileCache.get(uid);
}

export function primeProfile(profile: UserProfile): void {
  profileCache.set(profile.uid, profile);
  notify();
}

export async function fetchProfiles(uids: string[]): Promise<UserProfile[]> {
  const missing = uids.filter((uid) => !profileCache.has(uid));
  await Promise.all(
    missing.map(async (uid) => {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) profileCache.set(uid, snap.data() as UserProfile);
    })
  );
  if (missing.length > 0) notify();
  return uids.map((uid) => profileCache.get(uid)).filter(Boolean) as UserProfile[];
}

export async function getUserByPhone(phone: string): Promise<UserProfile | null> {
  const normalized = normalizePhone(phone);
  const indexSnap = await getDoc(doc(db, 'phoneIndex', normalized));
  if (!indexSnap.exists()) return null;
  const uid = (indexSnap.data() as { uid: string }).uid;
  const [profile] = await fetchProfiles([uid]);
  return profile ?? null;
}

export async function savePushToken(uid: string, token: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { expoPushToken: token });
}
