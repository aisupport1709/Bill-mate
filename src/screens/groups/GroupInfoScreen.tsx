import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { addFriend } from '../../api/friends';
import { addMemberToGroup, assignAdminRole, leaveGroup, listenGroup, removeMemberFromGroup, updateGroupInfo } from '../../api/groups';
import { getUserByPhone } from '../../api/users';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useProfile } from '../../context/AuthContext';
import { useColors, useT } from '../../context/SettingsContext';
import { showAlert } from '../../lib/alert';
import { useFriends } from '../../hooks/useFriends';
import { useProfiles } from '../../hooks/useProfiles';
import { displayGroupCode } from '../../lib/groupCode';
import { isValidPhone } from '../../lib/phone';
import { notifyUsers } from '../../lib/push';
import { GROUP_COLORS, GROUP_EMOJIS } from '../../lib/theme';
import { GroupsStackParamList } from '../../navigation/types';
import { Group, UserProfile } from '../../types/models';

type Props = NativeStackScreenProps<GroupsStackParamList, 'GroupInfo'>;

export function GroupInfoScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const profile = useProfile();
  const colors = useColors();
  const t = useT();
  const [group, setGroup] = useState<Group | null>(null);
  const [phone, setPhone] = useState('');
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit state (admin only)
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editColor, setEditColor] = useState('');
  const [saving, setSaving] = useState(false);

  const members = useProfiles(group?.memberIds ?? []);
  const friends = useFriends();

  useEffect(() => listenGroup(groupId, (g) => {
    setGroup(g);
    if (g && !editName) {
      setEditName(g.name);
      setEditEmoji(g.emoji);
      setEditColor(g.color);
    }
  }), [groupId]);

  useEffect(() => {
    if (!group) return;
    const adminIds: string[] = group.adminIds ?? [group.createdBy];
    navigation.setOptions({
      title: adminIds.includes(profile.uid) ? t.manageGroup : t.invitePlus,
    });
  }, [group, navigation, profile.uid, t]);

  if (!group) return <View style={[styles.container, { backgroundColor: colors.background }]} />;

  const adminIds: string[] = group.adminIds ?? [group.createdBy];
  const isAdmin = adminIds.includes(profile.uid);
  const editDirty = editName.trim() !== group.name || editEmoji !== group.emoji || editColor !== group.color;

  // ── Share code ───────────────────────────────────────────────
  const onCopy = async () => {
    await Clipboard.setStringAsync(group.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onShare = async () => {
    const message = `Join my group "${group.name}" on Bill Mate! 💸\nGroup code: ${group.id}`;
    if (Platform.OS === 'web' && navigator.share) {
      await navigator.share({ text: message });
    } else if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(group.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      await Share.share({ message });
    }
  };

  // ── Invite ────────────────────────────────────────────────────
  const invite = async (user: UserProfile) => {
    if (group.memberIds.includes(user.uid)) {
      showAlert(t.alreadyMember, t.alreadyMemberMsg(user.nickname));
      return;
    }
    await addMemberToGroup(group.id, profile, user);
    await addFriend(profile.uid, user);
    notifyUsers([user.uid], 'Bill Mate', `${profile.nickname} added you to "${group.name}"`);
    setPhone('');
  };

  const onInviteByPhone = async () => {
    if (!isValidPhone(phone)) { showAlert(t.invalidPhone, t.invalidPhoneMsg); return; }
    setInviting(true);
    try {
      const user = await getUserByPhone(phone);
      if (!user) showAlert(t.notFound, t.notFoundMsg);
      else await invite(user);
    } catch (e: any) { showAlert(t.error, e.message); }
    finally { setInviting(false); }
  };

  // ── Admin: save group info ────────────────────────────────────
  const onSaveGroup = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateGroupInfo(group.id, profile, { name: editName, emoji: editEmoji, color: editColor });
    } catch (e: any) {
      showAlert(t.couldNotUpdateGroup, e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Admin: remove member ──────────────────────────────────────
  const onRemoveMember = (uid: string, nickname: string) => {
    if (uid === profile.uid) {
      showAlert(t.cannotRemoveSelf, t.cannotRemoveSelfMsg);
      return;
    }
    showAlert(t.removeMember, t.removeMemberConfirm(nickname), [
      { text: t.cancel, style: 'cancel' },
      { text: t.remove, style: 'destructive', onPress: async () => {
        try {
          await removeMemberFromGroup(group.id, profile, uid, nickname);
        } catch (e: any) { showAlert(t.error, e.message); }
      }},
    ]);
  };

  // ── Admin: toggle admin role ──────────────────────────────────
  const onToggleAdmin = (uid: string, nickname: string) => {
    const isCurrentlyAdmin = adminIds.includes(uid);
    if (isCurrentlyAdmin && adminIds.length <= 1) {
      showAlert(t.cannotRemoveLastAdmin, t.cannotRemoveLastAdminMsg);
      return;
    }
    const confirmMsg = isCurrentlyAdmin ? t.removeAdminConfirm(nickname) : t.assignAdminConfirm(nickname);
    const btnLabel = isCurrentlyAdmin ? t.removeAdmin : t.makeAdmin;
    showAlert(btnLabel, confirmMsg, [
      { text: t.cancel, style: 'cancel' },
      { text: btnLabel, onPress: async () => {
        try {
          await assignAdminRole(group.id, profile, uid, nickname, !isCurrentlyAdmin);
        } catch (e: any) { showAlert(t.error, e.message); }
      }},
    ]);
  };

  // ── Leave ─────────────────────────────────────────────────────
  const onLeave = () => {
    showAlert(t.leaveGroup, t.leaveGroupConfirm(group.name), [
      { text: t.cancel, style: 'cancel' },
      { text: t.leave, style: 'destructive', onPress: async () => {
        await leaveGroup(group.id, profile);
        navigation.popToTop();
      }},
    ]);
  };

  const friendSuggestions = friends.filter((f) => !group.memberIds.includes(f.uid));

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* Group code card */}
      <View style={[styles.codeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>{t.groupCodeLabel}</Text>
        <Text style={[styles.code, { color: colors.text }]}>{displayGroupCode(group.id)}</Text>
        <View style={styles.codeActions}>
          <Button title={copied ? t.copied : t.copy} variant="secondary" onPress={onCopy} style={styles.codeBtn} />
          <Button title={t.share} onPress={onShare} style={styles.codeBtn} />
        </View>
        <Text style={[styles.codeHint, { color: colors.textSecondary }]}>{t.groupCodeHint}</Text>
      </View>

      {/* Admin: edit group info */}
      {isAdmin && (
        <>
          <Text style={[styles.section, { color: colors.textSecondary }]}>{t.groupSettings}</Text>
          <View style={[styles.editCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Input label={t.editGroupName} value={editName} onChangeText={setEditName} maxLength={40} />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.editGroupIcon}</Text>
            <View style={styles.emojiRow}>
              {GROUP_EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiCell, { backgroundColor: e === editEmoji ? colors.primary + '22' : colors.background, borderColor: e === editEmoji ? colors.primary : colors.border }]}
                  onPress={() => setEditEmoji(e)}
                >
                  <Text style={styles.emoji}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.editGroupColor}</Text>
            <View style={styles.colorRow}>
              {GROUP_COLORS.map((c) => (
                <TouchableOpacity key={c} style={[styles.colorCell, { backgroundColor: c, borderColor: c === editColor ? colors.text : 'transparent' }]} onPress={() => setEditColor(c)} />
              ))}
            </View>
            <Button title={t.saveGroup} onPress={onSaveGroup} loading={saving} disabled={!editDirty || !editName.trim()} style={styles.saveBtn} />
          </View>
        </>
      )}

      {/* Invite by phone */}
      <Text style={[styles.section, { color: colors.textSecondary }]}>{t.inviteByPhone}</Text>
      <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder={t.friendPhonePlaceholder} />
      <Button title={t.addToGroup} onPress={onInviteByPhone} loading={inviting} disabled={!phone} />

      {friendSuggestions.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendRow}>
          {friendSuggestions.map((f) => (
            <TouchableOpacity key={f.uid} style={[styles.friendChip, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => invite(f)}>
              <Avatar avatarId={f.avatarId} size={28} />
              <Text style={[styles.friendName, { color: colors.text }]}>{f.nickname}</Text>
              <Text style={[styles.friendAdd, { color: colors.primary }]}>＋</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Members list */}
      <Text style={[styles.section, { color: colors.textSecondary }]}>{t.membersCount(group.memberIds.length)}</Text>
      <View style={[styles.memberCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {group.memberIds.map((uid, idx) => {
          const m = members.get(uid);
          const nickname = uid === profile.uid ? 'You' : (m?.nickname ?? '…');
          const isCreator = uid === group.createdBy;
          const isMemberAdmin = adminIds.includes(uid);
          const isLast = idx === group.memberIds.length - 1;
          return (
            <View key={uid} style={[styles.memberRow, { borderColor: colors.border, borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth }]}>
              <Avatar avatarId={m?.avatarId} size={36} />
              <View style={styles.memberBody}>
                <View style={styles.memberNameRow}>
                  <Text style={[styles.memberName, { color: colors.text }]}>{nickname}</Text>
                  {isCreator && <View style={[styles.badge, { backgroundColor: colors.warning + '22' }]}><Text style={[styles.badgeText, { color: colors.warning }]}>{t.owner}</Text></View>}
                  {isMemberAdmin && !isCreator && <View style={[styles.badge, { backgroundColor: colors.primary + '22' }]}><Text style={[styles.badgeText, { color: colors.primary }]}>{t.admin}</Text></View>}
                </View>
                <Text style={[styles.memberPhone, { color: colors.textSecondary }]}>{m?.phone ?? ''}</Text>
              </View>
              {/* Admin actions on other members */}
              {isAdmin && uid !== profile.uid && (
                <View style={styles.memberActions}>
                  <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.primary }]} onPress={() => onToggleAdmin(uid, m?.nickname ?? uid)}>
                    <Text style={[styles.actionText, { color: colors.primary }]}>{isMemberAdmin ? '★' : '☆'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.danger }]} onPress={() => onRemoveMember(uid, m?.nickname ?? uid)}>
                    <Text style={[styles.actionText, { color: colors.danger }]}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <Button title={t.leaveGroup} variant="danger" onPress={onLeave} style={styles.leave} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  section: { fontSize: 13, fontWeight: '700', marginTop: 28, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  // Code card
  codeCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center' },
  codeLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  code: { fontSize: 36, fontWeight: '800', letterSpacing: 2, marginVertical: 10 },
  codeActions: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  codeBtn: { flex: 1 },
  codeHint: { fontSize: 12, marginTop: 12, textAlign: 'center' },
  // Edit card
  editCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginTop: 8, marginBottom: 6 },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  emojiCell: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  emoji: { fontSize: 22 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  colorCell: { width: 36, height: 36, borderRadius: 18, borderWidth: 3 },
  saveBtn: { marginTop: 8 },
  // Friend chips
  friendRow: { marginTop: 12 },
  friendChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 10, marginRight: 8, gap: 6 },
  friendName: { fontSize: 14, fontWeight: '600' },
  friendAdd: { fontSize: 16, fontWeight: '700' },
  // Members
  memberCard: { borderRadius: 14, borderWidth: 1 },
  memberRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  memberBody: { flex: 1 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  memberName: { fontSize: 15, fontWeight: '600' },
  memberPhone: { fontSize: 13, marginTop: 1 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  memberActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 14, fontWeight: '700' },
  leave: { marginTop: 32 },
});
