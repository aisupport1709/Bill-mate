export interface UserProfile {
  uid: string;
  phone: string;
  nickname: string;
  avatarId: number;
  expoPushToken?: string;
  createdAt: number;
}

export interface Group {
  id: string; // short join code, also the Firestore doc id
  name: string;
  emoji: string;
  color: string;
  createdBy: string;
  memberIds: string[];
  adminIds: string[]; // uids with admin rights (always includes createdBy)
  createdAt: number;
}

export interface Share {
  amountK: number;
  paid: boolean;
  paidAt: number | null;
}

export interface ExpenseRecord {
  id: string;
  groupId: string;
  amountK: number;
  payerId: string;
  participantIds: string[];
  date: string; // YYYY-MM-DD
  note: string;
  createdBy: string;
  createdAt: number;
  // keyed by debtor uid — every participant except the payer
  shares: Record<string, Share>;
}

export type ActivityType =
  | 'group_created'
  | 'member_joined'
  | 'member_left'
  | 'record_added'
  | 'record_edited'
  | 'record_deleted'
  | 'share_paid';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  actorId: string;
  summary: string;
  createdAt: number;
}
