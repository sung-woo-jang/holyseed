import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import TossEmoji from '../../components/common/TossEmoji';
import Border from '../../components/ui/Border';
import Button from '../../components/ui/Button';
import ListHeader from '../../components/ui/ListHeader';
import ListRow from '../../components/ui/ListRow';
import { useHouseholdData } from '../../queries/useHouseholdData';
import { clearTokens } from '../../lib/storage';
import { useTheme } from '../../lib/theme';
import { TE } from '../../lib/toss-emoji';
import { useAuthStore } from '../../stores/auth.store';
import { useAppModeStore } from '../../stores/appMode.store';
import type { MoreStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MoreStackParamList, 'MoreHome'>;

export default function MoreHomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const data = useHouseholdData();
  const role = useAuthStore((s) => s.currentHousehold?.role);
  const logout = useAuthStore((s) => s.logout);
  const switchAppMode = useAppModeStore((s) => s.switchMode);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  async function handleLogout() {
    await clearTokens();
    logout();
  }

  const owner = data.members.find((m) => m.role === 'OWNER');
  const memberCount = data.members.length;

  const menuItems: { emojiCode: string; bgColor: string; label: string; detail: string; route: 'Members' | 'Cashflow' | 'Compare' | 'Categories' | 'Settings' }[] = [
    { emojiCode: TE.people, bgColor: theme.dark ? '#1e2a40' : '#EBF5FB', label: '멤버 관리', detail: `${memberCount}명이 함께하고 있어요`, route: 'Members' },
    { emojiCode: TE.money, bgColor: theme.dark ? '#1a2e28' : '#E8F8F5', label: '현금흐름', detail: '수입·지출·저축률 분석', route: 'Cashflow' },
    { emojiCode: TE.chartBar, bgColor: theme.dark ? '#1a2340' : '#EEF2FF', label: '연간 비교', detail: '자산군별 증감 워터폴', route: 'Compare' },
    { emojiCode: TE.folder, bgColor: theme.dark ? '#2a2010' : '#FEF9E7', label: '카테고리 관리', detail: '우리집만의 카테고리 설정', route: 'Categories' },
    { emojiCode: TE.gear, bgColor: theme.dark ? '#221a2e' : '#F5EEF8', label: '설정', detail: '알림, 통화, MCP 연동', route: 'Settings' },
  ];

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView>
        <ListHeader
          title={<ListHeader.TitleParagraph typography="t4">우리집</ListHeader.TitleParagraph>}
          lower={<ListHeader.DescriptionParagraph>{`${memberCount}명 · ${owner?.name ?? '-'} 님이 소유`}</ListHeader.DescriptionParagraph>}
          right={
            <View style={[styles.bannerIcon, { backgroundColor: theme.brandSoft }]}>
              <TossEmoji code={TE.house} size={32} />
            </View>
          }
        />

        <Border type="full" height={16} />

        {role && role !== 'OWNER' && (
          <View style={[styles.roleNotice, { backgroundColor: theme.brandSoft }]}>
            <Text style={{ color: theme.brand, fontSize: 13, fontWeight: '600' }}>{role === 'EDITOR' ? '편집자' : '조회자'} 권한으로 접속 중이에요</Text>
          </View>
        )}

        {menuItems.map((item, idx) => (
          <View key={item.route}>
            <ListRow
              left={
                <View style={[styles.menuIconBox, { backgroundColor: item.bgColor }]}>
                  <TossEmoji code={item.emojiCode} size={28} />
                </View>
              }
              contents={
                <View>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>{item.label}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{item.detail}</Text>
                </View>
              }
              withArrow
              onPress={() => navigation.navigate(item.route)}
              verticalPadding="small"
            />
            {idx < menuItems.length - 1 && <Border type="full" />}
          </View>
        ))}

        <Border type="full" height={16} />

        <ListRow
          left={
            <View style={[styles.menuIconBox, { backgroundColor: theme.dark ? '#1a2340' : '#EEF2FF' }]}>
              <TossEmoji code={TE.gamepad} size={28} />
            </View>
          }
          contents={
            <View>
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>Lab 모드로 전환</Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>라오어 · TQQQ VR · 근무일지</Text>
            </View>
          }
          withArrow
          onPress={() => switchAppMode('lab')}
          verticalPadding="small"
        />

        <Border type="full" height={16} />

        <View style={styles.footer}>
          <Button display="full" size="big" type="danger" style="weak" onPress={() => setLogoutConfirm(true)}>
            로그아웃
          </Button>
          <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', marginTop: 12 }}>자산일기 v1.0</Text>
        </View>
      </ScrollView>

      <ConfirmDialog visible={logoutConfirm} title="로그아웃" description="로그아웃 하시겠어요?" confirmText="로그아웃" danger onConfirm={handleLogout} onClose={() => setLogoutConfirm(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bannerIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  roleNotice: { marginHorizontal: 20, marginBottom: 8, padding: 10, borderRadius: 10 },
  menuIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: 20, paddingVertical: 16 },
});
