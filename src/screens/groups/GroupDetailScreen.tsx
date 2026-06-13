import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { listenGroup } from '../../api/groups';
import { deleteRecord, listenRecords } from '../../api/records';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { useProfile } from '../../context/AuthContext';
import { useColors, useT } from '../../context/SettingsContext';
import { showAlert } from '../../lib/alert';
import { formatDate, formatK } from '../../lib/format';
import { displayName, useProfiles } from '../../hooks/useProfiles';
import { RootStackParamList } from '../../navigation/types';
import { ExpenseRecord, Group } from '../../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupDetail'>;

export function GroupDetailScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const profile = useProfile();
  const colors = useColors();
  const t = useT();
  const [group, setGroup] = useState<Group | null>(null);
  const [records, setRecords] = useState<ExpenseRecord[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const profiles = useProfiles(group?.memberIds ?? []);

  useEffect(() => listenGroup(groupId, setGroup), [groupId]);
  useEffect(() => listenRecords(groupId, setRecords), [groupId]);

  const adminIds: string[] = group?.adminIds ?? (group ? [group.createdBy] : []);
  const isAdmin = adminIds.includes(profile.uid);

  useEffect(() => {
    navigation.setOptions({
      title: group ? `${group.emoji} ${group.name}` : '',
      headerRight: () => (
        <TouchableOpacity style={[styles.inviteBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('GroupInfo', { groupId })}>
          <Text style={[styles.inviteBtnText, { color: colors.text }]}>👥 {t.invitePlus}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, group, groupId, colors, t]);

  const balances = useMemo(() => {
    const net: Record<string, number> = {};
    for (const uid of group?.memberIds ?? []) net[uid] = 0;
    for (const r of records ?? []) {
      for (const [debtor, share] of Object.entries(r.shares)) {
        if (share.paid) continue;
        net[r.payerId] = (net[r.payerId] ?? 0) + share.amountK;
        net[debtor] = (net[debtor] ?? 0) - share.amountK;
      }
    }
    return net;
  }, [group, records]);

  const onRecordLongPress = (record: ExpenseRecord) => {
    showAlert(
      `${formatK(record.amountK)}${record.note ? ` · ${record.note}` : ''}`,
      `${displayName(profiles, record.payerId, profile.uid)} · ${formatDate(record.date)}`,
      [
        { text: t.edit, onPress: () => navigation.navigate('RecordForm', { groupId, record }) },
        { text: t.delete, style: 'destructive', onPress: () =>
            showAlert(t.deleteExpense, t.deleteExpenseMsg, [
              { text: t.cancel, style: 'cancel' },
              { text: t.delete, style: 'destructive', onPress: () => deleteRecord(groupId, profile, record) },
            ]) },
        { text: t.cancel, style: 'cancel' },
      ]
    );
  };

  const renderRecord = (item: ExpenseRecord) => {
    const myShare = item.shares[profile.uid];
    const unpaidCount = Object.values(item.shares).filter((s) => !s.paid).length;
    const isExpanded = expandedId === item.id;

    // Build participant rows: payer first, then debtors
    const payerIsPaid = !item.shares[item.payerId]; // payer not in shares means they don't owe themselves
    const debtorEntries = Object.entries(item.shares) as [string, { amountK: number; paid: boolean; paidAt: number | null }][];

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.recordCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        onLongPress={() => onRecordLongPress(item)}
        activeOpacity={0.7}
      >
        {/* Header row */}
        <Avatar avatarId={profiles.get(item.payerId)?.avatarId} size={40} />
        <View style={styles.recordBody}>
          <Text style={[styles.recordTitle, { color: colors.text }]}>
            {displayName(profiles, item.payerId, profile.uid)} · {formatK(item.amountK)}
          </Text>
          <Text style={[styles.recordMeta, { color: colors.textSecondary }]}>
            {item.note ? `${item.note} · ` : ''}{formatDate(item.date)} · {item.participantIds.length}p
          </Text>
          {myShare && !myShare.paid && <Text style={[styles.youOwe, { color: colors.warning }]}>{t.youOwe} {formatK(myShare.amountK)}</Text>}
          {myShare && myShare.paid && <Text style={[styles.youPaid, { color: colors.success }]}>{t.youPaid}</Text>}
        </View>
        <View style={styles.recordRight}>
          <Text style={[styles.recordAmount, { color: colors.text }]}>{formatK(item.amountK)}</Text>
          <Text style={[styles.recordStatus, { color: unpaidCount === 0 ? colors.success : colors.warning }]}>
            {unpaidCount === 0 ? t.settled : `${unpaidCount} ${t.unpaid}`}
          </Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>{isExpanded ? '▲' : '▼'}</Text>
        </View>

        {/* Expanded detail */}
        {isExpanded && (
          <View style={[styles.detail, { borderTopColor: colors.border }]}>
            {/* Payer row */}
            <View style={styles.detailRow}>
              <Avatar avatarId={profiles.get(item.payerId)?.avatarId} size={26} />
              <Text style={[styles.detailName, { color: colors.text }]}>
                {displayName(profiles, item.payerId, profile.uid)}
              </Text>
              <View style={[styles.detailBadge, { backgroundColor: colors.primary + '22' }]}>
                <Text style={[styles.detailBadgeText, { color: colors.primary }]}>💳 {t.paid}</Text>
              </View>
              <Text style={[styles.detailAmount, { color: colors.text }]}>{formatK(item.amountK)}</Text>
            </View>

            {/* Divider */}
            <View style={[styles.detailDivider, { backgroundColor: colors.border }]} />

            {/* Each debtor */}
            {debtorEntries.map(([uid, share]) => (
              <View key={uid} style={styles.detailRow}>
                <Avatar avatarId={profiles.get(uid)?.avatarId} size={26} />
                <Text style={[styles.detailName, { color: colors.text }]}>
                  {displayName(profiles, uid, profile.uid)}
                </Text>
                {share.paid ? (
                  <View style={[styles.detailBadge, { backgroundColor: colors.success + '22' }]}>
                    <Text style={[styles.detailBadgeText, { color: colors.success }]}>✓ {t.settled}</Text>
                  </View>
                ) : (
                  <View style={[styles.detailBadge, { backgroundColor: colors.warning + '22' }]}>
                    <Text style={[styles.detailBadgeText, { color: colors.warning }]}>{t.unpaid}</Text>
                  </View>
                )}
                <Text style={[styles.detailAmount, { color: share.paid ? colors.textSecondary : colors.text }]}>
                  {formatK(share.amountK)}
                </Text>
              </View>
            ))}

            {/* Edit / Delete actions */}
            <View style={[styles.detailActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity onPress={() => navigation.navigate('RecordForm', { groupId, record: item })} style={styles.detailAction}>
                <Text style={[styles.detailActionText, { color: colors.primary }]}>✏️ {t.edit}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => showAlert(t.deleteExpense, t.deleteExpenseMsg, [
                  { text: t.cancel, style: 'cancel' },
                  { text: t.delete, style: 'destructive', onPress: () => { setExpandedId(null); deleteRecord(groupId, profile, item); } },
                ])}
                style={styles.detailAction}
              >
                <Text style={[styles.detailActionText, { color: colors.danger }]}>🗑 {t.delete}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.balanceStrip, { backgroundColor: colors.card, borderColor: colors.border }]} contentContainerStyle={styles.balanceContent}>
        {(group?.memberIds ?? []).map((uid) => {
          const net = balances[uid] ?? 0;
          return (
            <View key={uid} style={styles.balanceChip}>
              <Avatar avatarId={profiles.get(uid)?.avatarId} size={30} />
              <View>
                <Text style={[styles.balanceName, { color: colors.textSecondary }]}>{displayName(profiles, uid, profile.uid)}</Text>
                <Text style={[styles.balanceAmount, { color: net > 0 ? colors.success : net < 0 ? colors.danger : colors.text }]}>
                  {net > 0 ? '+' : ''}{formatK(net)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.toolRow}>
        <TouchableOpacity style={[styles.toolBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('SettleUp', { groupId })}>
          <Text style={[styles.toolText, { color: colors.text }]}>{t.settleUp}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toolBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('Activity', { groupId })}>
          <Text style={[styles.toolText, { color: colors.text }]}>{t.activity}</Text>
        </TouchableOpacity>
        {isAdmin && (
          <TouchableOpacity style={[styles.toolBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary }]} onPress={() => navigation.navigate('GroupInfo', { groupId })}>
            <Text style={[styles.toolText, { color: colors.primary }]}>{t.manageGroup}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {records === null ? null : records.length === 0
          ? <EmptyState emoji="🧾" title={t.noExpensesTitle} subtitle={t.noExpensesSubtitle} />
          : records.map(renderRecord)}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('RecordForm', { groupId })} activeOpacity={0.8}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inviteBtn: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1 },
  inviteBtnText: { fontSize: 14, fontWeight: '700' },
  balanceStrip: { flexGrow: 0, borderBottomWidth: 1 },
  balanceContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  balanceChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  balanceName: { fontSize: 12 },
  balanceAmount: { fontSize: 14, fontWeight: '700' },
  toolRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  toolBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  toolText: { fontSize: 14, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 100 },
  recordCard: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  recordBody: { flex: 1 },
  recordTitle: { fontSize: 15, fontWeight: '700' },
  recordMeta: { fontSize: 13, marginTop: 2 },
  youOwe: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  youPaid: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  recordRight: { alignItems: 'flex-end', justifyContent: 'center' },
  recordAmount: { fontSize: 16, fontWeight: '800' },
  recordStatus: { fontSize: 12, marginTop: 4 },
  chevron: { fontSize: 10, marginTop: 4 },
  detail: { width: '100%', borderTopWidth: 1, paddingTop: 12, marginTop: 4, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailName: { flex: 1, fontSize: 13, fontWeight: '600' },
  detailBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  detailBadgeText: { fontSize: 11, fontWeight: '700' },
  detailAmount: { fontSize: 13, fontWeight: '700', minWidth: 48, textAlign: 'right' },
  detailDivider: { height: 1, marginVertical: 2 },
  detailActions: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, marginTop: 4, gap: 16 },
  detailAction: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  detailActionText: { fontSize: 13, fontWeight: '700' },
  fab: { position: 'absolute', right: 20, bottom: 28, width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6, zIndex: 10 },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 34, fontWeight: '600' },
});
