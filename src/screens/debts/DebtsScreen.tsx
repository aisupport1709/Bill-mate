import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { markSharePaid } from '../../api/records';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { useProfile } from '../../context/AuthContext';
import { useColors, useT } from '../../context/SettingsContext';
import { DebtItem, useAllDebts } from '../../hooks/useAllDebts';
import { displayName, useProfiles } from '../../hooks/useProfiles';
import { showAlert } from '../../lib/alert';
import { formatDate, formatDateTime, formatK } from '../../lib/format';
import { notifyUsers } from '../../lib/push';

type Tab = 'iOwe' | 'owedToMe' | 'history';
type GroupBy = 'friend' | 'group';

export function DebtsScreen() {
  const profile = useProfile();
  const colors = useColors();
  const t = useT();
  const { items, loading } = useAllDebts();
  const [tab, setTab] = useState<Tab>('iOwe');
  const [view, setView] = useState<GroupBy>('friend');

  const iOwe = items.filter((i) => i.debtorId === profile.uid && !i.paid);
  const owedToMe = items.filter((i) => i.creditorId === profile.uid && !i.paid);
  const history = items
    .filter((i) => i.paid && (i.debtorId === profile.uid || i.creditorId === profile.uid))
    .sort((a, b) => (b.paidAt ?? 0) - (a.paidAt ?? 0));

  const everyone = useMemo(() => {
    const uids = new Set<string>();
    items.forEach((i) => { uids.add(i.debtorId); uids.add(i.creditorId); });
    return [...uids];
  }, [items]);
  const profiles = useProfiles(everyone);

  const markPaid = async (item: DebtItem, notify = true) => {
    await markSharePaid(item.group.id, item.record.id, profile, item.debtorId, item.amountK);
    if (notify) notifyUsers([item.creditorId], item.group.name, `${profile.nickname} marked ${formatK(item.amountK)} as paid to you`);
  };

  const confirmMarkPaid = (item: DebtItem) => {
    showAlert(t.markAsPaid, t.markAsPaidMsg(formatK(item.amountK), displayName(profiles, item.creditorId, profile.uid)), [
      { text: t.cancel, style: 'cancel' },
      { text: t.iPaidThis, onPress: () => markPaid(item) },
    ]);
  };

  const confirmMarkAllPaid = (creditorId: string, groupItems: DebtItem[], total: number) => {
    showAlert(t.markAllPaid, t.markAllPaidMsg(formatK(total), displayName(profiles, creditorId, profile.uid), groupItems.length), [
      { text: t.cancel, style: 'cancel' },
      { text: t.iPaidAll, onPress: async () => {
        for (const item of groupItems) await markPaid(item, false);
        notifyUsers([creditorId], 'Bill Mate', `${profile.nickname} marked ${formatK(total)} (${groupItems.length} items) as paid to you`);
      }},
    ]);
  };

  // Group by friend (creditor or debtor uid)
  const groupByFriend = (list: DebtItem[], keyFn: (i: DebtItem) => string) => {
    const map = new Map<string, DebtItem[]>();
    for (const item of list) {
      const key = keyFn(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return [...map.entries()]
      .map(([uid, groupItems]) => ({ uid, items: groupItems, total: groupItems.reduce((s, i) => s + i.amountK, 0) }))
      .sort((a, b) => b.total - a.total);
  };

  // Group by group id
  const groupByGroup = (list: DebtItem[]) => {
    const map = new Map<string, DebtItem[]>();
    for (const item of list) {
      const key = item.group.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return [...map.entries()]
      .map(([, groupItems]) => ({ group: groupItems[0].group, items: groupItems, total: groupItems.reduce((s, i) => s + i.amountK, 0) }))
      .sort((a, b) => b.total - a.total);
  };

  const renderItemRow = (item: DebtItem, action?: () => void, showFriend?: boolean) => (
    <View key={`${item.record.id}-${item.debtorId}`} style={[styles.itemRow, { borderColor: colors.border }]}>
      <View style={styles.itemBody}>
        {showFriend && (
          <View style={styles.itemFriendRow}>
            <Avatar avatarId={profiles.get(tab === 'iOwe' ? item.creditorId : item.debtorId)?.avatarId} size={18} />
            <Text style={[styles.itemFriend, { color: colors.textSecondary }]}>
              {displayName(profiles, tab === 'iOwe' ? item.creditorId : item.debtorId, profile.uid)}
            </Text>
          </View>
        )}
        <Text style={[styles.itemTitle, { color: colors.text }]}>
          {!showFriend ? `${item.group.emoji} ${item.group.name}` : ''}{item.record.note ? (showFriend ? item.record.note : ` · ${item.record.note}`) : ''}
        </Text>
        <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>{formatDate(item.record.date)}</Text>
      </View>
      <Text style={[styles.itemAmount, { color: colors.text }]}>{formatK(item.amountK)}</Text>
      {action && (
        <TouchableOpacity style={[styles.payBtn, { borderColor: colors.success }]} onPress={action}>
          <Text style={[styles.payBtnText, { color: colors.success }]}>{t.paid}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const TABS: [Tab, string][] = [['iOwe', t.iOwe], ['owedToMe', t.owedToMe], ['history', t.history]];

  const showViewToggle = tab !== 'history';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Main tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.segmentBg }]}>
        {TABS.map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.tab, tab === key && [styles.tabActive, { backgroundColor: colors.card }]]} onPress={() => setTab(key)}>
            <Text style={[styles.tabText, { color: tab === key ? colors.text : colors.textSecondary }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* View toggle: By Friend / By Group */}
      {showViewToggle && (
        <View style={[styles.viewToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.viewBtn, view === 'friend' && { backgroundColor: colors.primary }]}
            onPress={() => setView('friend')}
          >
            <Text style={[styles.viewBtnText, { color: view === 'friend' ? '#fff' : colors.textSecondary }]}>👤 {t.viewByFriend}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewBtn, view === 'group' && { backgroundColor: colors.primary }]}
            onPress={() => setView('group')}
          >
            <Text style={[styles.viewBtnText, { color: view === 'group' ? '#fff' : colors.textSecondary }]}>👥 {t.viewByGroup}</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* I OWE */}
        {tab === 'iOwe' && (
          <>
            {iOwe.length === 0 && !loading && <EmptyState emoji="🎉" title={t.youOweNothing} subtitle={t.youOweNothingSubtitle} />}

            {view === 'friend' && groupByFriend(iOwe, (i) => i.creditorId).map(({ uid, items: groupItems, total }) => (
              <View key={uid} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.cardHeader, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Avatar avatarId={profiles.get(uid)?.avatarId} size={36} />
                  <View style={styles.cardHeaderBody}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{t.youOweLabel(displayName(profiles, uid, profile.uid))}</Text>
                    <Text style={[styles.cardTotal, { color: colors.textSecondary }]}>{formatK(total)} · {t.items(groupItems.length)}</Text>
                  </View>
                  <TouchableOpacity style={[styles.markAllBtn, { backgroundColor: colors.success }]} onPress={() => confirmMarkAllPaid(uid, groupItems, total)}>
                    <Text style={styles.markAllText}>{t.payAll}</Text>
                  </TouchableOpacity>
                </View>
                {groupItems.map((item) => renderItemRow(item, () => confirmMarkPaid(item)))}
              </View>
            ))}

            {view === 'group' && groupByGroup(iOwe).map(({ group, items: groupItems, total }) => (
              <View key={group.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.cardHeader, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <View style={[styles.groupIcon, { backgroundColor: group.color }]}>
                    <Text style={styles.groupEmoji}>{group.emoji}</Text>
                  </View>
                  <View style={styles.cardHeaderBody}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{group.name}</Text>
                    <Text style={[styles.cardTotal, { color: colors.textSecondary }]}>{formatK(total)} · {t.items(groupItems.length)}</Text>
                  </View>
                </View>
                {groupItems.map((item) => renderItemRow(item, () => confirmMarkPaid(item), true))}
              </View>
            ))}
          </>
        )}

        {/* OWED TO ME */}
        {tab === 'owedToMe' && (
          <>
            {owedToMe.length === 0 && !loading && <EmptyState emoji="😌" title={t.nobodyOwesYou} subtitle={t.nobodyOwesYouSubtitle} />}

            {view === 'friend' && groupByFriend(owedToMe, (i) => i.debtorId).map(({ uid, items: groupItems, total }) => (
              <View key={uid} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.cardHeader, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Avatar avatarId={profiles.get(uid)?.avatarId} size={36} />
                  <View style={styles.cardHeaderBody}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{t.owesYou(displayName(profiles, uid, profile.uid))}</Text>
                    <Text style={[styles.cardTotal, { color: colors.textSecondary }]}>{formatK(total)} · {t.items(groupItems.length)}</Text>
                  </View>
                </View>
                {groupItems.map((item) => renderItemRow(item))}
              </View>
            ))}

            {view === 'group' && groupByGroup(owedToMe).map(({ group, items: groupItems, total }) => (
              <View key={group.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.cardHeader, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <View style={[styles.groupIcon, { backgroundColor: group.color }]}>
                    <Text style={styles.groupEmoji}>{group.emoji}</Text>
                  </View>
                  <View style={styles.cardHeaderBody}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{group.name}</Text>
                    <Text style={[styles.cardTotal, { color: colors.textSecondary }]}>{formatK(total)} · {t.items(groupItems.length)}</Text>
                  </View>
                </View>
                {groupItems.map((item) => renderItemRow(item, undefined, true))}
              </View>
            ))}
          </>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <>
            {history.length === 0 && !loading && <EmptyState emoji="🗂" title={t.noPayments} subtitle={t.noPaymentsSubtitle} />}
            {history.map((item) => (
              <View key={`${item.record.id}-${item.debtorId}`} style={[styles.historyRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.historyText, { color: colors.text }]}>
                  {t.paid2(displayName(profiles, item.debtorId, profile.uid), displayName(profiles, item.creditorId, profile.uid))}
                  {' '}<Text style={styles.historyAmount}>{formatK(item.amountK)}</Text>
                </Text>
                <Text style={[styles.historyMeta, { color: colors.textSecondary }]}>
                  {item.group.emoji} {item.group.name}{item.record.note ? ` · ${item.record.note}` : ''} · {item.paidAt ? formatDateTime(item.paidAt) : ''}
                </Text>
              </View>
            ))}
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { flexDirection: 'row', margin: 16, marginBottom: 8, borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: {},
  tabText: { fontSize: 14, fontWeight: '600' },
  viewToggle: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  viewBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  viewBtnText: { fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderBottomWidth: 1 },
  cardHeaderBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardTotal: { fontSize: 13, marginTop: 1 },
  markAllBtn: { borderRadius: 8, paddingVertical: 7, paddingHorizontal: 12 },
  markAllText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  groupIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  groupEmoji: { fontSize: 20 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
  itemBody: { flex: 1 },
  itemFriendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  itemFriend: { fontSize: 12, fontWeight: '600' },
  itemTitle: { fontSize: 14, fontWeight: '600' },
  itemMeta: { fontSize: 12, marginTop: 1 },
  itemAmount: { fontSize: 15, fontWeight: '700' },
  payBtn: { borderWidth: 1.5, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  payBtnText: { fontSize: 13, fontWeight: '700' },
  historyRow: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  historyText: { fontSize: 14 },
  historyAmount: { fontWeight: '800' },
  historyMeta: { fontSize: 12, marginTop: 3 },
});
