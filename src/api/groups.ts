import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateGroupCode } from '../lib/groupCode';
import { Group, UserProfile } from '../types/models';
import { logActivity } from './activity';

export async function createGroup(
  creator: UserProfile,
  params: { name: string; emoji: string; color: string }
): Promise<Group> {
  // Retry on the (astronomically unlikely) code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateGroupCode();
    const ref = doc(db, 'groups', code);
    const existing = await getDoc(ref);
    if (existing.exists()) continue;
    const group: Group = {
      id: code,
      name: params.name.trim(),
      emoji: params.emoji,
      color: params.color,
      createdBy: creator.uid,
      memberIds: [creator.uid],
      adminIds: [creator.uid],
      createdAt: Date.now(),
    };
    await setDoc(ref, group);
    await logActivity(code, 'group_created', creator.uid, `${creator.nickname} created the group`);
    return group;
  }
  throw new Error('Could not generate a group code. Please try again.');
}

export async function getGroupPreview(code: string): Promise<Group | null> {
  const snap = await getDoc(doc(db, 'groups', code));
  return snap.exists() ? (snap.data() as Group) : null;
}

export async function joinGroup(code: string, member: UserProfile): Promise<void> {
  await updateDoc(doc(db, 'groups', code), { memberIds: arrayUnion(member.uid) });
  await logActivity(code, 'member_joined', member.uid, `${member.nickname} joined the group`);
}

export async function addMemberToGroup(code: string, actor: UserProfile, newMember: UserProfile): Promise<void> {
  await updateDoc(doc(db, 'groups', code), { memberIds: arrayUnion(newMember.uid) });
  await logActivity(
    code,
    'member_joined',
    actor.uid,
    `${actor.nickname} added ${newMember.nickname} to the group`
  );
}

export async function leaveGroup(code: string, member: UserProfile): Promise<void> {
  await logActivity(code, 'member_left', member.uid, `${member.nickname} left the group`);
  await updateDoc(doc(db, 'groups', code), { memberIds: arrayRemove(member.uid) });
}

export async function updateGroupInfo(
  code: string,
  actor: UserProfile,
  params: { name?: string; emoji?: string; color?: string }
): Promise<void> {
  const updates: Record<string, string> = {};
  if (params.name !== undefined) updates.name = params.name.trim();
  if (params.emoji !== undefined) updates.emoji = params.emoji;
  if (params.color !== undefined) updates.color = params.color;
  await updateDoc(doc(db, 'groups', code), updates);
  await logActivity(code, 'record_edited', actor.uid, `${actor.nickname} updated the group info`);
}

export async function removeMemberFromGroup(code: string, actor: UserProfile, targetUid: string, targetNickname: string): Promise<void> {
  await updateDoc(doc(db, 'groups', code), {
    memberIds: arrayRemove(targetUid),
    adminIds: arrayRemove(targetUid),
  });
  await logActivity(code, 'member_left', actor.uid, `${actor.nickname} removed ${targetNickname} from the group`);
}

export async function assignAdminRole(code: string, actor: UserProfile, targetUid: string, targetNickname: string, grant: boolean): Promise<void> {
  await updateDoc(doc(db, 'groups', code), {
    adminIds: grant ? arrayUnion(targetUid) : arrayRemove(targetUid),
  });
  const action = grant ? 'made' : 'removed admin from';
  await logActivity(code, 'record_edited', actor.uid, `${actor.nickname} ${action} ${targetNickname} an admin`);
}

export function listenMyGroups(uid: string, onChange: (groups: Group[]) => void): () => void {
  const q = query(collection(db, 'groups'), where('memberIds', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    const groups = snap.docs.map((d) => d.data() as Group);
    groups.sort((a, b) => b.createdAt - a.createdAt);
    onChange(groups);
  });
}

export function listenGroup(code: string, onChange: (group: Group | null) => void): () => void {
  return onSnapshot(doc(db, 'groups', code), (snap) => {
    onChange(snap.exists() ? (snap.data() as Group) : null);
  });
}
