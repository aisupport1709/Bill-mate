import { useEffect, useMemo, useState } from 'react';
import { cachedProfile, fetchProfiles, subscribeProfileCache } from '../api/users';
import { UserProfile } from '../types/models';

// Resolves uids to profiles from the in-memory cache, fetching the missing
// ones from Firestore. Re-renders when the cache fills in.
export function useProfiles(uids: string[]): Map<string, UserProfile> {
  const key = uids.slice().sort().join(',');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeProfileCache(() => setVersion((v) => v + 1));
    if (uids.length > 0) fetchProfiles(uids);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const uid of key.split(',')) {
      if (!uid) continue;
      const p = cachedProfile(uid);
      if (p) map.set(uid, p);
    }
    return map;
  }, [key, version]);
}

export function displayName(profiles: Map<string, UserProfile>, uid: string, myUid?: string): string {
  if (myUid && uid === myUid) return 'You';
  return profiles.get(uid)?.nickname ?? '…';
}
