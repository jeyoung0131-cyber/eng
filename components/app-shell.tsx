'use client'

import { useState } from 'react'
import { BookText, Download, Factory, LayoutDashboard, RotateCcw, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Dashboard } from '@/components/dashboard'
import { ClientsView } from '@/components/clients-view'
import { LedgerView } from '@/components/ledger-view'
import { useFinance } from '@/components/finance-provider'
import { buildTransactionsCsv, downloadCsv } from '@/lib/finance'

type Tab = 'dashboard' | 'ledger' | 'clients'

export function AppShell() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const { clients, projects, expenses, ledger, resetData } = useFinance()

  const handleExport = () => {
    const csv = buildTransactionsCsv(clients, projects, expenses, ledger)
    const today = new Date().toISOString().slice(0, 10)
    // 한글 깨짐 방지 BOM 추가 및 저장
    downloadCsv(`거래내역_${today}.csv`, '\uFEFF' + csv)
  }

  const handleReset = () => {
    if (
      window.confirm(
        '저장된 모든 데이터를 지우고 0으로 초기화합니다. 계속할까요?',
      )
    ) {
      resetData()
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Factory className="size-5" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">세무·자금 통합 관리</span>
              <span className="text-xs text-muted-foreground">소규모 제조업 대시보드</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" data-icon="inline-start" onClick={handleReset}>
              <RotateCcw /> 초기화
            </Button>
            <Button variant="outline" size="sm" data-icon="inline-start" onClick={handleExport}>
              <Download /> 엑셀 다운로드
            </Button>
            <ThemeToggle />
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-1 px-4">
          <TabButton
            active={tab === 'dashboard'}
            onClick={() => setTab('dashboard')}
            icon={<LayoutDashboard className="size-4" />}
          >
            대시보드
          </TabButton>
          <TabButton
            active={tab === 'ledger'}
            onClick={() => setTab('ledger')}
            icon={<BookText className="size-4" />}
          >
            장부 작성
          </TabButton>
          <TabButton
            active={tab === 'clients'}
            onClick={() => setTab('clients')}
            icon={<Users className="size-4" />}
          >
            거래처 · 대금 관리
          </TabButton>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
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
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
