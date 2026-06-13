import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { listenGroup } from '../../api/groups';
import { addRecord, shareAmountK, updateRecord } from '../../api/records';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { DatePicker } from '../../components/DatePicker';
import { Input } from '../../components/Input';
import { useProfile } from '../../context/AuthContext';
import { useColors, useT } from '../../context/SettingsContext';
import { showAlert } from '../../lib/alert';
import { formatK, parseK, todayISO } from '../../lib/format';
import { displayName, useProfiles } from '../../hooks/useProfiles';
import { notifyUsers } from '../../lib/push';
import { RootStackParamList } from '../../navigation/types';
import { Group } from '../../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'RecordForm'>;

export function RecordFormScreen({ route, navigation }: Props) {
  const { groupId, record } = route.params;
  const profile = useProfile();
  const colors = useColors();
  const t = useT();
  const [group, setGroup] = useState<Group | null>(null);
  const [amountText, setAmountText] = useState(record ? `${record.amountK}` : '');
  const [note, setNote] = useState(record?.note ?? '');
  const [payerId, setPayerId] = useState(record?.payerId ?? profile.uid);
  const [participants, setParticipants] = useState<Set<string>>(new Set(record?.participantIds ?? []));
  const [date, setDate] = useState(record?.date ?? todayISO());
  const [saving, setSaving] = useState(false);
  const profiles = useProfiles(group?.memberIds ?? []);

  useEffect(() => listenGroup(groupId, setGroup), [groupId]);
  useEffect(() => {
    if (!record && group && participants.size === 0) setParticipants(new Set(group.memberIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);
  useEffect(() => {
    navigation.setOptions({ title: record ? t.editExpense : t.addExpense });
  }, [navigation, record, t]);

  const amountK = parseK(amountText);
  const memberIds = group?.memberIds ?? [];
  const allSelected = memberIds.length > 0 && memberIds.every((m) => participants.has(m));
  const toggleParticipant = (uid: string) => {
    const next = new Set(participants);
    if (next.has(uid)) next.delete(uid); else next.add(uid);
    setParticipants(next);
  };

  const onSave = async () => {
    if (!amountK) { showAlert(t.invalidAmount, t.invalidAmountMsg); return; }
    if (participants.size === 0) { showAlert(t.noParticipants, t.noParticipantsMsg); return; }
    setSaving(true);
    const input = { amountK, payerId, participantIds: [...participants], date, note };
    try {
      if (record) {
        await updateRecord(groupId, profile, record, input);
      } else {
        const saved = await addRecord(groupId, profile, input);
        notifyUsers([...participants].filter((u) => u !== profile.uid), group?.name ?? 'Bill Mate',
          `${profile.nickname} added ${formatK(amountK)}${note.trim() ? ` for ${note.trim()}` : ''} — your share is ${formatK(shareAmountK(saved.amountK, saved.participantIds.length))}`
        );
      }
      navigation.goBack();
    } catch (e: any) { showAlert(t.couldNotSave, e.message); setSaving(false); }
  };

  const perHead = amountK && participants.size > 0 ? shareAmountK(amountK, participants.size) : null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Input label={t.amountLabel} value={amountText} onChangeText={setAmountText} keyboardType="number-pad" placeholder={t.amountPlaceholder} suffix="K" autoFocus={!record} />
      {amountK ? <Text style={[styles.amountPreview, { color: colors.success }]}>= {formatK(amountK)} ({(amountK * 1000).toLocaleString('en-US')} ₫)</Text> : null}
      <Input label={t.note} value={note} onChangeText={setNote} placeholder={t.notePlaceholder} maxLength={60} />

      <Text style={[styles.label, { color: colors.textSecondary }]}>{t.whoPaid}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.payerRow}>
        {memberIds.map((uid) => (
          <TouchableOpacity key={uid} style={[styles.payerChip, { backgroundColor: colors.card, borderColor: uid === payerId ? colors.primary : colors.border }, uid === payerId && { backgroundColor: colors.primary + '22' }]} onPress={() => setPayerId(uid)}>
            <Avatar avatarId={profiles.get(uid)?.avatarId} size={28} />
            <Text style={[styles.payerName, { color: uid === payerId ? colors.primary : colors.text }]}>{displayName(profiles, uid, profile.uid)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.splitHeader}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t.whoShares}</Text>
        <TouchableOpacity onPress={() => setParticipants(new Set(allSelected ? [] : memberIds))}>
          <Text style={[styles.selectAll, { color: colors.primary }]}>{allSelected ? t.clearAll : t.selectAll}</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.participantCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {memberIds.map((uid) => {
          const selected = participants.has(uid);
          return (
            <TouchableOpacity key={uid} style={styles.participantRow} onPress={() => toggleParticipant(uid)}>
              <Avatar avatarId={profiles.get(uid)?.avatarId} size={32} />
              <Text style={[styles.participantName, { color: colors.text }]}>{displayName(profiles, uid, profile.uid)}</Text>
              {selected && perHead ? <Text style={[styles.shareAmount, { color: colors.textSecondary }]}>{formatK(perHead)}</Text> : null}
              <View style={[styles.checkbox, { borderColor: selected ? colors.primary : colors.border }, selected && { backgroundColor: colors.primary }]}>
                {selected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      {perHead ? <Text style={[styles.splitSummary, { color: colors.textSecondary }]}>{formatK(amountK!)} ÷ {participants.size} = {formatK(perHead)} each</Text> : null}

      <Text style={[styles.label, { color: colors.textSecondary }]}>{t.date}</Text>
      <View style={styles.dateRow}>
        <DatePicker value={date} onChange={setDate} maximumDate={new Date()} />
      </View>

      <Button title={record ? t.saveChanges : t.addExpense} onPress={onSave} loading={saving} disabled={!amountK || participants.size === 0} style={styles.save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  amountPreview: { fontSize: 13, fontWeight: '600', marginTop: -10, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  payerRow: { flexGrow: 0, marginBottom: 20 },
  payerChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 10, marginRight: 8 },
  payerName: { fontSize: 14, fontWeight: '600' },
  splitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectAll: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  participantCard: { borderRadius: 14, borderWidth: 1 },
  participantRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  participantName: { flex: 1, fontSize: 15, fontWeight: '600' },
  shareAmount: { fontSize: 13, marginRight: 8 },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '800' },
  splitSummary: { fontSize: 13, marginTop: 8, textAlign: 'center' },
  dateRow: { alignItems: 'flex-start', marginBottom: 8 },
  save: { marginTop: 20 },
});
