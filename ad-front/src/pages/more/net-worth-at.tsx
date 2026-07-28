import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ListRow from '../../components/ui/ListRow';
import Border from '../../components/ui/Border';
import Loader from '../../components/ui/Loader';
import ScreenHeader from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';
import DatePicker from '../../components/common/DatePicker';
import { useTheme } from '../../lib/theme';
import { useAuthStore } from '../../stores/auth.store';
import { dashboardApi } from '../../api';
import { qk } from '../../queries/keys';
import { krw } from '../../lib/format';
import { todayLocal } from '../../lib/date';
import { TE } from '../../lib/toss-emoji';
import { getAssetCategoryMeta } from '../../lib/category-meta';
import styles from './net-worth-at.module.css';

// 백엔드 자산 카테고리 enum(REAL_ASSET/DEBT)을 프론트 키(REAL_ESTATE/LIABILITY)로 정규화
const CATEGORY_ALIAS: Record<string, string> = {
  REAL_ASSET: 'REAL_ESTATE',
  DEBT: 'LIABILITY',
};

function formatDateLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

interface NetWorthAtAsset {
  assetId: number;
  name: string;
  category: string;
  isLiability: boolean;
  valueKRW: number | null;
  snapshotDate: string | null;
}

export default function NetWorthAtPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentHousehold } = useAuthStore();
  const hid = currentHousehold?.id;

  const [date, setDate] = useState(todayLocal());
  const [pickerVisible, setPickerVisible] = useState(false);

  const q = useQuery({
    queryKey: qk.netWorthAt(hid ?? 0, date),
    queryFn: () => dashboardApi.netWorthAt(hid!, date),
    enabled: !!hid,
    staleTime: 30_000,
  });

  const data: { date: string; netWorth: number; byAsset: NetWorthAtAsset[] } | undefined = q.data as any;
  const byAsset = data?.byAsset ?? [];
  const hasAnySnapshot = byAsset.some((a) => a.valueKRW !== null);

  return (
    <div className={styles.root} style={{ backgroundColor: theme.bg }}>
      <ScreenHeader title="날짜별 자산 조회" onBack={() => navigate(-1)} />
      <div className={styles.scroll}>
        {/* 날짜 선택 */}
        <button type="button" className={styles.dateButton} style={{ backgroundColor: theme.card, borderColor: theme.border }} onClick={() => setPickerVisible(true)}>
          <span className={styles.dateLabel} style={{ color: theme.text }}>{formatDateLabel(date)}</span>
          <span className={styles.dateChange} style={{ color: theme.brand }}>날짜 변경</span>
        </button>

        {q.isLoading ? (
          <div className={styles.loadingBox}>
            <Loader size="large" />
          </div>
        ) : !hasAnySnapshot ? (
          <EmptyState
            iconCode={TE.calendar}
            title="이 날짜의 기록이 없어요"
            desc="선택한 날짜 이전에 입력된 스냅샷이 하나도 없습니다"
          />
        ) : (
          <>
            {/* 총자산 */}
            <div className={styles.headlineCard} style={{ backgroundColor: theme.card, borderColor: theme.border }}>
              <span className={styles.headlineLabel} style={{ color: theme.textMuted }}>
                {formatDateLabel(date)} 기준 총자산
              </span>
              <span className={styles.headlineValue} style={{ color: theme.text }}>{krw(data!.netWorth)}</span>
            </div>

            {/* 자산별 상세 */}
            <div className={styles.section} style={{ backgroundColor: theme.card, marginBottom: 32 }}>
              <span className={styles.sectionTitle} style={{ color: theme.text }}>자산별 내역</span>
              {byAsset.map((a, idx) => {
                const meta = getAssetCategoryMeta(CATEGORY_ALIAS[a.category] ?? a.category);
                const isStale = a.snapshotDate !== null && a.snapshotDate !== date;
                return (
                  <div key={a.assetId}>
                    <ListRow
                      left={<span className={styles.accentBar} style={{ backgroundColor: meta.color }} />}
                      contents={
                        <div className={styles.assetRow}>
                          <span className={styles.assetName} style={{ color: theme.text }}>{a.name}</span>
                          {isStale && (
                            <span className={styles.staleNote} style={{ color: theme.textMuted }}>
                              {a.snapshotDate} 입력 기준
                            </span>
                          )}
                          {a.snapshotDate === null && (
                            <span className={styles.staleNote} style={{ color: theme.textMuted }}>
                              이 날짜 이전 기록 없음
                            </span>
                          )}
                        </div>
                      }
                      right={
                        <span
                          className={styles.assetValue}
                          style={{ color: a.isLiability ? theme.danger : theme.text }}
                        >
                          {a.valueKRW !== null ? krw(a.valueKRW) : '—'}
                        </span>
                      }
                      verticalPadding="small"
                    />
                    {idx < byAsset.length - 1 && <Border type="full" />}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <DatePicker
        visible={pickerVisible}
        value={date}
        onSelect={setDate}
        onClose={() => setPickerVisible(false)}
        maxDate={todayLocal()}
        title="조회할 날짜 선택"
      />
    </div>
  );
}
