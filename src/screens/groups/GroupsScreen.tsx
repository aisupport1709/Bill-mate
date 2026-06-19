import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { listenMyGroups } from '../../api/groups';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { useProfile } from '../../context/AuthContext';
import { useColors, useT } from '../../context/SettingsContext';
import { displayGroupCode } from '../../lib/groupCode';
import { GroupsStackParamList } from '../../navigation/types';
import { Group } from '../../types/models';

type Nav = NativeStackNavigationProp<GroupsStackParamList>;

export function GroupsScreen() {
  const navigation = useNavigation<Nav>();
  const profile = useProfile();
  const colors = useColors();
  const t = useT();
  const [groups, setGroups] = useState<Group[] | null>(null);

  useEffect(() => listenMyGroups(profile.uid, setGroups), [profile.uid]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.actions}>
        <Button title={t.createGroup} onPress={() => navigation.navigate('CreateGroup')} style={styles.actionBtn} />
        <Button title={t.joinGroup} variant="secondary" onPress={() => navigation.navigate('JoinGroup')} style={styles.actionBtn} />
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {groups !== null && groups.length === 0 && (
          <EmptyState emoji="👥" title={t.noGroupsTitle} subtitle={t.noGroupsSubtitle} />
        )}
        {(groups ?? []).map((item) => (
          <TouchableOpacity key={item.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })} activeOpacity={0.7}>
            <View style={[styles.groupIcon, { backgroundColor: item.color }]}>
              <Text style={styles.groupEmoji}>{item.emoji}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.groupName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.groupMeta, { color: colors.textSecondary }]}>
                {item.memberIds.length} {t.members}{item.memberIds.length > 1 ? 's' : ''} · {displayGroupCode(item.id)}
              </Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  actions: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 8 },
  actionBtn: { flex: 1 },
  list: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  groupIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  groupEmoji: { fontSize: 24 },
  cardBody: { flex: 1, marginLeft: 12 },
  groupName: { fontSize: 16, fontWeight: '700' },
  groupMeta: { fontSize: 13, marginTop: 2 },
  chevron: { fontSize: 24 },
});
