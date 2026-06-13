import { useEffect, useMemo, useState } from 'react';
import { listenMyGroups } from '../api/groups';
import { listenRecords } from '../api/records';
import { useProfile } from '../context/AuthContext';
import { ExpenseRecord, Group } from '../types/models';

export interface DebtItem {
  group: Group;
  record: ExpenseRecord;
  debtorId: string;
  creditorId: string;
  amountK: number;
  paid: boolean;
  paidAt: number | null;
}

// Live debt items across every group the user belongs to.
export function useAllDebts(): { items: DebtItem[]; loading: boolean } {
  const profile = useProfile();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [recordsByGroup, setRecordsByGroup] = useState<Record<string, ExpenseRecord[]>>({});

  useEffect(() => listenMyGroups(profile.uid, setGroups), [profile.uid]);

  const groupKey = (groups ?? []).map((g) => g.id).join(',');

  useEffect(() => {
    if (!groups) return;
    const unsubscribers = groups.map((g) =>
      listenRecords(g.id, (records) => {
        setRecordsByGroup((prev) => ({ ...prev, [g.id]: records }));
      })
    );
    return () => unsubscribers.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupKey]);

  const items = useMemo(() => {
    const result: DebtItem[] = [];
    for (const group of groups ?? []) {
      for (const record of recordsByGroup[group.id] ?? []) {
        for (const [debtorId, share] of Object.entries(record.shares)) {
          result.push({
            group,
            record,
            debtorId,
            creditorId: record.payerId,
            amountK: share.amountK,
            paid: share.paid,
            paidAt: share.paidAt,
          });
        }
      }
    }
    return result;
  }, [groups, recordsByGroup]);

  return { items, loading: groups === null };
}
