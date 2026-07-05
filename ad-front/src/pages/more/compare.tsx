import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Border from '../../components/ui/Border';
import ListRow from '../../components/ui/ListRow';
import Loader from '../../components/ui/Loader';
import ScreenHeader from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';
import WaterfallChart from '../../components/charts/WaterfallChart';
import { useTheme } from '../../lib/theme';
import { useDataSource } from '../../lib/data-source';
import { useAuthStore } from '../../stores/auth.store';
import { comparisonApi } from '../../api';
import { qk } from '../../queries/keys';
import { krw, krwShort } from '../../lib/format';
import { TE } from '../../lib/toss-emoji';
import { ASSET_CATEGORY_META } from '../../lib/category-meta';
import styles from './compare.module.css';

export default function ComparePage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const data = useDataSource();
  const { currentHousehold, useMock } = useAuthStore();
  const hid = currentHousehold?.id;

  // 실제 연간 비교 API
  const compareQ = useQuery({
    queryKey: qk.comparison(hid ?? 0),
    queryFn: () => comparisonApi.yearly(hid!),
    enabled: !!hid && !useMock,
    staleTime: 60_000,
  });

  // API 결과가 있으면 그걸, 없으면 mock 데이터 폴백
  const apiData: any = compareQ.data;
  const apiYearlyContrib: Record<number, any[]> = apiData?.yearlyContrib ?? {};
  const hasApiData = Object.keys(apiYearlyContrib).length > 0;

  const yearlyContrib = hasApiData ? apiYearlyContrib : data.yearlyContrib;
  const years = Object.keys(yearlyContrib).map(Number).sort((a, b) => a - b);
  const [selectedYearIdx, setSelectedYearIdx] = useState(years.length > 1 ? years.length - 1 : 0);
  const selectedYear = years[selectedYearIdx] ?? (years[years.length - 1] ?? new Date().getFullYear());
  const prevYear = selectedYear - 1;

  const contribs: { category: string; value: number; color: string }[] = yearlyContrib[selectedYear] ?? [];

  const prevNetWorth = useMemo(() => {
    const h = data.netWorth.monthlyHistory;
    const prevEntry = h.filter((p) => p.date.startsWith(`${prevYear}-12`)).pop();
    const fallback = data.netWorth.current - contribs.reduce((s, c) => s + c.value, 0);
    return prevEntry?.value ?? fallback;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, data, prevYear, contribs]);

  const change = contribs.reduce((s, c) => s + c.value, 0);
  const currentNetWorth = prevNetWorth + change;

  const wfData: { label: string; value: number }[] = [
    { label: `${prevYear}년말`, value: prevNetWorth },
    ...contribs.map((c) => ({ label: c.category, value: c.value })),
    { label: `${selectedYear}년말`, value: currentNetWorth },
  ];

  // 5년 bar chart 데이터
  const netWorthByYear: Record<number, number> = hasApiData
    ? (apiData?.netWorthByYear ?? {})
    : Object.fromEntries(
        years.map((y) => {
          if (y === new Date().getFullYear()) return [y, data.netWorth.current];
          const ybContribs: any[] = yearlyContrib[y] ?? [];
          return [y, ybContribs.reduce((s: number, c: any) => s + (c.value ?? 0), 0)];
        })
      );

  const yearBars = years.map((y) => ({ year: y, value: netWorthByYear[y] ?? 0 }));
  const maxBar = Math.max(...yearBars.map((b) => b.value), 1);

  if (compareQ.isLoading) {
    return (
      <div className={styles.root} style={{ backgroundColor: theme.bg }}>
        <ScreenHeader title="연간 비교" onBack={() => navigate(-1)} />
        <div className={styles.loadingBox}>
          <Loader size="large" />
        </div>
      </div>
    );
  }

  if (years.length < 2) {
    return (
      <div className={styles.root} style={{ backgroundColor: theme.bg }}>
        <ScreenHeader title="연간 비교" onBack={() => navigate(-1)} />
        <EmptyState
          iconCode={TE.chartUp}
          title="비교할 데이터가 아직 부족해요"
          desc="2년 이상 자산 스냅샷이 쌓이면 연도별 증감을 비교할 수 있어요"
        />
      </div>
    );
  }

  return (
    <div className={styles.root} style={{ backgroundColor: theme.bg }}>
      <ScreenHeader title="연간 비교" onBack={() => navigate(-1)} />
      <div className={styles.scroll}>
        {/* 연도 pill 셀렉터 */}
        <div className={styles.yearScroll}>
          {years.slice(1).map((y) => {
            const isActive = selectedYear === y;
            return (
              <button
                type="button"
                key={y}
                className={styles.yearPill}
                style={{
                  backgroundColor: isActive ? theme.brand : theme.bg,
                  borderColor: isActive ? theme.brand : theme.border,
                }}
                onClick={() => setSelectedYearIdx(years.indexOf(y))}
              >
                <span className={styles.yearPillText} style={{ color: isActive ? '#fff' : theme.textMuted }}>
                  {y - 1} → {y}
                </span>
              </button>
            );
          })}
        </div>

        {/* Headline delta */}
        <div className={styles.headlineCard} style={{ backgroundColor: theme.card, borderColor: theme.border }}>
          <span className={styles.headlineDelta} style={{ color: change >= 0 ? theme.brand : theme.danger }}>
            {change >= 0 ? '+' : ''}{krw(change)} {change >= 0 ? '늘었어요' : '줄었어요'}
          </span>
          <span className={styles.pctChip} style={{ backgroundColor: change >= 0 ? theme.brandSoft : '#FEE2E2' }}>
            <span className={styles.pctChipText} style={{ color: change >= 0 ? theme.brand : theme.danger }}>
              {prevNetWorth > 0 ? ((change / prevNetWorth) * 100).toFixed(1) : 0}%
            </span>
          </span>
        </div>

        {/* 5년 net-worth 바 차트 */}
        <div className={styles.section} style={{ backgroundColor: theme.card }}>
          <span className={styles.sectionTitle} style={{ color: theme.text }}>연도별 순자산</span>
          <div className={styles.barRow}>
            {yearBars.map((b) => {
              const h = Math.max(8, (b.value / maxBar) * 120);
              const isActive = b.year === selectedYear;
              return (
                <button
                  type="button"
                  key={b.year}
                  className={styles.barCol}
                  onClick={() => setSelectedYearIdx(years.indexOf(b.year))}
                >
                  <span className={styles.barTopLabel} style={{ color: isActive ? theme.brand : theme.textMuted }}>
                    {isActive ? krwShort(b.value) : ''}
                  </span>
                  <span
                    className={styles.barBody}
                    style={{ height: h, backgroundColor: isActive ? theme.brand : theme.brandSoft }}
                  />
                  <span className={styles.barLabel} style={{ color: isActive ? theme.brand : theme.textMuted }}>
                    {b.year}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* WaterfallChart */}
        <div className={styles.section} style={{ backgroundColor: theme.card }}>
          <span className={styles.sectionTitle} style={{ color: theme.text }}>자산군별 증감 워터폴</span>
          <div style={{ marginTop: 12 }}>
            <WaterfallChart data={wfData} width={327} height={220} dark={theme.dark} />
          </div>
        </div>

        {/* Top contributors */}
        <div className={styles.section} style={{ backgroundColor: theme.card, marginBottom: 32 }}>
          <span className={styles.sectionTitle} style={{ color: theme.text }}>자산군별 기여</span>
          {contribs
            .slice()
            .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
            .map((c, idx, arr) => {
              const weight = Math.abs(change) > 0 ? ((Math.abs(c.value) / Math.abs(change)) * 100).toFixed(0) : '0';
              const catKey = Object.keys(ASSET_CATEGORY_META).find(
                (k) => ASSET_CATEGORY_META[k as keyof typeof ASSET_CATEGORY_META].label === c.category
              );
              const catColor = c.color ?? (catKey ? ASSET_CATEGORY_META[catKey as keyof typeof ASSET_CATEGORY_META].color : '#94A3B8');
              return (
                <React.Fragment key={c.category}>
                  <ListRow
                    left={<span className={styles.accentBar} style={{ backgroundColor: catColor }} />}
                    contents={
                      <div className={styles.contribTopRow}>
                        <span className={styles.contribCat} style={{ color: theme.text }}>{c.category}</span>
                        <span className={styles.contribWeight} style={{ color: theme.textMuted }}>{weight}%</span>
                      </div>
                    }
                    right={
                      <span className={styles.contribVal} style={{ color: c.value >= 0 ? theme.brand : theme.danger }}>
                        {c.value >= 0 ? '+' : ''}{krwShort(c.value)}
                      </span>
                    }
                    verticalPadding="small"
                  />
                  {idx < arr.length - 1 && <Border type="full" />}
                </React.Fragment>
              );
            })}
        </div>
      </div>
    </div>
  );
}
