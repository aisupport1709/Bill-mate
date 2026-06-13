import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { listenActivity } from '../../api/activity';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { useColors, useT } from '../../context/SettingsContext';
import { useProfiles } from '../../hooks/useProfiles';
import { formatDateTime } from '../../lib/format';
import { RootStackParamList } from '../../navigation/types';
import { ActivityEntry } from '../../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'Activity'>;

const ICONS: Record<string, string> = {
  group_created: '🎉', member_joined: '👋', member_left: '🚪',
  record_added: '🧾', record_edited: '✏️', record_deleted: '🗑', share_paid: '💸',
};

export function ActivityScreen({ route }: Props) {
  const { groupId } = route.params;
  const colors = useColors();
  const t = useT();
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null);

  useEffect(() => listenActivity(groupId, setEntries), [groupId]);

  const actorIds = useMemo(() => [...new Set((entries ?? []).map((e) => e.actorId))], [entries]);
  const profiles = useProfiles(actorIds);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {entries !== null && entries.length === 0 && <EmptyState emoji="🕓" title={t.noActivityTitle} />}
      {(entries ?? []).map((item) => (
        <View key={item.id} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Avatar avatarId={profiles.get(item.actorId)?.avatarId} size={34} />
          <View style={styles.body}>
            <Text style={[styles.summary, { color: colors.text }]}>{ICONS[item.type] ?? '•'} {item.summary}</Text>
            <Text style={[styles.time, { color: colors.textSecondary }]}>{formatDateTime(item.createdAt)}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8, gap: 10, alignItems: 'center' },
  body: { flex: 1 },
  summary: { fontSize: 14 },
  time: { fontSize: 12, marginTop: 2 },
});
