import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { logIn } from '../../api/auth';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useColors, useT } from '../../context/SettingsContext';
import { showAlert } from '../../lib/alert';
import { isValidPhone } from '../../lib/phone';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const colors = useColors();
  const t = useT();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!isValidPhone(phone)) {
      showAlert(t.invalidPhone, t.invalidPhoneMsg);
      return;
    }
    setLoading(true);
    try {
      await logIn(phone, password);
    } catch (e: any) {
      showAlert(t.loginFailed, e.message);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>💸</Text>
        <Text style={[styles.title, { color: colors.text }]}>Bill Mate</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.appTagline}</Text>

        <Input label={t.phoneNumber} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0901 234 567" autoCapitalize="none" />
        <Input label={t.password} value={password} onChangeText={setPassword} secureTextEntry placeholder={t.yourPassword} />

        <Button title={t.login} onPress={onLogin} loading={loading} disabled={!phone || !password} />

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('SignUp')}>
          <Text style={[styles.linkText, { color: colors.textSecondary }]}>
            {t.newHere} <Text style={[styles.linkBold, { color: colors.primary }]}>{t.createAccount}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 32, marginTop: 4 },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 15 },
  linkBold: { fontWeight: '700' },
});
