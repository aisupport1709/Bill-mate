import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getGroupPreview, joinGroup } from '../../api/groups';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useProfile } from '../../context/AuthContext';
import { useColors, useT } from '../../context/SettingsContext';
import { showAlert } from '../../lib/alert';
import { displayGroupCode, normalizeGroupCode } from '../../lib/groupCode';
import { RootStackParamList } from '../../navigation/types';
import { Group } from '../../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'JoinGroup'>;

export function JoinGroupScreen({ navigation }: Props) {
  const profile = useProfile();
  const colors = useColors();
  const t = useT();
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);

  const onPaste = async () => {
    const text = await Clipboard.getStringAsync();
    const pasted = normalizeGroupCode(text);
    if (pasted) { setCode(pasted); findGroup(pasted); }
  };

  const findGroup = async (raw: string) => {
    const normalized = normalizeGroupCode(raw);
    if (normalized.length < 8) { showAlert(t.invalidCode, t.invalidCodeMsg); return; }
    setLoading(true); setPreview(null);
    try {
      const group = await getGroupPreview(normalized);
      if (!group) showAlert(t.groupNotFound, t.groupNotFoundMsg);
      else if (group.memberIds.includes(profile.uid)) navigation.replace('GroupDetail', { groupId: group.id });
      else setPreview(group);
    } catch (e: any) { showAlert(t.error, e.message); }
    finally { setLoading(false); }
  };

  const onJoin = async () => {
    if (!preview) return;
    setJoining(true);
    try {
      await joinGroup(preview.id, profile);
      navigation.replace('GroupDetail', { groupId: preview.id });
    } catch (e: any) { showAlert(t.couldNotJoin, e.message); setJoining(false); }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={[styles.hint, { color: colors.textSecondary }]}>{t.joinGroupHint}</Text>
      <Input label={t.groupCode} value={code} onChangeText={(v) => { setCode(normalizeGroupCode(v)); setPreview(null); }} placeholder={t.groupCodePlaceholder} autoCapitalize="characters" autoCorrect={false} maxLength={9} autoFocus />
      <View style={styles.row}>
        <Button title={t.paste} variant="secondary" onPress={onPaste} style={styles.rowBtn} />
        <Button title={t.findGroup} onPress={() => findGroup(code)} loading={loading} disabled={!code} style={styles.rowBtn} />
      </View>
      {preview && (
        <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.groupIcon, { backgroundColor: preview.color }]}>
            <Text style={styles.groupEmoji}>{preview.emoji}</Text>
          </View>
          <Text style={[styles.previewName, { color: colors.text }]}>{preview.name}</Text>
          <Text style={[styles.previewMeta, { color: colors.textSecondary }]}>
            {preview.memberIds.length} {t.members}{preview.memberIds.length > 1 ? 's' : ''} · {displayGroupCode(preview.id)}
          </Text>
          <Button title={`${t.joinGroup} ${preview.name}`} onPress={onJoin} loading={joining} style={styles.joinBtn} />
          <TouchableOpacity onPress={() => setPreview(null)}>
            <Text style={[styles.cancel, { color: colors.textSecondary }]}>{t.notThisGroup}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  hint: { fontSize: 14, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12 },
  rowBtn: { flex: 1 },
  previewCard: { marginTop: 24, borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center' },
  groupIcon: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  groupEmoji: { fontSize: 28 },
  previewName: { fontSize: 20, fontWeight: '800', marginTop: 10 },
  previewMeta: { fontSize: 13, marginTop: 4, marginBottom: 16 },
  joinBtn: { alignSelf: 'stretch' },
  cancel: { marginTop: 14, fontSize: 14 },
});
