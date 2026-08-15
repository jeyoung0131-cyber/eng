'use client'

import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
  PiggyBank,
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
  const { totals, monthly, projects, clients, expenses } = useFinance()
  const netProfit = totals.sales - totals.expenses

  const outstandingProjects = projects
    .filter((p) => projectOutstanding(p) > 0)
    .sort((a, b) => projectOutstanding(b) - projectOutstanding(a))

  const clientName = (id: string) =>
    clients.find((c) => c.id === id)?.name ?? '-'

  return (
    <div className="flex flex-col gap-6">
      {/* 상단 타이틀 (중복 다운로드 버튼 제거) */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">대시보드</h2>
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="총 매출 (공급가액)"
          value={formatWon(totals.sales)}
          icon={<TrendingUp className="size-5" />}
          tone="primary"
          hint={`거래 ${projects.length}건`}
        />
        <StatCard
          label="총 지출 (공급가액)"
          value={formatWon(totals.expenses)}
          icon={<TrendingDown className="size-5" />}
          tone="muted"
          hint={`지출 ${expenses.length}건`}
        />
        <StatCard
          label="순이익 (매출 - 지출)"
          value={formatWon(netProfit)}
          icon={netProfit >= 0 ? <ArrowUpRight className="size-5" /> : <ArrowDownRight className="size-5" />}
          tone={netProfit >= 0 ? 'success' : 'destructive'}
        />
        <StatCard
          label="납부예상 부가세 (10%)"
          value={formatWon(totals.vatPayable)}
          icon={<Receipt className="size-5" />}
          tone="warning"
          hint={`매출세액 ${formatWon(totals.salesVat)} · 매입세액 ${formatWon(totals.purchaseVat)}`}
        />
        <StatCard
          label="원천징수 (3.3%)"
          value={formatWon(totals.withholding)}
          icon={<Landmark className="size-5" />}
          tone="muted"
          hint="사업소득 원천징수 합계"
        />
        <StatCard
          label="미수금 현황"
          value={formatWon(totals.outstanding)}
          icon={<Wallet className="size-5" />}
          tone="destructive"
          hint={`입금 완료 ${formatWon(totals.received)}`}
        />
        <StatCard
          label="실보유 순자금 (부가세 제외)"
          value={formatWon(totals.netCash ?? 0)}
          icon={<PiggyBank className="size-5" />}
          tone="success"
          hint="통장 입금액 - 총지출 - 부가세예정액"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* 월별 추이 */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>월별 매출·지출 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyChart data={monthly} />
          </CardContent>
        </Card>

        {/* 부가세/원천징수 요약 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>세무 요약</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <SummaryRow label="매출세액 (부가세)" value={formatWon(totals.salesVat)} />
            <SummaryRow label="매입세액 (공제)" value={`- ${formatWon(totals.purchaseVat)}`} />
            <div className="my-1 border-t border-border" />
            <SummaryRow
              label="납부예상 부가세"
              value={formatWon(totals.vatPayable)}
              strong
            />
            <SummaryRow label="원천징수 합계 (3.3%)" value={formatWon(totals.withholding)} />
          </CardContent>
        </Card>
      </div>

      {/* 미수금 현황 */}
      <Card>
        <CardHeader>
          <CardTitle>미수금 현황 (거래처별 입금 진행)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {outstandingProjects.length === 0 && (
            <p className="text-sm text-muted-foreground">미수금이 없습니다. 모든 대금이 입금되었습니다.</p>
          )}
          {outstandingProjects.map((p) => (
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
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

type Tone = 'primary' | 'success' | 'destructive' | 'warning' | 'muted'

const toneClasses: Record<Tone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/15 text-success',
  destructive: 'bg-destructive/10 text-destructive',
  warning: 'bg-warning/20 text-warning-foreground dark:text-warning',
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

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? 'font-medium' : 'text-sm text-muted-foreground'}>
        {label}
      </span>
      <span className={strong ? 'text-lg font-bold text-primary' : 'text-sm font-medium'}>
        {value}
      </span>
    </div>
  )
}
