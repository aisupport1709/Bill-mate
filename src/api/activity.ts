import { collection, doc, limit, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ActivityEntry, ActivityType } from '../types/models';

export async function logActivity(
  groupId: string,
  type: ActivityType,
  actorId: string,
  summary: string
): Promise<void> {
  const ref = doc(collection(db, 'groups', groupId, 'activity'));
  const entry: ActivityEntry = { id: ref.id, type, actorId, summary, createdAt: Date.now() };
  // Activity is best-effort; never block the main action on it.
  try {
    await setDoc(ref, entry);
  } catch {}
}

export function listenActivity(groupId: string, onChange: (entries: ActivityEntry[]) => void): () => void {
  const q = query(collection(db, 'groups', groupId, 'activity'), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => d.data() as ActivityEntry));
  });
}
