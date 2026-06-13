import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { emailToPhone, normalizePhone, phoneToEmail } from '../lib/phone';
import { UserProfile } from '../types/models';

const DEFAULT_RESET_PASSWORD = '123456';

export async function signUp(params: {
  phone: string;
  password: string;
  nickname: string;
  avatarId: number;
}): Promise<void> {
  const phone = normalizePhone(params.phone);
  try {
    const cred = await createUserWithEmailAndPassword(auth, phoneToEmail(phone), params.password);
    const profile: UserProfile = {
      uid: cred.user.uid,
      phone,
      nickname: params.nickname.trim(),
      avatarId: params.avatarId,
      createdAt: Date.now(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), profile);
    await setDoc(doc(db, 'phoneIndex', phone), { uid: cred.user.uid });
  } catch (e: any) {
    throw new Error(friendlyAuthError(e));
  }
}

export async function logIn(phone: string, password: string): Promise<void> {
  const normalized = normalizePhone(phone);
  const email = phoneToEmail(normalized);
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserDocs(cred.user, normalized);
    // Clear any pending reset flag on successful login.
    const userRef = doc(db, 'users', cred.user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists() && snap.data().pendingPasswordReset) {
      await updateDoc(userRef, { pendingPasswordReset: false });
    }
  } catch (e: any) {
    // If login failed, check whether admin has queued a password reset.
    // If so, try the default reset password transparently.
    if (e?.code?.includes('invalid-credential') || e?.code?.includes('wrong-password')) {
      const indexSnap = await getDoc(doc(db, 'phoneIndex', normalized)).catch(() => null);
      if (indexSnap?.exists()) {
        const uid = indexSnap.data().uid as string;
        const userSnap = await getDoc(doc(db, 'users', uid)).catch(() => null);
        if (userSnap?.exists() && userSnap.data().pendingPasswordReset) {
          try {
            const cred = await signInWithEmailAndPassword(auth, email, DEFAULT_RESET_PASSWORD);
            await updateDoc(doc(db, 'users', uid), { pendingPasswordReset: false });
            await ensureUserDocs(cred.user, normalized);
            return;
          } catch {}
        }
      }
    }
    throw new Error(friendlyAuthError(e));
  }
}

// Admin only: mark a user's password for reset to the default.
export async function resetPasswordForPhone(phone: string): Promise<void> {
  const normalized = normalizePhone(phone);
  const indexSnap = await getDoc(doc(db, 'phoneIndex', normalized));
  if (!indexSnap.exists()) throw new Error('No account found with this phone number.');
  const uid = indexSnap.data().uid as string;
  await updateDoc(doc(db, 'users', uid), { pendingPasswordReset: true });
}

// Heals the rare case where auth account creation succeeded but the Firestore
// writes were interrupted during sign-up.
async function ensureUserDocs(user: User, phone: string): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    const profile: UserProfile = {
      uid: user.uid,
      phone,
      nickname: phone,
      avatarId: 0,
      createdAt: Date.now(),
    };
    await setDoc(userRef, profile);
    await setDoc(doc(db, 'phoneIndex', phone), { uid: user.uid });
  }
}

// Same healing, but for an already-authenticated session where the profile doc
// is missing: the phone is recovered from the synthetic auth email.
export async function healUserDocs(user: User): Promise<void> {
  if (!user.email) return;
  await ensureUserDocs(user, emailToPhone(user.email));
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export async function updateMyProfile(updates: { nickname?: string; avatarId?: number }): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await updateDoc(doc(db, 'users', user.uid), updates);
}

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Not logged in');
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
    await updatePassword(user, newPassword);
  } catch (e: any) {
    throw new Error(friendlyAuthError(e));
  }
}

function friendlyAuthError(e: any): string {
  const code: string = e?.code ?? '';
  if (code.includes('email-already-in-use')) return 'This phone number is already registered.';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Wrong phone number or password.';
  }
  if (code.includes('weak-password')) return 'Password must be at least 6 characters.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Please try again later.';
  if (code.includes('network-request-failed')) return 'Network error. Check your connection.';
  return e?.message ?? 'Something went wrong.';
}
