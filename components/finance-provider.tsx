'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import {
  computeTotals,
  monthlySeries,
  type Client,
  type Expense,
  type LedgerEntry,
  type SaleProject,
  type StageKey,
} from '@/lib/finance'

type NewClient = Omit<Client, 'id'>
type NewProject = {
  clientId: string
  title: string
  date: string
  supplyAmount: number
  stageRatios: Record<StageKey, number>
}
type NewLedger = Omit<LedgerEntry, 'id'>
type NewExpense = Omit<Expense, 'id'>

type FinanceContextValue = {
  clients: Client[]
  projects: SaleProject[]
  expenses: Expense[]
  ledger: LedgerEntry[]
  totals: ReturnType<typeof computeTotals>
  monthly: ReturnType<typeof monthlySeries>
  addClient: (c: NewClient) => void
  updateClient: (id: string, c: NewClient) => void
  deleteClient: (id: string) => void
  addProject: (p: NewProject) => void
  updateProject: (id: string, p: NewProject) => void
  deleteProject: (id: string) => void
  toggleStage: (projectId: string, stageKey: StageKey) => void
  addLedger: (e: NewLedger) => void
  updateLedger: (id: string, e: NewLedger) => void
  deleteLedger: (id: string) => void
  addExpense: (e: NewExpense) => void
  updateExpense: (id: string, e: NewExpense) => void
  deleteExpense: (id: string) => void
  resetData: () => void
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<SaleProject[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [ledger, setLedger] = useState<LedgerEntry[]>([])

  // Supabase DB 데이터 불러오기
  const fetchData = useCallback(async () => {
    const [pRes, eRes, lRes, cRes] = await Promise.all([
      supabase.from('sale_projects').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('ledger_entries').select('*'),
      supabase.from('clients').select('*'),
    ])

    if (pRes.data) {
      setProjects(
        pRes.data.map((item) => ({
          id: item.id,
          clientId: item.client_id,
          title: item.title,
          date: item.date,
          supplyAmount: Number(item.supply_amount),
          stages: item.stages || [],
        })),
      )
    }
    if (eRes.data) {
      setExpenses(
        eRes.data.map((item) => ({
          id: item.id,
          date: item.date,
          vendor: item.vendor,
          description: item.description,
          category: item.category,
          supplyAmount: Number(item.supply_amount),
          withholding: item.withholding,
        })),
      )
    }
    if (lRes.data) {
      setLedger(
        lRes.data.map((item) => ({
          id: item.id,
          date: item.date,
          party: item.party,
          kind: item.kind,
          amount: Number(item.amount),
          vatIncluded: item.vat_included,
          taxable: item.taxable,
          memo: item.memo,
        })),
      )
    }
    if (cRes.data) {
      setClients(
        cRes.data.map((item) => ({
          id: item.id,
          name: item.name,
          bizNumber: item.biz_number,
          contact: item.contact,
        })),
      )
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 전체 데이터 비우기 (DB 삭제)
  const resetData = useCallback(async () => {
    await Promise.all([
      supabase.from('sale_projects').delete().neq('id', ''),
      supabase.from('expenses').delete().neq('id', ''),
      supabase.from('ledger_entries').delete().neq('id', ''),
      supabase.from('clients').delete().neq('id', ''),
    ])
    fetchData()
  }, [fetchData])

  // 거래처 관리
  const addClient = useCallback(async (c: NewClient) => {
    const newId = uid('c')
    await supabase.from('clients').insert({
      id: newId,
      name: c.name,
      biz_number: c.bizNumber,
      contact: c.contact,
    })
    fetchData()
  }, [fetchData])

  const updateClient = useCallback(async (id: string, c: NewClient) => {
    await supabase
      .from('clients')
      .update({
        name: c.name,
        biz_number: c.bizNumber,
        contact: c.contact,
      })
      .eq('id', id)
    fetchData()
  }, [fetchData])

  const deleteClient = useCallback(async (id: string) => {
    await supabase.from('clients').delete().eq('id', id)
    await supabase.from('sale_projects').delete().eq('client_id', id)
    fetchData()
  }, [fetchData])

  // 수금 단계 계산
  const buildStages = (supplyAmount: number, ratios: Record<StageKey, number>) =>
    (['advance', 'interim', 'balance'] as StageKey[]).map((key) => ({
      key,
      amount: Math.round((supplyAmount * ratios[key]) / 100),
      paid: false,
    }))

  // 프로젝트(매출) 관리
  const addProject = useCallback(async (p: NewProject) => {
    const today = new Date().toISOString().slice(0, 10)
    const newId = uid('p')
    const stages = buildStages(p.supplyAmount, p.stageRatios)
    await supabase.from('sale_projects').insert({
      id: newId,
      client_id: p.clientId,
      title: p.title,
      date: p.date || today,
      supply_amount: p.supplyAmount,
      stages,
    })
    fetchData()
  }, [fetchData])

  const updateProject = useCallback(async (id: string, p: NewProject) => {
    const today = new Date().toISOString().slice(0, 10)
    const current = projects.find((item) => item.id === id)
    const rebuilt = buildStages(p.supplyAmount, p.stageRatios)
    const updatedStages = rebuilt.map((s) => {
      const prevStage = current?.stages.find((ps) => ps.key === s.key)
      return prevStage
        ? { ...s, paid: prevStage.paid, paidDate: prevStage.paidDate }
        : s
    })

    await supabase
      .from('sale_projects')
      .update({
        client_id: p.clientId,
        title: p.title,
        date: p.date || current?.date || today,
        supply_amount: p.supplyAmount,
        stages: updatedStages,
      })
      .eq('id', id)
    fetchData()
  }, [projects, fetchData])

  const deleteProject = useCallback(async (id: string) => {
    await supabase.from('sale_projects').delete().eq('id', id)
    fetchData()
  }, [fetchData])

  // 수금 완료 토글
  const toggleStage = useCallback(async (projectId: string, stageKey: StageKey) => {
    const today = new Date().toISOString().slice(0, 10)
    const target = projects.find((p) => p.id === projectId)
    if (!target) return

    const newStages = target.stages.map((s) =>
      s.key === stageKey
        ? { ...s, paid: !s.paid, paidDate: !s.paid ? today : undefined }
        : s,
    )

    await supabase
      .from('sale_projects')
      .update({ stages: newStages })
      .eq('id', projectId)
    fetchData()
  }, [projects, fetchData])

  // 간편장부 관리
  const addLedger = useCallback(async (e: NewLedger) => {
    const newId = uid('l')
    await supabase.from('ledger_entries').insert({
      id: newId,
      date: e.date,
      party: e.party,
      kind: e.kind,
      amount: e.amount,
      vat_included: e.vatIncluded,
      taxable: e.taxable,
      memo: e.memo,
    })
    fetchData()
  }, [fetchData])

  const updateLedger = useCallback(async (id: string, e: NewLedger) => {
    await supabase
      .from('ledger_entries')
      .update({
        date: e.date,
        party: e.party,
        kind: e.kind,
        amount: e.amount,
        vat_included: e.vatIncluded,
        taxable: e.taxable,
        memo: e.memo,
      })
      .eq('id', id)
    fetchData()
  }, [fetchData])

  const deleteLedger = useCallback(async (id: string) => {
    await supabase.from('ledger_entries').delete().eq('id', id)
    fetchData()
  }, [fetchData])

  // 지출 관리
  const addExpense = useCallback(async (e: NewExpense) => {
    const newId = uid('e')
    await supabase.from('expenses').insert({
      id: newId,
      date: e.date,
      vendor: e.vendor,
      description: e.description,
      category: e.category,
      supply_amount: e.supplyAmount,
      withholding: e.withholding,
    })
    fetchData()
  }, [fetchData])

  const updateExpense = useCallback(async (id: string, e: NewExpense) => {
    await supabase
      .from('expenses')
      .update({
        date: e.date,
        vendor: e.vendor,
        description: e.description,
        category: e.category,
        supply_amount: e.supplyAmount,
        withholding: e.withholding,
      })
      .eq('id', id)
    fetchData()
  }, [fetchData])

  const deleteExpense = useCallback(async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id)
    fetchData()
  }, [fetchData])

  const totals = useMemo(
    () => computeTotals(projects, expenses, ledger),
    [projects, expenses, ledger],
  )
  const monthly = useMemo(
    () => monthlySeries(projects, expenses, ledger),
    [projects, expenses, ledger],
  )

  const value = useMemo<FinanceContextValue>(
    () => ({
      clients,
      projects,
      expenses,
      ledger,
      totals,
      monthly,
      addClient,
      updateClient,
      deleteClient,
      addProject,
      updateProject,
      deleteProject,
      toggleStage,
      addLedger,
      updateLedger,
      deleteLedger,
      addExpense,
      updateExpense,
      deleteExpense,
      resetData,
    }),
    [
      clients,
      projects,
      expenses,
      ledger,
      totals,
      monthly,
      addClient,
      updateClient,
      deleteClient,
      addProject,
      updateProject,
      deleteProject,
      toggleStage,
      addLedger,
      updateLedger,
      deleteLedger,
      addExpense,
      updateExpense,
      deleteExpense,
      resetData,
    ],
  )

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  )
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}