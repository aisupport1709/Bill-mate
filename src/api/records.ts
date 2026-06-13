import { collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatK } from '../lib/format';
import { ExpenseRecord, Share, UserProfile } from '../types/models';
import { logActivity } from './activity';

export interface RecordInput {
  amountK: number;
  payerId: string;
  participantIds: string[];
  date: string;
  note: string;
}

export function shareAmountK(amountK: number, participantCount: number): number {
  return Math.round(amountK / participantCount);
}

function buildShares(input: RecordInput, previous?: ExpenseRecord): Record<string, Share> {
  const perHead = shareAmountK(input.amountK, input.participantIds.length);
  const shares: Record<string, Share> = {};
  for (const uid of input.participantIds) {
    if (uid === input.payerId) continue;
    // Keep paid status across edits when the share amount didn't change.
    const prev = previous?.shares[uid];
    if (prev && prev.amountK === perHead && input.payerId === previous?.payerId) {
      shares[uid] = prev;
    } else {
      shares[uid] = { amountK: perHead, paid: false, paidAt: null };
    }
  }
  return shares;
}

export async function addRecord(groupId: string, actor: UserProfile, input: RecordInput): Promise<ExpenseRecord> {
  const ref = doc(collection(db, 'groups', groupId, 'records'));
  const record: ExpenseRecord = {
    id: ref.id,
    groupId,
    amountK: input.amountK,
    payerId: input.payerId,
    participantIds: input.participantIds,
    date: input.date,
    note: input.note.trim(),
    createdBy: actor.uid,
    createdAt: Date.now(),
    shares: buildShares(input),
  };
  await setDoc(ref, record);
  await logActivity(
    groupId,
    'record_added',
    actor.uid,
    `${actor.nickname} added ${formatK(input.amountK)}${record.note ? ` · ${record.note}` : ''}`
  );
  return record;
}

export async function updateRecord(
  groupId: string,
  actor: UserProfile,
  previous: ExpenseRecord,
  input: RecordInput
): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId, 'records', previous.id), {
    amountK: input.amountK,
    payerId: input.payerId,
    participantIds: input.participantIds,
    date: input.date,
    note: input.note.trim(),
    shares: buildShares(input, previous),
  });
  await logActivity(groupId, 'record_edited', actor.uid, `${actor.nickname} edited ${formatK(input.amountK)}${input.note.trim() ? ` · ${input.note.trim()}` : ''}`);
}

export async function deleteRecord(groupId: string, actor: UserProfile, record: ExpenseRecord): Promise<void> {
  await deleteDoc(doc(db, 'groups', groupId, 'records', record.id));
  await logActivity(
    groupId,
    'record_deleted',
    actor.uid,
    `${actor.nickname} deleted ${formatK(record.amountK)}${record.note ? ` · ${record.note}` : ''}`
  );
}

export async function markSharePaid(
  groupId: string,
  recordId: string,
  actor: UserProfile,
  debtorUid: string,
  amountK: number
): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId, 'records', recordId), {
    [`shares.${debtorUid}.paid`]: true,
    [`shares.${debtorUid}.paidAt`]: Date.now(),
  });
  await logActivity(groupId, 'share_paid', actor.uid, `${actor.nickname} paid ${formatK(amountK)}`);
}

export function listenRecords(groupId: string, onChange: (records: ExpenseRecord[]) => void): () => void {
  // Sorted client-side so no composite index needs to be created in Firestore.
  return onSnapshot(collection(db, 'groups', groupId, 'records'), (snap) => {
    const records = snap.docs.map((d) => d.data() as ExpenseRecord);
    records.sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1));
    onChange(records);
  });
}
