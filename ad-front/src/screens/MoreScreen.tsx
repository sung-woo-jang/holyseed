import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import ListHeader from '../components/ui/ListHeader';
import ListRow from '../components/ui/ListRow';
import Border from '../components/ui/Border';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useTheme } from '../lib/theme';
import { useDataSource, useMockRole } from '../lib/data-source';
import { clearTokens } from '../lib/storage';
import { useAuthStore } from '../stores/auth.store';
import TossEmoji from '../components/common/TossEmoji';
import { TE } from '../lib/toss-emoji';
import styles from './MoreScreen.module.css';

export default function MoreScreen() {
  const navigate = useNavigate();
  const theme = useTheme();
  const data = useDataSource();
  const role = useMockRole();
  const logout = useAuthStore((s) => s.logout);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  async function handleLogout() {
    await clearTokens();
    logout();
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
    <div className={styles.container} style={{ backgroundColor: theme.bg }}>
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
          <div className={styles.bannerIcon} style={{ backgroundColor: theme.brandSoft }}>
            <TossEmoji code={TE.house} size={32} />
          </div>
        }
      />

      <Border type="full" height={16} />

      {/* Role Notice */}
      {role !== 'OWNER' && (
        <div className={styles.roleNotice} style={{ backgroundColor: theme.brandSoft }}>
          <span className={styles.roleNoticeText} style={{ color: theme.brand }}>
            {role === 'EDITOR' ? '편집자' : '조회자'} 권한으로 접속 중이에요
          </span>
        </div>
      )}

      {/* Menu */}
      {menuItems.map((item, idx) => (
        <React.Fragment key={item.route}>
          <ListRow
            left={
              <div className={styles.menuIconBox} style={{ backgroundColor: item.bgColor }}>
                <TossEmoji code={item.emojiCode} size={28} />
              </div>
            }
            contents={
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className={styles.menuLabel} style={{ color: theme.text }}>{item.label}</span>
                <span className={styles.menuDetail} style={{ color: theme.textMuted }}>{item.detail}</span>
              </div>
            }
            withArrow
            onPress={() => navigate(item.route)}
            verticalPadding="small"
          />
          {idx < menuItems.length - 1 && <Border type="full" />}
        </React.Fragment>
      ))}

      <Border type="full" height={16} />

      {/* Logout */}
      <div className={styles.footer}>
        <Button display="full" size="big" type="danger" style="weak" onPress={() => setLogoutConfirm(true)}>
          로그아웃
        </Button>
        <span className={styles.footerText} style={{ color: theme.textMuted }}>자산일기 v1.0</span>
      </div>

      <ConfirmDialog
        visible={logoutConfirm}
        title="로그아웃"
        description="로그아웃 하시겠어요?"
        confirmText="로그아웃"
        danger
        onConfirm={handleLogout}
        onClose={() => setLogoutConfirm(false)}
      />
    </div>
  );
}
