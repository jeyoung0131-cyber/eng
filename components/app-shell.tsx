'use client'

import { useState } from 'react'
import {
  BarChart3,
  BookOpen,
  Download,
  Moon,
  RotateCcw,
  Sun,
  Users,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Dashboard } from '@/components/dashboard'
import { LedgerView } from '@/components/ledger-view'
import { ClientsView } from '@/components/clients-view'
import { useFinance } from '@/components/finance-provider'

export function AppShell() {
  const [tab, setTab] = useState<'dashboard' | 'ledger' | 'clients'>('dashboard')
  const { theme, setTheme } = useTheme()
  const { ledger, totals, resetAll } = useFinance()

  // 네이버 웨일/엑셀 완벽 지원 CSV 다운로드
  const handleDownloadCsv = (e: React.MouseEvent) => {
    e.preventDefault()

    if (!ledger || ledger.length === 0) {
      alert('다운로드할 장부 데이터가 없습니다.')
      return
    }

    const todayStr = new Date().toISOString().slice(0, 10)

    const summaryRows = [
      ['[ 재무 요약 리포트 ]'],
      ['총 매출 (공급가액)', totals.sales],
      ['총 지출 (공급가액)', totals.expenses],
      ['순이익', totals.sales - totals.expenses],
      ['납부예상 부가세', totals.vatPayable],
      ['원천징수 (3.3%)', totals.withholding],
      ['미수금', totals.outstanding],
      ['실보유 순자금', totals.netCash ?? 0],
      [],
    ]

    const ledgerHeader = ['[ 전체 장부 내역 ]']
    const ledgerColumns = ['구분', '날짜', '거래처', '금액', '부가세포함', '과세여부', '메모']
    const ledgerData = ledger.map((item) => [
      item.kind === 'sale' ? '매출' : '지출',
      item.date,
      `"${(item.party || '').replace(/"/g, '""')}"`,
      item.amount,
      item.vatIncluded ? '포함' : '별도',
      item.taxable !== false ? '과세' : '비과세',
      `"${(item.memo || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = [
      ...summaryRows.map((r) => r.join(',')),
      ledgerHeader.join(','),
      ledgerColumns.join(','),
      ...ledgerData.map((r) => r.join(',')),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    let iframe = document.getElementById('hidden-download-iframe') as HTMLIFrameElement
    if (!iframe) {
      iframe = document.createElement('iframe')
      iframe.id = 'hidden-download-iframe'
      iframe.style.display = 'none'
      document.body.appendChild(iframe)
    }

    const link = document.createElement('a')
    link.href = url
    link.download = `대시보드_재무리포트_${todayStr}.csv`

    if (iframe.contentDocument) {
      iframe.contentDocument.body.appendChild(link)
      link.click()
    } else {
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* GNB / Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">세무·자금 통합 관리</h1>
              <p className="text-xs text-muted-foreground">소규모 제조업 대시보드</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('모든 데이터가 초기화됩니다. 계속하시겠습니까?')) {
                  resetAll()
                }
              }}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <RotateCcw className="size-3.5" /> 초기화
            </Button>
            
            {/* 맨 위 상단 다운로드 버튼 (정상 작동 로직 적용) */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadCsv}
              className="gap-1.5 text-xs"
            >
              <Download className="size-3.5" /> 엑셀 다운로드
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">테마 변경</span>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-border/50 bg-muted/30 px-4 sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center gap-1 py-1.5">
            <TabButton
              active={tab === 'dashboard'}
              onClick={() => setTab('dashboard')}
              icon={<BarChart3 className="size-4" />}
              label="대시보드"
            />
            <TabButton
              active={tab === 'ledger'}
              onClick={() => setTab('ledger')}
              icon={<BookOpen className="size-4" />}
              label="장부 작성"
            />
            <TabButton
              active={tab === 'clients'}
              onClick={() => setTab('clients')}
              icon={<Users className="size-4" />}
              label="거래처·대금 관리"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'ledger' && <LedgerView />}
        {tab === 'clients' && <ClientsView />}
      </main>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
