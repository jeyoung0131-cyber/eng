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

const STORAGE_KEY = 'finance_state_v1'

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<SaleProject[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [ledger, setLedger] = useState<LedgerEntry[]>([])

  // 초기 LocalStorage 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.clients) setClients(parsed.clients)
        if (parsed.projects) setProjects(parsed.projects)
        if (parsed.expenses) setExpenses(parsed.expenses)
        if (parsed.ledger) setLedger(parsed.ledger)
      }
    } catch (err) {
      console.warn('LocalStorage 로드 안됨:', err)
    }
  }, [])

  // 데이터 변경 시 LocalStorage 자동 저장
  const saveLocal = useCallback(
    (nextState: {
      clients?: Client[]
      projects?: SaleProject[]
      expenses?: Expense[]
      ledger?: LedgerEntry[]
    }) => {
      try {
        const current = {
          clients,
          projects,
          expenses,
          ledger,
          ...nextState,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
      } catch (err) {
        console.error('LocalStorage 저장 실패:', err)
      }
    },
    [clients, projects, expenses, ledger],
  )

  // Supabase DB 데이터 불러오기 (실패 시 무시)
  const fetchData = useCallback(async () => {
    if (!supabase) return
    try {
      const [pRes, eRes, lRes, cRes] = await Promise.all([
        supabase.from('sale_projects').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('ledger_entries').select('*'),
        supabase.from('clients').select('*'),
      ])

      if (pRes.data && pRes.data.length > 0) {
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
      if (eRes.data && eRes.data.length > 0) {
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
      if (lRes.data && lRes.data.length > 0) {
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
      if (cRes.data && cRes.data.length > 0) {
        setClients(
          cRes.data.map((item) => ({
            id: item.id,
            name: item.name,
            bizNumber: item.biz_number,
            contact: item.contact,
          })),
        )
      }
    } catch (err) {
      console.warn('Supabase 데이터 로드 생략 (로컬 데이터 사용):', err)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 전체 데이터 비우기
  const resetData = useCallback(async () => {
    setClients([])
    setProjects([])
    setExpenses([])
    setLedger([])
    localStorage.removeItem(STORAGE_KEY)

    if (supabase) {
      try {
        await Promise.all([
          supabase.from('sale_projects').delete().neq('id', ''),
          supabase.from('expenses').delete().neq('id', ''),
          supabase.from('ledger_entries').delete().neq('id', ''),
          supabase.from('clients').delete().neq('id', ''),
        ])
      } catch (e) {
        /* 무시 */
      }
    }
  }, [])

  // 거래처 관리
  const addClient = useCallback(
    async (c: NewClient) => {
      const newClient: Client = { id: uid('c'), ...c }
      const next = [...clients, newClient]
      setClients(next)
      saveLocal({ clients: next })

      if (supabase) {
        try {
          await supabase.from('clients').insert({
            id: newClient.id,
            name: c.name,
            biz_number: c.bizNumber,
            contact: c.contact,
          })
        } catch (e) {
          /* 무시 */
        }
      }
    },
    [clients, saveLocal],
  )

  const updateClient = useCallback(
    async (id: string, c: NewClient) => {
      const next = clients.map((item) => (item.id === id ? { ...item, ...c } : item))
      setClients(next)
      saveLocal({ clients: next })

      if (supabase) {
        try {
          await supabase
            .from('clients')
            .update({
              name: c.name,
              biz_number: c.bizNumber,
              contact: c.contact,
            })
            .eq('id', id)
        } catch (e) {
          /* 무시 */
        }
      }
    },
    [clients, saveLocal],
  )

  const deleteClient = useCallback(
    async (id: string) => {
      const nextClients = clients.filter((item) => item.id !== id)
      const nextProjects = projects.filter((item) => item.clientId !== id)
      setClients(nextClients)
      setProjects(nextProjects)
      saveLocal({ clients: nextClients, projects: nextProjects })

      if (supabase) {
        try {
          await supabase.from('clients').delete().eq('id', id)
          await supabase.from('sale_projects').delete().eq('client_id', id)
        } catch (e) {
          /* 무시 */
        }
      }
    },
    [clients, projects, saveLocal],
  )

  // 수금 단계 계산
  const buildStages = (supplyAmount: number, ratios: Record<StageKey, number>) =>
    (['advance', 'interim', 'balance'] as StageKey[]).map((key) => ({
      key,
      amount: Math.round((supplyAmount * ratios[key]) / 100),
      paid: false,
    }))

  // 프로젝트(매출) 관리
  const addProject = useCallback(
    async (p: NewProject) => {
      const today = new Date().toISOString().slice(0, 10)
      const newProject: SaleProject = {
        id: uid('p'),
        clientId: p.clientId,
        title: p.title,
        date: p.date || today,
        supplyAmount: p.supplyAmount,
        stages: buildStages(p.supplyAmount, p.stageRatios),
      }

      const next = [...projects, newProject]
      setProjects(next)
      saveLocal({ projects: next })

      if (supabase) {
        try {
          await supabase.from('sale_projects').insert({
            id: newProject.id,
            client_id: p.clientId,
            title: p.title,
            date: newProject.date,
            supply_amount: p.supplyAmount,
            stages: newProject.stages,
          })
        } catch (e) {
          /* 무시 */
        }
      }
    },
    [projects, saveLocal],
  )

  const updateProject = useCallback(
    async (id: string, p: NewProject) => {
      const today = new Date().toISOString().slice(0, 10)
      const current = projects.find((item) => item.id === id)
      const rebuilt = buildStages(p.supplyAmount, p.stageRatios)
      const updatedStages = rebuilt.map((s) => {
        const prevStage = current?.stages.find((ps) => ps.key === s.key)
        return prevStage
          ? { ...s, paid: prevStage.paid, paidDate: prevStage.paidDate }
          : s
      })

      const next = projects.map((item) =>
        item.id === id
          ? {
              ...item,
              clientId: p.clientId,
              title: p.title,
              date: p.date || current?.date || today,
              supplyAmount: p.supplyAmount,
              stages: updatedStages,
            }
          : item,
      )
      setProjects(next)
      saveLocal({ projects: next })

      if (supabase) {
        try {
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
        } catch (e) {
          /* 무시 */
        }
      }
    },
    [projects, saveLocal],
  )

  const deleteProject = useCallback(
    async (id: string) => {
      const next = projects.filter((item) => item.id !== id)
      setProjects(next)
      saveLocal({ projects: next })

      if (supabase) {
        try {
          await supabase.from('sale_projects').delete().eq('id', id)
        } catch (e) {
          /* 무시 */
        }
      }
    },
    [projects, saveLocal],
  )

  // 수금 완료 토글
  const toggleStage = useCallback(
    async (projectId: string, stageKey: StageKey) => {
      const today = new Date().toISOString().slice(0, 10)
      const target = projects.find((p) => p.id === projectId)
      if (!target) return

      const newStages = target.stages.map((s) =>
        s.key === stageKey
          ? { ...s, paid: !s.paid, paidDate: !s.paid ? today : undefined }
          : s,
      )

      const next = projects.map((p) =>
        p.id === projectId ? { ...p, stages: newStages } : p,
      )
      setProjects(next)
      saveLocal({ projects: next })

      if (supabase) {
        try {
          await supabase
            .from('sale_projects')
            .update({ stages: newStages })
            .eq('id', projectId)
        } catch (e) {
          /* 무시 */
        }
      }
    },
    [projects, saveLocal],
  )

  // 간편장부 관리
  const addLedger = useCallback(
    async (e: NewLedger) => {
      const newEntry: LedgerEntry = { id: uid('l'), ...e }
      const next = [newEntry, ...ledger]
      setLedger(next)
      saveLocal({ ledger: next })

      if (supabase) {
        try {
          await supabase.from('ledger_entries').insert({
            id: newEntry.id,
            date: e.date,
            party: e.party,
            kind: e.kind,
            amount: e.amount,
            vat_included: e.vatIncluded,
            taxable: e.taxable,
            memo: e.memo,
          })
        } catch (err) {
          /* 무시 */
        }
      }
    },
    [ledger, saveLocal],
  )

  const updateLedger = useCallback(
    async (id: string, e: NewLedger) => {
      const next = ledger.map((item) => (item.id === id ? { ...item, ...e } : item))
      setLedger(next)
      saveLocal({ ledger: next })

      if (supabase) {
        try {
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
        } catch (err) {
          /* 무시 */
        }
      }
    },
    [ledger, saveLocal],
  )

  const deleteLedger = useCallback(
    async (id: string) => {
      const next = ledger.filter((item) => item.id !== id)
      setLedger(next)
      saveLocal({ ledger: next })

      if (supabase) {
        try {
          await supabase.from('ledger_entries').delete().eq('id', id)
        } catch (err) {
          /* 무시 */
        }
      }
    },
    [ledger, saveLocal],
  )

  // 지출 관리
  const addExpense = useCallback(
    async (e: NewExpense) => {
      const newExpense: Expense = { id: uid('e'), ...e }
      const next = [newExpense, ...expenses]
      setExpenses(next)
      saveLocal({ expenses: next })

      if (supabase) {
        try {
          await supabase.from('expenses').insert({
            id: newExpense.id,
            date: e.date,
            vendor: e.vendor,
            description: e.description,
            category: e.category,
            supply_amount: e.supplyAmount,
            withholding: e.withholding,
          })
        } catch (err) {
          /* 무시 */
        }
      }
    },
    [expenses, saveLocal],
  )

  const updateExpense = useCallback(
    async (id: string, e: NewExpense) => {
      const next = expenses.map((item) =>
        item.id === id ? { ...item, ...e } : item,
      )
      setExpenses(next)
      saveLocal({ expenses: next })

      if (supabase) {
        try {
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
        } catch (err) {
          /* 무시 */
        }
      }
    },
    [expenses, saveLocal],
  )

  const deleteExpense = useCallback(
    async (id: string) => {
      const next = expenses.filter((item) => item.id !== id)
      setExpenses(next)
      saveLocal({ expenses: next })

      if (supabase) {
        try {
          await supabase.from('expenses').delete().eq('id', id)
        } catch (err) {
          /* 무시 */
        }
      }
    },
    [expenses, saveLocal],
  )

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
