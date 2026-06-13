import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { changeMyPassword } from '../../api/auth';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useColors, useT } from '../../context/SettingsContext';
import { showAlert } from '../../lib/alert';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({ navigation }: Props) {
  const colors = useColors();
  const t = useT();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    if (next.length < 6) { showAlert(t.weakPassword, t.weakPasswordMsg); return; }
    if (next !== confirm) { showAlert(t.passwordsNoMatch); return; }
    setLoading(true);
    try {
      await changeMyPassword(current, next);
      showAlert(t.passwordChanged, '', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      showAlert(t.couldNotChangePassword, e.message);
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Input label={t.currentPassword} value={current} onChangeText={setCurrent} secureTextEntry autoFocus />
      <Input label={t.newPassword} value={next} onChangeText={setNext} secureTextEntry />
      <Input label={t.confirmPassword} value={confirm} onChangeText={setConfirm} secureTextEntry />
      <Button title={t.changePasswordBtn} onPress={onSave} loading={loading} disabled={!current || !next || !confirm} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
});
