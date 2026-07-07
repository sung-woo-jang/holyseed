import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Border from '../components/ui/Border';
import Button from '../components/ui/Button';
import ListRow from '../components/ui/ListRow';
import TextButton from '../components/ui/TextButton';
import { useDataSource, useMockRole } from '../lib/data-source';
import { useTheme } from '../lib/theme';
import { krw, krwShort, pct } from '../lib/format';
import { TE } from '../lib/toss-emoji';
import { getCategoryDef } from '../lib/category-meta';
import Segmented from '../components/common/Segmented';
import AutoBadge from '../components/common/AutoBadge';
import TossEmoji from '../components/common/TossEmoji';
import { Icon } from '../components/common/Icon';
import LineChart from '../components/charts/LineChart';
import DonutChart from '../components/charts/DonutChart';
import SnapshotSheet from '../components/sheets/SnapshotSheet';
import EmptyState from '../components/common/EmptyState';
import AppToast from '../components/common/AppToast';
import { todayLocal, daysBetween, isSameMonth } from '../lib/date';
import styles from './HomeScreen.module.css';

interface HomeScreenProps {
  /** "모두 보기" → 거래장부 탭 전환 */
  onSeeAllTx?: () => void;
}

export default function HomeScreen({ onSeeAllTx }: HomeScreenProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const role = useMockRole();
  const data = useDataSource();
  const [chartRange, setChartRange] = useState('1년');
  const [snapshotVisible, setSnapshotVisible] = useState(false);
  const [toast, setToast] = useState('');

  // 마지막 스냅샷 입력일 (자산별 최신 스냅샷 날짜의 최댓값)
  const lastInputDate = data.assets.reduce<string | null>(
    (max, a) => (a.snapshotDate && (!max || a.snapshotDate > max) ? a.snapshotDate : max),
    null,
  );
  const today = todayLocal();
  const inputDoneThisMonth = !!lastInputDate && isSameMonth(lastInputDate, today);
  const ctaCaption = !lastInputDate
    ? '첫 스냅샷을 입력하면 순자산 추이가 시작돼요'
    : inputDoneThisMonth
      ? `이번 달 입력 완료 · ${daysBetween(lastInputDate, today)}일 전`
      : `마지막 입력 후 ${daysBetween(lastInputDate, today)}일 지났어요`;

  const nw = data.netWorth;
  const change = nw.current - nw.lastYear;
  const changePct = nw.lastYear > 0 ? (change / nw.lastYear) * 100 : 0;
  const isViewer = role === 'VIEWER';

  const all = nw.monthlyHistory;
  const sliced = chartRange === '1년' ? all.slice(-12) : chartRange === '3년' ? all.slice(-36) : all;
  const first = sliced[0]?.value ?? 0;
  const last = sliced[sliced.length - 1]?.value ?? 0;
  const delta = last - first;
  const deltaPct = first ? (delta / first) * 100 : 0;

  const recentTxs = data.transactions.slice(0, 3);

  return (
    <div className={styles.scroll} style={{ backgroundColor: theme.bg }}>
      {/* Period label */}
      <div className={styles.periodRow}>
        <span className={styles.periodLeft} style={{ color: theme.textMuted }}>전년 동기 대비</span>
        <span className={styles.periodRight} style={{ color: theme.textMuted }}>{nw.snapshotDate} 기준</span>
      </div>

      {/* Net worth hero */}
      <div className={styles.heroBlock}>
        <span className={styles.heroLabel} style={{ color: theme.textMuted }}>우리집 순자산</span>
        <span className={styles.heroValue} style={{ color: theme.text }}>{krw(nw.current)}</span>
        <div className={styles.changeRow}>
          <Badge type="blue" badgeStyle="weak" size="small">{pct(changePct)}</Badge>
          <span className={styles.changeAbs} style={{ color: theme.text }}>{krw(change)}</span>
        </div>
      </div>

      {/* Snapshot CTA */}
      {!isViewer && (
        <div className={styles.sectionPad}>
          <Button
            display="full"
            size="big"
            type="primary"
            style={inputDoneThisMonth ? 'weak' : 'fill'}
            leftAccessory={<TossEmoji code={inputDoneThisMonth ? TE.check : TE.camera} size={18} />}
            onPress={() => setSnapshotVisible(true)}
          >
            {inputDoneThisMonth ? '이번 달 스냅샷 다시 입력하기' : '이번 달 자산 스냅샷 입력하기'}
          </Button>
          <span className={styles.ctaCaption} style={{ color: theme.textMuted }}>{ctaCaption}</span>
        </div>
      )}

      {/* Chart card */}
      <div className={styles.sectionPad}>
        <div className={styles.card} style={{ backgroundColor: theme.card, borderColor: theme.border }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle} style={{ color: theme.text }}>순자산 변화</span>
            <Segmented options={['1년', '3년', '5년']} value={chartRange} onChange={setChartRange} small alignment="fluid" />
          </div>
          <span className={styles.chartSubtitle} style={{ color: theme.textMuted }}>
            {sliced[0]?.date} → {sliced[sliced.length - 1]?.date}
            {'  '}
            <span style={{ color: delta >= 0 ? theme.brand : theme.danger, fontWeight: 700 }}>
              {delta > 0 ? '+' : ''}{krwShort(delta)}원 ({pct(deltaPct)})
            </span>
          </span>
          <LineChart data={sliced} width={295} height={180} color={theme.brand} dark={theme.dark} />
          <span className={styles.chartHint} style={{ color: theme.textMuted }}>
            그래프를 길게 누르거나 호버하면 그 시점의 금액을 볼 수 있어요
          </span>
        </div>
      </div>

      {/* YoY waterfall link */}
      <div className={styles.sectionPad}>
        <button
          type="button"
          className={`${styles.card} ${styles.yoyCard}`}
          style={{ backgroundColor: theme.card, borderColor: theme.border }}
          onClick={() => navigate('/more/compare')}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <span className={styles.yoyTitle} style={{ color: theme.text }}>작년이랑 얼마나 달라졌지?</span>
            <span className={styles.yoySub} style={{ color: theme.textMuted }}>자산군별 증감 워터폴 보기</span>
          </div>
          {Icon.chevronRight(theme.textMuted)}
        </button>
      </div>

      {/* Donut contribution card */}
      <div className={styles.sectionPad}>
        <div className={styles.card} style={{ backgroundColor: theme.card, borderColor: theme.border }}>
          <span className={styles.cardTitle} style={{ color: theme.text }}>올해 자산군별 기여도</span>
          <span className={styles.cardSub} style={{ color: theme.textMuted }}>우리집 순자산이 얼마나 늘었는지 자산별로 쪼개봤어요</span>
          {data.contributions.length === 0 ? (
            <EmptyState
              compact
              iconCode={TE.chartBar}
              title="아직 기여도 데이터가 없어요"
              desc="스냅샷을 입력하면 자산군별 기여도가 표시돼요"
            />
          ) : (
            <>
              <div className={styles.donutRow}>
                <div className={styles.donutWrap}>
                  <DonutChart data={data.contributions} size={140} thickness={18} dark={theme.dark} />
                  <div className={styles.donutCenter}>
                    <span className={styles.donutLabel} style={{ color: theme.textMuted }}>총 기여</span>
                    <span className={styles.donutValue} style={{ color: theme.text }}>
                      {(() => {
                        const sum = data.contributions.reduce((s, c) => s + c.value, 0);
                        return `${sum >= 0 ? '+' : ''}${krwShort(sum)}`;
                      })()}
                    </span>
                  </div>
                </div>
                <div className={styles.legend}>
                  {data.contributions.slice(0, 4).map((c, i) => (
                    <div key={i} className={styles.legendRow}>
                      <span className={styles.legendDot} style={{ backgroundColor: c.color }} />
                      <span className={styles.legendCat} style={{ color: theme.text }}>{c.category}</span>
                      <span className={styles.legendVal} style={{ color: c.value >= 0 ? theme.brand : theme.danger }}>
                        {c.value > 0 ? '+' : ''}{krwShort(c.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {data.contributions[0] && (
                <div className={styles.insightBox} style={{ backgroundColor: theme.brandSoft }}>
                  <span className={styles.insightText} style={{ color: theme.text }}>
                    {'💡 '}
                    <b>{data.contributions[0].category}</b>
                    {`가 우리집 자산 성장의 가장 큰 원동력이에요.\n올해만 +${krwShort(data.contributions[0].value)} 기여했어요.`}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className={styles.sectionPad}>
        <div className={styles.sectionHeader}>
          <span className={styles.cardTitle} style={{ color: theme.text }}>최근 거래</span>
          {recentTxs.length > 0 && (
            <TextButton typography="t5" variant="clear" color={theme.textMuted} onPress={onSeeAllTx}>모두 보기</TextButton>
          )}
        </div>
        {recentTxs.length === 0 && (
          <EmptyState compact iconCode={TE.receipt} title="아직 거래 내역이 없어요" desc="가계부에서 첫 거래를 기록해보세요" />
        )}
        {recentTxs.map((tx, i) => {
          const catDef = getCategoryDef(tx.category);
          return (
            <React.Fragment key={tx.id}>
              <ListRow
                left={
                  <div className={styles.txIcon} style={{ backgroundColor: theme.bg }}>
                    <TossEmoji code={catDef.iconCode} size={22} />
                  </div>
                }
                contents={
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div className={styles.txTitleRow}>
                      <span className={styles.txTitle} style={{ color: theme.text }}>{tx.title}</span>
                      {tx.auto && <AutoBadge />}
                    </div>
                    <span className={styles.txMeta} style={{ color: theme.textMuted }}>
                      {tx.category} · {tx.date.slice(5).replace('-', '/')}
                    </span>
                  </div>
                }
                right={
                  <span className={styles.txAmount} style={{ color: tx.type === 'INCOME' ? theme.brand : theme.text }}>
                    {tx.type === 'INCOME' ? '+' : '-'}{krwShort(tx.amount)}원
                  </span>
                }
                verticalPadding="small"
              />
              {i < recentTxs.length - 1 && <Border type="full" />}
            </React.Fragment>
          );
        })}
      </div>

      <SnapshotSheet
        visible={snapshotVisible}
        onClose={() => setSnapshotVisible(false)}
        onSaved={() => setToast('스냅샷을 저장했어요')}
      />
      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </div>
  );
}
