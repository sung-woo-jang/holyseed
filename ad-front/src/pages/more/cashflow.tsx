import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScreenHeader from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';
import Segmented from '../../components/common/Segmented';
import HBar from '../../components/charts/HBar';
import TossEmoji from '../../components/common/TossEmoji';
import { useTheme } from '../../lib/theme';
import { useDataSource } from '../../lib/data-source';
import { krwShort } from '../../lib/format';
import { getCategoryDef } from '../../lib/category-meta';
import { TE } from '../../lib/toss-emoji';
import type { MockTransaction } from '../../lib/mock-data';
import styles from './cashflow.module.css';

type Period = '이번달' | '올해' | '작년' | '3년' | '전체';

function filterByPeriod(txs: MockTransaction[], period: Period): MockTransaction[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  if (period === '이번달') return txs.filter((t) => t.date.startsWith(`${y}-${m}`));
  if (period === '올해') return txs.filter((t) => t.date.startsWith(`${y}`));
  if (period === '작년') return txs.filter((t) => t.date.startsWith(`${y - 1}`));
  if (period === '3년') return txs.filter((t) => Number(t.date.slice(0, 4)) >= y - 2);
  return txs;
}

export default function CashflowPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const data = useDataSource();
  const [period, setPeriod] = useState<Period>('올해');

  const filtered = useMemo(() => filterByPeriod(data.transactions, period), [data.transactions, period]);

  const income = filtered.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const expense = filtered.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  // 카테고리 breakdown
  const catMap: Record<string, number> = {};
  filtered.filter((t) => t.type === 'EXPENSE').forEach((t) => {
    catMap[t.category] = (catMap[t.category] ?? 0) + t.amount;
  });
  const catBreakdown = Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const maxCat = catBreakdown[0]?.[1] ?? 1;

  // 월별 trend (최근 12개월)
  const monthMap: Record<string, { income: number; expense: number }> = {};
  filtered.forEach((t) => {
    const ym = t.date.slice(0, 7);
    if (!monthMap[ym]) monthMap[ym] = { income: 0, expense: 0 };
    if (t.type === 'INCOME') monthMap[ym].income += t.amount;
    if (t.type === 'EXPENSE') monthMap[ym].expense += t.amount;
  });
  const trend = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  const maxTrend = Math.max(...trend.map(([, v]) => Math.max(v.income, v.expense)), 1);

  const hasData = filtered.length > 0;

  return (
    <div className={styles.root} style={{ backgroundColor: theme.bg }}>
      <ScreenHeader title="현금흐름" onBack={() => navigate(-1)} />
      <div className={styles.scroll}>
        {/* 기간 Segmented */}
        <div style={{ padding: '16px 20px 8px' }}>
          <Segmented
            options={['이번달', '올해', '작년', '3년', '전체']}
            value={period}
            onChange={(v) => setPeriod(v as Period)}
          />
        </div>

        {!hasData && (
          <EmptyState
            iconCode={TE.receipt}
            title="이 기간에는 거래가 없어요"
            desc="다른 기간을 선택하거나 가계부에서 거래를 추가해보세요"
          />
        )}

        {/* Income vs Expense 카드 */}
        {hasData && (<>
        <div className={styles.summaryCard} style={{ backgroundColor: theme.card, borderColor: theme.border }}>
          <div className={styles.summaryRow}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel} style={{ color: theme.textMuted }}>수입</span>
              <span className={styles.summaryValue} style={{ color: theme.brand }}>{krwShort(income)}</span>
            </div>
            <div className={styles.divider} style={{ backgroundColor: theme.border }} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel} style={{ color: theme.textMuted }}>지출</span>
              <span className={styles.summaryValue} style={{ color: theme.danger }}>{krwShort(expense)}</span>
            </div>
            <div className={styles.divider} style={{ backgroundColor: theme.border }} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel} style={{ color: theme.textMuted }}>저축률</span>
              <span className={styles.summaryValue} style={{ color: savingsRate >= 0 ? theme.brand : theme.danger }}>
                {savingsRate.toFixed(1)}%
              </span>
            </div>
          </div>
          {income > 0 && (
            <div className={styles.stackBar} style={{ backgroundColor: theme.border }}>
              <div style={{ flex: expense / (income || 1), borderRadius: 4, backgroundColor: theme.danger }} />
              <div style={{ flex: Math.max(0, 1 - expense / (income || 1)), borderRadius: 4, backgroundColor: theme.brand }} />
            </div>
          )}
        </div>

        {/* 월별 trend */}
        {trend.length > 1 && (
          <div className={styles.section} style={{ backgroundColor: theme.card }}>
            <span className={styles.sectionTitle} style={{ color: theme.text }}>월별 추이</span>
            <div className={styles.trendScroll}>
              <div className={styles.trendRow}>
                {trend.map(([ym, vals]) => {
                  const incH = Math.max(4, (vals.income / maxTrend) * 80);
                  const expH = Math.max(4, (vals.expense / maxTrend) * 80);
                  return (
                    <div key={ym} className={styles.trendCol}>
                      <div className={styles.trendBars}>
                        <div className={styles.trendBar} style={{ height: incH, backgroundColor: theme.brand, marginRight: 2 }} />
                        <div className={styles.trendBar} style={{ height: expH, backgroundColor: theme.danger }} />
                      </div>
                      <span className={styles.trendLabel} style={{ color: theme.textMuted }}>{ym.slice(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 카테고리 breakdown */}
        <div className={styles.section} style={{ backgroundColor: theme.card, marginBottom: 32 }}>
          <span className={styles.sectionTitle} style={{ color: theme.text }}>지출 카테고리</span>
          {catBreakdown.length === 0 ? (
            <div className={styles.emptyRow}>
              <TossEmoji code={TE.chartBar} size={36} />
              <span className={styles.emptyText} style={{ color: theme.textMuted }}>해당 기간의 지출이 없어요</span>
            </div>
          ) : (
            catBreakdown.map(([name, val]) => {
              const def = getCategoryDef(name);
              return (
                <div key={name} className={styles.catRow}>
                  <TossEmoji code={def.iconCode} size={32} bg={def.color + '22'} />
                  <div className={styles.catInfo}>
                    <div className={styles.catTopRow}>
                      <span className={styles.catName} style={{ color: theme.text }}>{name}</span>
                      <span className={styles.catPct} style={{ color: theme.textMuted }}>
                        {expense > 0 ? ((val / expense) * 100).toFixed(1) : 0}%
                      </span>
                      <span className={styles.catVal} style={{ color: theme.danger }}>{krwShort(val)}</span>
                    </div>
                    <HBar value={val} max={maxCat} color={def.color} />
                  </div>
                </div>
              );
            })
          )}
        </div>
        </>)}
      </div>
    </div>
  );
}
