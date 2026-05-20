import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../lib/theme';
import { useDataSource, useMockRole } from '../lib/data-source';
import { clearTokens } from '../lib/storage';
import { useAuthStore } from '../stores/auth.store';
import TossEmoji from '../components/common/TossEmoji';
import { Icon } from '../components/common/Icon';
import { TE } from '../lib/toss-emoji';

interface MenuRowProps {
  emojiCode: string;
  bgColor: string;
  label: string;
  detail: string;
  onPress: () => void;
}

function MenuRow({ emojiCode, bgColor, label, detail, onPress }: MenuRowProps) {
  const theme = useTheme();
  return (
    <TouchableOpacity style={[styles.menuRow, { borderBottomColor: theme.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconBox, { backgroundColor: bgColor }]}>
        <TossEmoji code={emojiCode} size={36} />
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.menuDetail, { color: theme.textMuted }]}>{detail}</Text>
      </View>
      {Icon.chevronRight(theme.textMuted, 18)}
    </TouchableOpacity>
  );
}

interface MoreScreenProps {
  navigation: any;
}

export default function MoreScreen({ navigation }: MoreScreenProps) {
  const theme = useTheme();
  const data = useDataSource();
  const role = useMockRole();
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    Alert.alert('로그아웃', '로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await clearTokens();
          logout();
        },
      },
    ]);
  }

  const owner = data.members.find((m) => m.role === 'OWNER');
  const memberCount = data.members.length;

  const menuItems = [
    {
      emojiCode: TE.people,
      bgColor: theme.dark ? '#1e2a40' : '#EBF5FB',
      label: '멤버 관리',
      detail: `${memberCount}명이 함께하고 있어요`,
      route: '/more/members',
    },
    {
      emojiCode: TE.money,
      bgColor: theme.dark ? '#1a2e28' : '#E8F8F5',
      label: '현금흐름',
      detail: '수입·지출·저축률 분석',
      route: '/more/cashflow',
    },
    {
      emojiCode: TE.chartBar,
      bgColor: theme.dark ? '#1a2340' : '#EEF2FF',
      label: '연간 비교',
      detail: '자산군별 증감 워터폴',
      route: '/more/compare',
    },
    {
      emojiCode: TE.folder,
      bgColor: theme.dark ? '#2a2010' : '#FEF9E7',
      label: '카테고리 관리',
      detail: '우리집만의 카테고리 설정',
      route: '/more/categories',
    },
    {
      emojiCode: TE.gear,
      bgColor: theme.dark ? '#221a2e' : '#F5EEF8',
      label: '설정',
      detail: '알림, 통화, 테마',
      route: '/more/settings',
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Household Banner */}
      <View style={[styles.banner, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={[styles.bannerEmoji, { backgroundColor: theme.brandSoft }]}>
          <TossEmoji code={TE.house} size={36} />
        </View>
        <View style={styles.bannerText}>
          <Text style={[styles.bannerName, { color: theme.text }]}>우리집</Text>
          <Text style={[styles.bannerSub, { color: theme.textMuted }]}>
            {memberCount}명 · {owner?.name ?? '-'} 님이 소유
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {}}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.refreshBtn}
        >
          {Icon.refresh(theme.textMuted, 20)}
        </TouchableOpacity>
      </View>

      {/* Role Badge */}
      {role !== 'OWNER' && (
        <View style={[styles.roleNotice, { backgroundColor: theme.brandSoft }]}>
          <Text style={[styles.roleNoticeText, { color: theme.brand }]}>
            {role === 'EDITOR' ? '편집자' : '조회자'} 권한으로 접속 중이에요
          </Text>
        </View>
      )}

      {/* Menu */}
      <View style={[styles.menuCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {menuItems.map((item) => (
          <MenuRow
            key={item.route}
            emojiCode={item.emojiCode}
            bgColor={item.bgColor}
            label={item.label}
            detail={item.detail}
            onPress={() => navigation?.navigate?.(item.route)}
          />
        ))}
      </View>

      {/* Logout */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={[styles.logoutText, { color: theme.danger }]}>로그아웃</Text>
        </TouchableOpacity>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>자산일기 v1.0 · Apps-in-Toss</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  bannerEmoji: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bannerText: { flex: 1 },
  bannerName: { fontSize: 18, fontWeight: '700' },
  bannerSub: { fontSize: 13, marginTop: 2 },
  refreshBtn: { padding: 4 },
  roleNotice: { marginHorizontal: 20, marginTop: 12, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  roleNoticeText: { fontSize: 13, fontWeight: '600' },
  menuCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600' },
  menuDetail: { fontSize: 12, marginTop: 2 },
  footer: { alignItems: 'center', paddingVertical: 32, gap: 16 },
  logoutBtn: { paddingVertical: 8, paddingHorizontal: 24 },
  logoutText: { fontSize: 14, fontWeight: '600' },
  footerText: { fontSize: 12 },
});
