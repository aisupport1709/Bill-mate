import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createGroup } from '../../api/groups';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useProfile } from '../../context/AuthContext';
import { useColors, useT } from '../../context/SettingsContext';
import { showAlert } from '../../lib/alert';
import { GROUP_COLORS, GROUP_EMOJIS } from '../../lib/theme';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateGroup'>;

export function CreateGroupScreen({ navigation }: Props) {
  const profile = useProfile();
  const colors = useColors();
  const t = useT();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(GROUP_EMOJIS[0]);
  const [color, setColor] = useState(GROUP_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const onCreate = async () => {
    setLoading(true);
    try {
      const group = await createGroup(profile, { name, emoji, color });
      navigation.replace('GroupDetail', { groupId: group.id });
    } catch (e: any) {
      showAlert(t.couldNotCreate, e.message);
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Input label={t.groupName} value={name} onChangeText={setName} placeholder={t.groupNamePlaceholder} maxLength={40} autoFocus />

      <Text style={[styles.label, { color: colors.textSecondary }]}>{t.groupIcon}</Text>
      <View style={styles.row}>
        {GROUP_EMOJIS.map((e) => (
          <TouchableOpacity key={e} style={[styles.emojiCell, { backgroundColor: e === emoji ? colors.primary + '22' : colors.card, borderColor: e === emoji ? colors.primary : colors.border }]} onPress={() => setEmoji(e)}>
            <Text style={styles.emoji}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.textSecondary }]}>{t.groupColor}</Text>
      <View style={styles.row}>
        {GROUP_COLORS.map((c) => (
          <TouchableOpacity key={c} style={[styles.colorCell, { backgroundColor: c, borderColor: c === color ? colors.text : 'transparent' }]} onPress={() => setColor(c)} />
        ))}
      </View>

      <Button title={t.createGroupBtn} onPress={onCreate} loading={loading} disabled={!name.trim()} style={styles.create} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  emojiCell: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  emoji: { fontSize: 24 },
  colorCell: { width: 40, height: 40, borderRadius: 20, borderWidth: 3 },
  create: { marginTop: 8 },
});
