'use client'

import { useMemo } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { GaugeBar } from '@/components/gauge-bar'
import { MonthlyChart } from '@/components/monthly-chart'
import { useFinance } from '@/components/finance-provider'
import {
  STAGE_LABELS,
  formatWon,
  projectOutstanding,
  projectProgress,
} from '@/lib/finance'

export function Dashboard() {
  const { totals, monthly, projects, clients, expenses, ledger } = useFinance()
  const netProfit = totals.sales - totals.expenses

  // 장부(ledger) 배열 중 지출 항목만 추출
  const ledgerExpenses = useMemo(
    () => ledger.filter((entry) => entry.kind === 'expense'),
    [ledger],
  )

  // 총 지출 건수
  const totalExpenseCount = ledgerExpenses.length || expenses.length

  // 미수금이 남아있는 프로젝트만 추출하여 정렬
  const outstandingProjects = useMemo(
    () =>
      projects
        .filter((p) => projectOutstanding(p) > 0)
        .sort((a, b) => projectOutstanding(b) - projectOutstanding(a)),
    [projects],
  )

  const clientName = (id: string) =>
    clients.find((c) => c.id === id)?.name ?? '-'

  return (
    <div className="flex flex-col gap-6">
      {/* 상단 타이틀 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">대시보드</h2>
      </div>

      {/* 핵심 지표 카드리스트 (간소화된 4개 카드) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* [1] 총 매출 */}
        <StatCard
          label="총 매출"
          value={formatWon(totals.sales)}
          icon={<TrendingUp className="size-5" />}
          tone="primary"
          hint={`거래 ${projects.length}건`}
        />
        {/* [2] 총 지출 */}
        <StatCard
          label="총 지출"
          value={formatWon(totals.expenses)}
          icon={<TrendingDown className="size-5" />}
          tone="muted"
          hint={`지출 ${totalExpenseCount}건`}
        />
        {/* [3] 순이익 */}
        <StatCard
          label="순이익 (매출 - 지출)"
          value={formatWon(netProfit)}
          icon={
            netProfit >= 0 ? (
              <ArrowUpRight className="size-5" />
            ) : (
              <ArrowDownRight className="size-5" />
            )
          }
          tone={netProfit >= 0 ? 'success' : 'destructive'}
        />
        {/* [4] 미수금 현황 */}
        <StatCard
          label="미수금 현황"
          value={formatWon(totals.outstanding)}
          icon={<Wallet className="size-5" />}
          tone="destructive"
          hint={`입금 완료 ${formatWon(totals.received)}`}
        />
      </div>

      {/* 월별 추이 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>월별 매출·지출 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={monthly} />
        </CardContent>
      </Card>

      {/* 미수금 현황 상세 */}
      <Card>
        <CardHeader>
          <CardTitle>미수금 현황 (거래처별 입금 진행)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {outstandingProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              미수금이 없습니다. 모든 대금이 입금되었습니다.
            </p>
          ) : (
            outstandingProjects.map((p) => (
              <div key={p.id} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{clientName(p.clientId)}</span>
                    <span className="text-xs text-muted-foreground">{p.title}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-destructive">
                      미수 {formatWon(projectOutstanding(p))}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {Math.round(projectProgress(p) * 100)}% 입금
                    </span>
                  </div>
                </div>
                <GaugeBar
                  progress={projectProgress(p)}
                  segments={p.stages.map((s) => ({
                    key: s.key,
                    label: STAGE_LABELS[s.key],
                    value: s.amount || 1,
                    active: s.paid,
                  }))}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

type Tone = 'primary' | 'success' | 'destructive' | 'warning' | 'muted'

const toneClasses: Record<Tone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  destructive: 'bg-destructive/10 text-destructive',
  warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  muted: 'bg-muted text-muted-foreground',
}

function StatCard({
  label,
  value,
  icon,
  tone,
  hint,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: Tone
  hint?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-2xl font-bold tracking-tight text-balance">{value}</span>
          {hint && <span className="mt-1 text-xs text-muted-foreground">{hint}</span>}
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          {icon}
        </span>
      </CardContent>
    </Card>
  )
}
