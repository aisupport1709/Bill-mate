import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { addFriend, removeFriend } from '../../api/friends';
import { getUserByPhone } from '../../api/users';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Input } from '../../components/Input';
import { useProfile } from '../../context/AuthContext';
import { useColors, useT } from '../../context/SettingsContext';
import { showAlert } from '../../lib/alert';
import { useFriends } from '../../hooks/useFriends';
import { isValidPhone } from '../../lib/phone';

export function FriendsScreen() {
  const profile = useProfile();
  const colors = useColors();
  const t = useT();
  const friends = useFriends();
  const [phone, setPhone] = useState('');
  const [adding, setAdding] = useState(false);

  const onAdd = async () => {
    if (!isValidPhone(phone)) { showAlert(t.invalidPhone, t.invalidPhoneMsg); return; }
    setAdding(true);
    try {
      const user = await getUserByPhone(phone);
      if (!user) showAlert(t.notFound, t.notFoundFriend);
      else if (user.uid === profile.uid) showAlert(t.thatsYou, t.thatsYouMsg);
      else { await addFriend(profile.uid, user); setPhone(''); }
    } catch (e: any) { showAlert(t.error, e.message); }
    finally { setAdding(false); }
  };

  const onRemove = (uid: string, nickname: string) => {
    showAlert(t.removeFriend, t.removeFriendMsg(nickname), [
      { text: t.cancel, style: 'cancel' },
      { text: t.remove, style: 'destructive', onPress: () => removeFriend(profile.uid, uid) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.addBox}>
        <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder={t.friendPhonePlaceholder} />
        <Button title={t.addFriend} onPress={onAdd} loading={adding} disabled={!phone} />
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {friends.length === 0 && <EmptyState emoji="🤝" title={t.noFriendsTitle} subtitle={t.noFriendsSubtitle} />}
        {friends.map((item) => (
          <View key={item.uid} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Avatar avatarId={item.avatarId} size={40} />
            <View style={styles.body}>
              <Text style={[styles.name, { color: colors.text }]}>{item.nickname}</Text>
              <Text style={[styles.phone, { color: colors.textSecondary }]}>{item.phone}</Text>
            </View>
            <TouchableOpacity style={[styles.removeBtn, { borderColor: colors.danger }]} onPress={() => onRemove(item.uid, item.nickname)}>
              <Text style={[styles.removeText, { color: colors.danger }]}>{t.remove}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addBox: { padding: 16, paddingBottom: 8 },
  list: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8, gap: 12 },
  body: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  phone: { fontSize: 13, marginTop: 1 },
  removeBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
  removeText: { fontSize: 13, fontWeight: '600' },
});
