import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { healUserDocs } from '../api/auth';
import { primeProfile } from '../api/users';
import { auth, db } from '../lib/firebase';
import { registerPushToken } from '../lib/push';
import { UserProfile } from '../types/models';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  initializing: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, profile: null, initializing: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setInitializing(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    let healed = false;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const p = snap.data() as UserProfile;
        setProfile(p);
        primeProfile(p);
        setInitializing(false);
      } else if (!healed) {
        // Sign-up writes the profile right after auth creation; recreate it if
        // that was ever interrupted.
        healed = true;
        healUserDocs(user);
      }
    });
    registerPushToken(user.uid);
    return unsubscribe;
  }, [user?.uid]);

  return <AuthContext.Provider value={{ user, profile, initializing }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

// Convenience for screens that are only reachable when logged in.
export function useProfile(): UserProfile {
  const { profile } = useAuth();
  if (!profile) throw new Error('useProfile used outside an authenticated screen');
  return profile;
}
