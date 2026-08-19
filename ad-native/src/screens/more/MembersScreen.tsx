import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/ui/Button';
import ListRow from '../../components/ui/ListRow';
import Border from '../../components/ui/Border';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppToast from '../../components/common/AppToast';
import RoleBadge from '../../components/common/RoleBadge';
import InviteSheet from '../../components/sheets/InviteSheet';
import JoinSheet from '../../components/sheets/JoinSheet';
import SheetModal from '../../components/sheets/SheetModal';
import EditProfileSheet from '../../components/sheets/EditProfileSheet';
import TossEmoji from '../../components/common/TossEmoji';
import { useTheme } from '../../lib/theme';
import { useHouseholdData } from '../../queries/useHouseholdData';
import { useAuthStore } from '../../stores/auth.store';
import { Icon } from '../../components/common/Icon';
import { TE } from '../../lib/toss-emoji';
import { useUpdateRole, useRemoveMember } from '../../queries/mutations';
import type { MemberRole } from '../../types/api';

const ROLE_OPTIONS: { key: MemberRole; label: string }[] = [
  { key: 'OWNER', label: '소유자' },
  { key: 'EDITOR', label: '편집자' },
  { key: 'VIEWER', label: '조회자' },
];

export default function MembersScreen() {
  const theme = useTheme();
  const data = useHouseholdData();
  const myRole = useAuthStore((s) => s.currentHousehold?.role);
  const user = useAuthStore((s) => s.user);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [rolePicker, setRolePicker] = useState<{ memberId: string; currentRole: MemberRole } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [toast, setToast] = useState('');
  const updateRole = useUpdateRole();
  const removeMember = useRemoveMember();
  const isOwner = myRole === 'OWNER';

  async function handleRoleChange(role: MemberRole) {
    if (!rolePicker || updateRole.isPending) return;
    try {
      await updateRole.mutateAsync({ userId: Number(rolePicker.memberId), role });
      setToast('역할을 변경했어요');
    } catch {
      setToast('역할 변경에 실패했어요');
    } finally {
      setRolePicker(null);
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    try {
      await removeMember.mutateAsync(Number(removeTarget.id));
      setToast(`${removeTarget.name}님을 내보냈어요`);
    } catch {
      setToast('내보내기에 실패했어요');
    } finally {
      setRemoveTarget(null);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>우리집 자산을 함께 기록·조회하는 멤버들이에요.</Text>

        {data.members.map((m, idx) => {
          const isMe = m.id === String(user?.id);
          return (
            <View key={m.id}>
              <ListRow
                left={
                  <View style={[styles.avatar, { backgroundColor: m.avatar }]}>
                    <Text style={styles.avatarText}>{m.initial}</Text>
                  </View>
                }
                contents={<Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{m.name}</Text>}
                right={
                  <View style={styles.rightWrap}>
                    <RoleBadge role={m.role as MemberRole} />
                    {isMe && (
                      <Pressable style={[styles.roleBtn, { borderColor: theme.border }]} onPress={() => setEditProfileOpen(true)}>
                        <TossEmoji code={TE.pencil} size={14} />
                      </Pressable>
                    )}
                    {isOwner && m.role !== 'OWNER' && (
                      <>
                        <Pressable style={[styles.roleBtn, { borderColor: theme.border }]} onPress={() => setRolePicker({ memberId: m.id, currentRole: m.role as MemberRole })}>
                          {Icon.chevronDown(theme.textMuted, 14)}
                        </Pressable>
                        <Pressable style={[styles.removeBtn, { borderColor: theme.danger }]} onPress={() => setRemoveTarget({ id: m.id, name: m.name })}>
                          <Text style={{ color: theme.danger, fontSize: 11, fontWeight: '700' }}>내보내기</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                }
                verticalPadding="small"
              />
              {idx < data.members.length - 1 && <Border type="full" />}
            </View>
          );
        })}

        <Border type="full" height={16} />

        {isOwner ? (
          <View style={styles.actions}>
            <Button display="full" size="big" type="primary" onPress={() => setInviteOpen(true)}>
              + 멤버 초대하기
            </Button>
            <View style={{ marginTop: 8 }}>
              <Button display="full" size="big" type="primary" style="weak" leftAccessory={<TossEmoji code={TE.link} size={16} />} onPress={() => setJoinOpen(true)}>
                초대 코드로 합류하기
              </Button>
            </View>
            <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: 'center', marginTop: 10 }}>초대장은 7일간 유효해요. 만료 전에 합류해야 해요.</Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <Button display="full" size="big" type="primary" style="weak" onPress={() => setJoinOpen(true)}>
              초대 코드로 합류하기
            </Button>
            <View style={[styles.lockBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <TossEmoji code={TE.lock} size={24} />
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 6, textAlign: 'center' }}>멤버 초대·관리는 소유자만 가능해요</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <InviteSheet visible={inviteOpen} onClose={() => setInviteOpen(false)} />
      <JoinSheet visible={joinOpen} onClose={() => setJoinOpen(false)} />
      <EditProfileSheet visible={editProfileOpen} onClose={() => setEditProfileOpen(false)} onSaved={() => setToast('프로필을 수정했어요')} />

      <SheetModal visible={!!rolePicker} onClose={() => setRolePicker(null)} header="역할 변경">
        {ROLE_OPTIONS.filter((o) => o.key !== 'OWNER').map((opt) => (
          <ListRow
            key={opt.key}
            contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>{opt.label}</Text>}
            right={rolePicker?.currentRole === opt.key ? Icon.check(theme.brand, 16) : undefined}
            onPress={() => handleRoleChange(opt.key)}
            verticalPadding="small"
          />
        ))}
      </SheetModal>

      <ConfirmDialog
        visible={!!removeTarget}
        title="멤버를 내보낼까요?"
        description={removeTarget ? `${removeTarget.name}님이 이 가구에서 제외돼요.` : undefined}
        confirmText="내보내기"
        danger
        loading={removeMember.isPending}
        onConfirm={confirmRemove}
        onClose={() => setRemoveTarget(null)}
      />
      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  subtitle: { fontSize: 12.5, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  rightWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  removeBtn: { paddingHorizontal: 8, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actions: { paddingHorizontal: 20, paddingTop: 12 },
  lockBox: { borderWidth: 1, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
});
