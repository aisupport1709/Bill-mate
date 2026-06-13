import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { signUp } from '../../api/auth';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useColors, useT } from '../../context/SettingsContext';
import { showAlert } from '../../lib/alert';
import { AVATARS } from '../../lib/avatars';
import { isValidPhone } from '../../lib/phone';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const colors = useColors();
  const t = useT();
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [avatarId, setAvatarId] = useState(0);
  const [loading, setLoading] = useState(false);

  const onSignUp = async () => {
    if (!isValidPhone(phone)) { showAlert(t.invalidPhone, t.invalidPhoneMsg); return; }
    if (nickname.trim().length < 1) { showAlert(t.nicknameRequired, t.nicknameRequiredMsg); return; }
    if (password.length < 6) { showAlert(t.weakPassword, t.weakPasswordMsg); return; }
    setLoading(true);
    try {
      await signUp({ phone, password, nickname, avatarId });
    } catch (e: any) {
      showAlert(t.signUpFailed, e.message);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text }]}>{t.createAccountTitle}</Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>{t.pickAvatar}</Text>
        <View style={styles.avatarGrid}>
          {AVATARS.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setAvatarId(i)} style={[styles.avatarCell, { borderColor: i === avatarId ? colors.primary : 'transparent' }]}>
              <Avatar avatarId={i} size={44} />
            </TouchableOpacity>
          ))}
        </View>

        <Input label={`${t.phoneNumber} (${t.login.toLowerCase()})`} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0901 234 567" autoCapitalize="none" />
        <Input label={t.nickname} value={nickname} onChangeText={setNickname} placeholder={t.nicknamePlaceholder} maxLength={30} />
        <Input label={t.passwordMin} value={password} onChangeText={setPassword} secureTextEntry placeholder={t.createPasswordPlaceholder} />

        <Button title={t.signUp} onPress={onSignUp} loading={loading} disabled={!phone || !nickname || !password} />

        <TouchableOpacity style={styles.link} onPress={() => navigation.goBack()}>
          <Text style={[styles.linkText, { color: colors.textSecondary }]}>
            {t.alreadyHaveAccount} <Text style={[styles.linkBold, { color: colors.primary }]}>{t.login}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  avatarCell: { padding: 3, borderRadius: 28, borderWidth: 2 },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 15 },
  linkBold: { fontWeight: '700' },
});
