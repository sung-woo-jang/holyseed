import React, { useState } from 'react';
import { createRoute } from '@granite-js/react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ScreenHeader from '../../components/common/ScreenHeader';
import RoleBadge from '../../components/common/RoleBadge';
import InviteSheet from '../../components/sheets/InviteSheet';
import JoinSheet from '../../components/sheets/JoinSheet';
import TossEmoji from '../../components/common/TossEmoji';
import { useTheme } from '../../lib/theme';
import { useDataSource, useMockRole } from '../../lib/data-source';
import { TE } from '../../lib/toss-emoji';
import type { MemberRole } from '../../types/api';

function MembersScreen({ navigation }: { navigation: any }) {
  const theme = useTheme();
  const data = useDataSource();
  const role = useMockRole();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const isOwner = role === 'OWNER';

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScreenHeader title="멤버 관리" onBack={() => navigation?.goBack?.()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            우리집 자산을 함께 기록·조회하는 멤버들이에요.
          </Text>
        </View>

        {/* 멤버 리스트 */}
        <View style={[styles.membersCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {data.members.map((m, idx) => (
            <View key={m.id} style={[styles.memberRow, { borderBottomColor: theme.border, borderBottomWidth: idx < data.members.length - 1 ? 1 : 0 }]}>
              <View style={[styles.avatar, { backgroundColor: m.avatar }]}>
                <Text style={styles.avatarText}>{m.initial}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: theme.text }]}>{m.name}</Text>
                <Text style={[styles.memberJoined, { color: theme.textMuted }]}>{m.joined} 합류</Text>
              </View>
              <RoleBadge role={m.role as MemberRole} />
            </View>
          ))}
        </View>

        {/* 액션 영역 */}
        {isOwner ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.brand }]}
              onPress={() => setInviteOpen(true)}
            >
              <Text style={styles.primaryBtnText}>+ 멤버 초대하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
              onPress={() => setJoinOpen(true)}
            >
              <Text style={[styles.secondaryBtnText, { color: theme.text }]}>🔗 초대 코드로 합류하기</Text>
            </TouchableOpacity>
            <Text style={[styles.helperText, { color: theme.textMuted }]}>
              초대장은 7일간 유효해요. 만료 전에 합류해야 해요.
            </Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
              onPress={() => setJoinOpen(true)}
            >
              <Text style={[styles.secondaryBtnText, { color: theme.text }]}>초대 코드로 합류하기</Text>
            </TouchableOpacity>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  subtitle: { fontSize: 13, marginBottom: 14, lineHeight: 18 },
  membersCard: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '600' },
  memberJoined: { fontSize: 12, marginTop: 2 },
  actions: { paddingHorizontal: 20, gap: 10, paddingBottom: 32 },
  primaryBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  secondaryBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1 },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },
  helperText: { fontSize: 12, textAlign: 'center' },
  lockBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  lockText: { flex: 1, fontSize: 13 },
});

export const Route = createRoute('/more/members', {
  component: MembersScreen,
});
