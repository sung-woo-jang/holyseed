import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/widgets/page-header'
import { Button } from '@/shared/ui/button'
import { useWorklogMonth } from '@/features/worklog/api/hooks'
import { useExpenseMonth } from '@/features/expense/api/hooks'

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export default function FinanceDashboardPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const { data: worklogRes, isLoading: worklogLoading } = useWorklogMonth(year, month)
  const { data: expenseRes, isLoading: expenseLoading } = useExpenseMonth(year, month)

  const worklogSummary = worklogRes?.data?.summary
  const expenseSummary = expenseRes?.data?.summary
  const isLoading = worklogLoading || expenseLoading

  const totalNetIncome = (worklogSummary?.totalNet ?? 0) + (expenseSummary?.totalIncome ?? 0)
  const netCashflow = totalNetIncome - (expenseSummary?.totalExpense ?? 0)

  function moveMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth() + 1)
  }

  return (
    <div className="p-6">
      <PageHeader title="대시보드" description="근무일지·지출내역을 종합한 이번 달 재정 개요" />

      <div className="mt-6 flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => moveMonth(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="w-28 text-center text-sm font-semibold">
          {year}년 {month}월
        </span>
        <Button variant="outline" size="icon" onClick={() => moveMonth(1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">불러오는 중…</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="근무 실수령 (근무일지)"
              value={won(worklogSummary?.totalNet ?? 0)}
              hint={`근무일수 ${worklogSummary?.workDays ?? 0}일`}
            />
            <StatCard label="기타 수입 (지출내역)" value={won(expenseSummary?.totalIncome ?? 0)} />
            <StatCard label="총지출" value={won(expenseSummary?.totalExpense ?? 0)} />
            <StatCard
              label="순현금흐름"
              value={won(netCashflow)}
              hint={`합산 수입 ${won(totalNetIncome)} − 지출 ${won(expenseSummary?.totalExpense ?? 0)}`}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <StatCard label="이번 달 고정지출" value={won(expenseSummary?.fixedExpenseTotal ?? 0)} hint="고정-동일금액 + 고정-가변금액 합계" />
            <StatCard
              label="근무일지 수령 / 미수령"
              value={`${won(worklogSummary?.receivedNet ?? 0)} / ${won(worklogSummary?.pendingNet ?? 0)}`}
            />
          </div>

          {expenseSummary && expenseSummary.byCategory.length > 0 && (
            <div className="mt-4 rounded-lg border bg-card p-4">
              <p className="text-sm font-semibold">분류별 지출</p>
              <div className="mt-3 space-y-2">
                {expenseSummary.byCategory.map((c) => (
                  <div key={c.category} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{c.category}</span>
                    <span className="tabular-nums">{won(c.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/worklog">근무일지 보기</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/worklog/expense">지출내역 보기</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
