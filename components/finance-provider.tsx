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
  isLoading: boolean
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
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/finance', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data && typeof data === 'object') {
          setClients(data.clients || [])
          setProjects(data.projects || [])
          setExpenses(data.expenses || [])
          setLedger(data.ledger || [])
        }
      }
    } catch (err) {
      console.error('데이터 동기화 에러:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const saveData = useCallback(
    async (nextState: {
      clients?: Client[]
      projects?: SaleProject[]
      expenses?: Expense[]
      ledger?: LedgerEntry[]
    }) => {
      const payload = {
        clients,
        projects,
        expenses,
        ledger,
        ...nextState,
      }
      try {
        await fetch('/api/finance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } catch (err) {
        console.error('데이터 저장 실패:', err)
      }
    },
    [clients, projects, expenses, ledger],
  )

  const resetData = useCallback(async () => {
    setClients([])
    setProjects([])
    setExpenses([])
    setLedger([])
    await saveData({ clients: [], projects: [], expenses: [], ledger: [] })
  }, [saveData])

  const addClient = useCallback(
    (c: NewClient) => {
      const newClient: Client = { id: uid('c'), ...c }
      const next = [...clients, newClient]
      setClients(next)
      saveData({ clients: next })
    },
    [clients, saveData],
  )

  const updateClient = useCallback(
    (id: string, c: NewClient) => {
      const next = clients.map((item) => (item.id === id ? { ...item, ...c } : item))
      setClients(next)
      saveData({ clients: next })
    },
    [clients, saveData],
  )

  const deleteClient = useCallback(
    (id: string) => {
      const nextClients = clients.filter((item) => item.id !== id)
      const nextProjects = projects.filter((item) => item.clientId !== id)
      setClients(nextClients)
      setProjects(nextProjects)
      saveData({ clients: nextClients, projects: nextProjects })
    },
    [clients, projects, saveData],
  )

  const buildStages = (supplyAmount: number, ratios: Record<StageKey, number>) =>
    (['advance', 'interim', 'balance'] as StageKey[]).map((key) => ({
      key,
      amount: Math.round((supplyAmount * ratios[key]) / 100),
      paid: false,
    }))

  const addProject = useCallback(
    (p: NewProject) => {
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
      saveData({ projects: next })
    },
    [projects, saveData],
  )

  const updateProject = useCallback(
    (id: string, p: NewProject) => {
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
      saveData({ projects: next })
    },
    [projects, saveData],
  )

  const deleteProject = useCallback(
    (id: string) => {
      const next = projects.filter((item) => item.id !== id)
      setProjects(next)
      saveData({ projects: next })
    },
    [projects, saveData],
  )

  const toggleStage = useCallback(
    (projectId: string, stageKey: StageKey) => {
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
      saveData({ projects: next })
    },
    [projects, saveData],
  )

  const addLedger = useCallback(
    (e: NewLedger) => {
      const newEntry: LedgerEntry = { id: uid('l'), ...e }
      const next = [newEntry, ...ledger]
      setLedger(next)
      saveData({ ledger: next })
    },
    [ledger, saveData],
  )

  const updateLedger = useCallback(
    (id: string, e: NewLedger) => {
      const next = ledger.map((item) => (item.id === id ? { ...item, ...e } : item))
      setLedger(next)
      saveData({ ledger: next })
    },
    [ledger, saveData],
  )

  const deleteLedger = useCallback(
    (id: string) => {
      const next = ledger.filter((item) => item.id !== id)
      setLedger(next)
      saveData({ ledger: next })
    },
    [ledger, saveData],
  )

  const addExpense = useCallback(
    (e: NewExpense) => {
      const newExpense: Expense = { id: uid('e'), ...e }
      const next = [newExpense, ...expenses]
      setExpenses(next)
      saveData({ expenses: next })
    },
    [expenses, saveData],
  )

  const updateExpense = useCallback(
    (id: string, e: NewExpense) => {
      const next = expenses.map((item) =>
        item.id === id ? { ...item, ...e } : item,
      )
      setExpenses(next)
      saveData({ expenses: next })
    },
    [expenses, saveData],
  )

  const deleteExpense = useCallback(
    (id: string) => {
      const next = expenses.filter((item) => item.id !== id)
      setExpenses(next)
      saveData({ expenses: next })
    },
    [expenses, saveData],
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
      isLoading,
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
      isLoading,
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
