import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { addFriend } from '../../api/friends';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { useProfile } from '../../context/AuthContext';
import { useColors, useT } from '../../context/SettingsContext';
import { useFriends } from '../../hooks/useFriends';
import { useProfiles } from '../../hooks/useProfiles';
import { showAlert } from '../../lib/alert';
import { GroupsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<GroupsStackParamList, 'MemberDetail'>;

export function MemberDetailScreen({ route }: Props) {
  const { uid, isOwner, isAdmin } = route.params;
  const profile = useProfile();
  const colors = useColors();
  const t = useT();
  const profiles = useProfiles([uid]);
  const friends = useFriends();
  const [adding, setAdding] = useState(false);

  const member = profiles.get(uid);
  const isSelf = uid === profile.uid;
  const isFriend = friends.some((f) => f.uid === uid);

  const onAddFriend = async () => {
    if (!member) return;
    setAdding(true);
    try {
      await addFriend(profile.uid, member);
    } catch (e: any) {
      showAlert(t.error, e.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Avatar avatarId={member?.avatarId} size={80} />
        <Text style={[styles.name, { color: colors.text }]}>{isSelf ? 'You' : (member?.nickname ?? '…')}</Text>
        {member?.phone ? (
          <Text style={[styles.phone, { color: colors.textSecondary }]}>{member.phone}</Text>
        ) : null}
        <View style={styles.badges}>
          {isOwner && (
            <View style={[styles.badge, { backgroundColor: colors.warning + '22' }]}>
              <Text style={[styles.badgeText, { color: colors.warning }]}>{t.owner}</Text>
            </View>
          )}
          {isAdmin && !isOwner && (
            <View style={[styles.badge, { backgroundColor: colors.primary + '22' }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{t.admin}</Text>
            </View>
          )}
        </View>
      </View>

      {!isSelf && (
        <View style={styles.actions}>
          {isFriend ? (
            <Text style={[styles.alreadyFriends, { color: colors.textSecondary }]}>{t.alreadyFriends}</Text>
          ) : (
            <Button title={t.addFriend} onPress={onAddFriend} loading={adding} disabled={!member} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  card: { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: 'center', gap: 8 },
  name: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  phone: { fontSize: 15, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  actions: { marginTop: 24 },
  alreadyFriends: { textAlign: 'center', fontSize: 15, fontWeight: '600' },
});
