import React, { useState } from 'react';
import { createRoute } from '@granite-js/react-native';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, ListRow, Border } from '@toss/tds-react-native';
import ScreenHeader from '../../components/common/ScreenHeader';
import RoleBadge from '../../components/common/RoleBadge';
import InviteSheet from '../../components/sheets/InviteSheet';
import JoinSheet from '../../components/sheets/JoinSheet';
import PickerSheet from '../../components/sheets/PickerSheet';
import TossEmoji from '../../components/common/TossEmoji';
import { useTheme } from '../../lib/theme';
import { useDataSource, useMockRole } from '../../lib/data-source';
import { Icon } from '../../components/common/Icon';
import { TE } from '../../lib/toss-emoji';
import { useUpdateRole, useRemoveMember } from '../../queries/mutations';
import type { MemberRole } from '../../types/api';

const ROLE_OPTIONS: { key: MemberRole; label: string }[] = [
  { key: 'OWNER',  label: '소유자' },
  { key: 'EDITOR', label: '편집자' },
  { key: 'VIEWER', label: '조회자' },
];

function MembersScreen() {
  const navigation = Route.useNavigation();
  const theme = useTheme();
  const data = useDataSource();
  const myRole = useMockRole();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [rolePicker, setRolePicker] = useState<{ memberId: string; currentRole: MemberRole } | null>(null);
  const updateRole = useUpdateRole();
  const removeMember = useRemoveMember();
  const isOwner = myRole === 'OWNER';

  async function handleRoleChange(role: MemberRole) {
    if (!rolePicker) return;
    try {
      await updateRole.mutateAsync({ userId: Number(rolePicker.memberId), role });
    } catch (e: any) {
      Alert.alert('오류', e?.message ?? '역할 변경에 실패했어요.');
    } finally { setRolePicker(null); }
  }

  async function handleRemove(memberId: string, name: string) {
    Alert.alert('멤버 내보내기', `${name}님을 내보낼까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '내보내기', style: 'destructive', onPress: async () => {
        try { await removeMember.mutateAsync(Number(memberId)); }
        catch (e: any) { Alert.alert('오류', e?.message ?? '내보내기에 실패했어요.'); }
      }},
    ]);
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScreenHeader title="멤버 관리" onBack={() => navigation?.goBack?.()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          우리집 자산을 함께 기록·조회하는 멤버들이에요.
        </Text>

        {/* 멤버 리스트 */}
        {data.members.map((m, idx) => (
          <React.Fragment key={m.id}>
            <ListRow
              left={
                <View style={[styles.avatar, { backgroundColor: m.avatar }]}>
                  <Text style={styles.avatarText}>{m.initial}</Text>
                </View>
              }
              contents={
                <View>
                  <Text style={[styles.memberName, { color: theme.text }]}>{m.name}</Text>
                  <Text style={[styles.memberJoined, { color: theme.textMuted }]}>{m.joined || '-'} 합류</Text>
                </View>
              }
              right={
                <View style={styles.rightWrap}>
                  <RoleBadge role={m.role as MemberRole} />
                  {isOwner && m.role !== 'OWNER' && (
                    <View style={styles.ownerActions}>
                      <TouchableOpacity
                        style={[styles.roleBtn, { borderColor: theme.border }]}
                        onPress={() => setRolePicker({ memberId: m.id, currentRole: m.role as MemberRole })}
                      >
                        {Icon.chevronDown(theme.textMuted, 14)}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.removeBtn, { borderColor: theme.danger }]}
                        onPress={() => handleRemove(m.id, m.name)}
                        disabled={removeMember.isPending}
                      >
                        <Text style={[styles.removeBtnText, { color: removeMember.isPending ? theme.textMuted : theme.danger }]}>
                          {removeMember.isPending ? '...' : '내보내기'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              }
              verticalPadding="small"
            />
            {idx < data.members.length - 1 && <Border type="full" />}
          </React.Fragment>
        ))}

        <Border type="height16" />

        {/* 액션 */}
        {isOwner ? (
          <View style={styles.actions}>
            <Button display="full" size="big" type="primary" onPress={() => setInviteOpen(true)}>
              + 멤버 초대하기
            </Button>
            <Button display="full" size="big" type="primary" style="weak" leftAccessory={<TossEmoji code={TE.link} size={16} />} onPress={() => setJoinOpen(true)}>
              초대 코드로 합류하기
            </Button>
            <Text style={[styles.helperText, { color: theme.textMuted }]}>
              초대장은 7일간 유효해요. 만료 전에 합류해야 해요.
            </Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <Button display="full" size="big" type="primary" style="weak" onPress={() => setJoinOpen(true)}>
              초대 코드로 합류하기
            </Button>
            <View style={[styles.lockBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <TossEmoji code={TE.lock} size={24} />
              <Text style={[styles.lockText, { color: theme.textMuted }]}>
                멤버 초대·관리는 소유자만 가능해요
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <InviteSheet visible={inviteOpen} onClose={() => setInviteOpen(false)} />
      <JoinSheet visible={joinOpen} onClose={() => setJoinOpen(false)} />

      {/* 역할 변경 피커 */}
      <PickerSheet visible={!!rolePicker} title="역할 변경" onClose={() => setRolePicker(null)}>
        {ROLE_OPTIONS.filter((o) => o.key !== 'OWNER').map((opt) => (
          <ListRow
            key={opt.key}
            contents={opt.label}
            right={rolePicker?.currentRole === opt.key ? Icon.check(theme.brand, 16) : undefined}
            onPress={() => handleRoleChange(opt.key)}
            verticalPadding="small"
            disabled={updateRole.isPending}
          />
        ))}
      </PickerSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  subtitle: { fontSize: 13, marginBottom: 8, lineHeight: 18, paddingHorizontal: 20, paddingTop: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  memberName: { fontSize: 15, fontWeight: '600' },
  memberJoined: { fontSize: 12, marginTop: 2 },
  rightWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ownerActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  roleBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  removeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  removeBtnText: { fontSize: 12, fontWeight: '600' },
  actions: { paddingHorizontal: 20, gap: 10, paddingBottom: 32 },
  helperText: { fontSize: 12, textAlign: 'center' },
  lockBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  lockText: { flex: 1, fontSize: 13 },
});

export const Route = createRoute('/more/members', {
  component: MembersScreen,
});
