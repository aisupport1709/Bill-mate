import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types/models';
import { fetchProfiles } from './users';

export async function addFriend(myUid: string, friend: UserProfile): Promise<void> {
  await setDoc(doc(db, 'users', myUid, 'friends', friend.uid), { addedAt: Date.now() });
}

export async function removeFriend(myUid: string, friendUid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', myUid, 'friends', friendUid));
}

export function listenFriends(myUid: string, onChange: (friends: UserProfile[]) => void): () => void {
  return onSnapshot(collection(db, 'users', myUid, 'friends'), async (snap) => {
    const uids = snap.docs.map((d) => d.id);
    const profiles = await fetchProfiles(uids);
    onChange(profiles);
  });
}
