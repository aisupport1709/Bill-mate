import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { listenGroup } from '../../api/groups';
import { listenRecords } from '../../api/records';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { useProfile } from '../../context/AuthContext';
import { useColors, useT } from '../../context/SettingsContext';
import { displayName, useProfiles } from '../../hooks/useProfiles';
import { formatK } from '../../lib/format';
import { minCashFlow } from '../../lib/settle';
import { RootStackParamList } from '../../navigation/types';
import { ExpenseRecord, Group } from '../../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'SettleUp'>;

export function SettleUpScreen({ route }: Props) {
  const { groupId } = route.params;
  const profile = useProfile();
  const colors = useColors();
  const t = useT();
  const [group, setGroup] = useState<Group | null>(null);
  const [records, setRecords] = useState<ExpenseRecord[] | null>(null);
  const profiles = useProfiles(group?.memberIds ?? []);

  useEffect(() => listenGroup(groupId, setGroup), [groupId]);
  useEffect(() => listenRecords(groupId, setRecords), [groupId]);

  const transfers = useMemo(() => {
    const net: Record<string, number> = {};
    for (const r of records ?? []) {
      for (const [debtor, share] of Object.entries(r.shares)) {
        if (share.paid) continue;
        net[r.payerId] = (net[r.payerId] ?? 0) + share.amountK;
        net[debtor] = (net[debtor] ?? 0) - share.amountK;
      }
    }
    return minCashFlow(net);
  }, [records]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>{t.settleUpTitle}</Text>
      {records !== null && transfers.length === 0 && (
        <EmptyState emoji="✅" title={t.allSettled} subtitle={t.allSettledSubtitle} />
      )}
      {transfers.map((tr, i) => (
        <View key={i} style={[styles.card, { backgroundColor: colors.card, borderColor: tr.from === profile.uid ? colors.primary : colors.border, borderWidth: tr.from === profile.uid ? 1.5 : 1 }]}>
          <Avatar avatarId={profiles.get(tr.from)?.avatarId} size={36} />
          <View style={styles.middle}>
            <Text style={[styles.names, { color: colors.text }]}>
              {displayName(profiles, tr.from, profile.uid)} → {displayName(profiles, tr.to, profile.uid)}
            </Text>
            <Text style={[styles.amount, { color: colors.primary }]}>{formatK(tr.amountK)}</Text>
          </View>
          <Avatar avatarId={profiles.get(tr.to)?.avatarId} size={36} />
        </View>
      ))}
      {transfers.length > 0 && (
        <Text style={[styles.footnote, { color: colors.textSecondary }]}>{t.settleFootnote}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  hint: { fontSize: 14, marginBottom: 16 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 10, gap: 12 },
  middle: { flex: 1, alignItems: 'center' },
  names: { fontSize: 14, fontWeight: '600' },
  amount: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  footnote: { fontSize: 13, textAlign: 'center', marginTop: 12 },
});
