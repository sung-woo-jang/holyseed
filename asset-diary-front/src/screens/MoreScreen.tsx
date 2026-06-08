import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, ListHeader, ListRow, Border } from '@toss/tds-react-native';
import { useTheme } from '../lib/theme';
import { useDataSource, useMockRole } from '../lib/data-source';
import { clearTokens } from '../lib/storage';
import { useAuthStore } from '../stores/auth.store';
import TossEmoji from '../components/common/TossEmoji';
import { TE } from '../lib/toss-emoji';

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
      { text: '로그아웃', style: 'destructive', onPress: async () => { await clearTokens(); logout(); } },
    ]);
  }

  const owner = data.members.find((m) => m.role === 'OWNER');
  const memberCount = data.members.length;

  const menuItems = [
    { emojiCode: TE.people, bgColor: theme.dark ? '#1e2a40' : '#EBF5FB', label: '멤버 관리', detail: `${memberCount}명이 함께하고 있어요`, route: '/more/members' },
    { emojiCode: TE.money, bgColor: theme.dark ? '#1a2e28' : '#E8F8F5', label: '현금흐름', detail: '수입·지출·저축률 분석', route: '/more/cashflow' },
    { emojiCode: TE.chartBar, bgColor: theme.dark ? '#1a2340' : '#EEF2FF', label: '연간 비교', detail: '자산군별 증감 워터폴', route: '/more/compare' },
    { emojiCode: TE.folder, bgColor: theme.dark ? '#2a2010' : '#FEF9E7', label: '카테고리 관리', detail: '우리집만의 카테고리 설정', route: '/more/categories' },
    { emojiCode: TE.gear, bgColor: theme.dark ? '#221a2e' : '#F5EEF8', label: '설정', detail: '알림, 통화, 테마', route: '/more/settings' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Household Banner */}
      <ListHeader
        title={
          <ListHeader.TitleParagraph typography="t4">우리집</ListHeader.TitleParagraph>
        }
        lower={
          <ListHeader.DescriptionParagraph>
            {`${memberCount}명 · ${owner?.name ?? '-'} 님이 소유`}
          </ListHeader.DescriptionParagraph>
        }
        right={
          <View style={[styles.bannerIcon, { backgroundColor: theme.brandSoft }]}>
            <TossEmoji code={TE.house} size={32} />
          </View>
        }
      />

      <Border type="height16" />

      {/* Role Notice */}
      {role !== 'OWNER' && (
        <View style={[styles.roleNotice, { backgroundColor: theme.brandSoft }]}>
          <Text style={[styles.roleNoticeText, { color: theme.brand }]}>
            {role === 'EDITOR' ? '편집자' : '조회자'} 권한으로 접속 중이에요
          </Text>
        </View>
      )}

      {/* Menu */}
      {menuItems.map((item, idx) => (
        <React.Fragment key={item.route}>
          <ListRow
            left={
              <View style={[styles.menuIconBox, { backgroundColor: item.bgColor }]}>
                <TossEmoji code={item.emojiCode} size={28} />
              </View>
            }
            contents={
              <View>
                <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
                <Text style={[styles.menuDetail, { color: theme.textMuted }]}>{item.detail}</Text>
              </View>
            }
            withArrow
            onPress={() => navigation?.navigate?.(item.route)}
            verticalPadding="small"
          />
          {idx < menuItems.length - 1 && <Border type="full" />}
        </React.Fragment>
      ))}

      <Border type="height16" />

      {/* Logout */}
      <View style={styles.footer}>
        <Button display="full" size="big" type="danger" style="weak" onPress={handleLogout}>
          로그아웃
        </Button>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>자산일기 v1.0 · Apps-in-Toss</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bannerIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  roleNotice: { marginHorizontal: 20, marginBottom: 8, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  roleNoticeText: { fontSize: 13, fontWeight: '600' },
  menuIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '600' },
  menuDetail: { fontSize: 12, marginTop: 2 },
  footer: { paddingHorizontal: 20, paddingVertical: 32, gap: 16 },
  footerText: { fontSize: 12, textAlign: 'center' },
});
