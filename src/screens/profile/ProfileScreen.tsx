import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { logOut, resetPasswordForPhone, updateMyProfile } from '../../api/auth';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useProfile } from '../../context/AuthContext';
import { useColors, useSettings, useT } from '../../context/SettingsContext';
import { showAlert } from '../../lib/alert';
import { AVATARS } from '../../lib/avatars';
import { normalizePhone } from '../../lib/phone';
import { Language } from '../../lib/i18n';
import { ThemeMode } from '../../lib/theme';
import { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

const ADMIN_PHONE = '0904310992';

function OptionPicker<T extends string>({ options, value, onSelect, colors }: {
  options: { value: T; label: string }[];
  value: T;
  onSelect: (v: T) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.optionRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.optionBtn, { borderColor: opt.value === value ? colors.primary : colors.border, backgroundColor: opt.value === value ? colors.primary + '18' : colors.card }]}
          onPress={() => onSelect(opt.value)}
        >
          <Text style={[styles.optionText, { color: opt.value === value ? colors.primary : colors.textSecondary }]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const profile = useProfile();
  const colors = useColors();
  const t = useT();
  const { language, themeMode, setLanguage, setThemeMode } = useSettings();
  const [nickname, setNickname] = useState(profile.nickname);
  const [avatarId, setAvatarId] = useState(profile.avatarId);
  const [saving, setSaving] = useState(false);
  const [resetPhone, setResetPhone] = useState('');
  const [resetting, setResetting] = useState(false);

  const dirty = nickname.trim() !== profile.nickname || avatarId !== profile.avatarId;
  const isAdmin = normalizePhone(profile.phone) === normalizePhone(ADMIN_PHONE);

  const onSave = async () => {
    if (nickname.trim().length < 1) { showAlert(t.nicknameRequired); return; }
    setSaving(true);
    try {
      await updateMyProfile({ nickname: nickname.trim(), avatarId });
    } catch (e: any) {
      showAlert(t.couldNotSaveProfile, e.message);
    } finally {
      setSaving(false);
    }
  };

  const onResetPassword = async () => {
    if (!resetPhone.trim()) return;
    setResetting(true);
    try {
      await resetPasswordForPhone(resetPhone.trim());
      showAlert(t.adminResetDone, t.adminResetDoneMsg(resetPhone.trim()));
      setResetPhone('');
    } catch (e: any) {
      showAlert(t.error, e.message);
    } finally {
      setResetting(false);
    }
  };

  const onLogout = () => {
    showAlert(t.logout, t.logoutConfirm, [
      { text: t.cancel, style: 'cancel' },
      { text: t.logout, style: 'destructive', onPress: () => logOut() },
    ]);
  };

  const langOptions: { value: Language; label: string }[] = [
    { value: 'vi', label: '🇻🇳 Tiếng Việt' },
    { value: 'en', label: '🇬🇧 English' },
  ];
  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: `☀️ ${t.themeLight}` },
    { value: 'dark', label: `🌙 ${t.themeDark}` },
    { value: 'auto', label: `✨ ${t.themeAuto}` },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Avatar avatarId={avatarId} size={72} />
        <Text style={[styles.name, { color: colors.text }]}>{profile.nickname}</Text>
        <Text style={[styles.phone, { color: colors.textSecondary }]}>{profile.phone}</Text>
      </View>

      <Text style={[styles.section, { color: colors.textSecondary }]}>{t.editProfile}</Text>
      <View style={styles.avatarGrid}>
        {AVATARS.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => setAvatarId(i)} style={[styles.avatarCell, { borderColor: i === avatarId ? colors.primary : 'transparent' }]}>
            <Avatar avatarId={i} size={40} />
          </TouchableOpacity>
        ))}
      </View>
      <Input label={t.nickname} value={nickname} onChangeText={setNickname} maxLength={30} />
      <Button title={t.saveChanges} onPress={onSave} loading={saving} disabled={!dirty} />

      {/* Settings */}
      <Text style={[styles.section, { color: colors.textSecondary }]}>{t.settingsSection}</Text>
      <Text style={[styles.settingLabel, { color: colors.text }]}>{t.language}</Text>
      <OptionPicker options={langOptions} value={language} onSelect={setLanguage} colors={colors} />
      <Text style={[styles.settingLabel, { color: colors.text }]}>{t.theme}</Text>
      <OptionPicker options={themeOptions} value={themeMode} onSelect={setThemeMode} colors={colors} />

      {/* Account */}
      <Text style={[styles.section, { color: colors.textSecondary }]}>{t.account}</Text>
      <Button title={t.changePassword} variant="secondary" onPress={() => navigation.navigate('ChangePassword')} style={styles.gap} />
      <Button title={t.logout} variant="danger" onPress={onLogout} />

      {/* Admin */}
      {isAdmin && (
        <>
          <Text style={[styles.section, { color: colors.textSecondary }]}>{t.adminSection}</Text>
          <Input label={t.phoneNumber} value={resetPhone} onChangeText={setResetPhone} keyboardType="phone-pad" placeholder="0901 234 567" />
          <Button title={t.adminResetBtn} variant="secondary" onPress={onResetPassword} loading={resetting} disabled={!resetPhone.trim()} style={styles.gap} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 22, fontWeight: '800', marginTop: 10 },
  phone: { fontSize: 14, marginTop: 2 },
  section: { fontSize: 13, fontWeight: '700', marginTop: 28, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  avatarCell: { padding: 3, borderRadius: 26, borderWidth: 2 },
  gap: { marginBottom: 12 },
  settingLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  optionRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5 },
  optionText: { fontSize: 14, fontWeight: '600' },
});
