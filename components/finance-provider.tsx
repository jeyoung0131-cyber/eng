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
  isLocked: boolean // 잠금 상태 여부
  unlockFinance: (password: string) => boolean // 잠금 해제 함수
  lockFinance: () => void // 다시 잠그는 함수
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
  
  // 잠금 상태 관리 (기본값: true = 잠김 상태)
  const [isLocked, setIsLocked] = useState(true)

  // 비밀번호 확인 및 잠금 해제 (기본 비번: '1234' - 필요시 변경하세요)
  const unlockFinance = useCallback((password: string) => {
    if (password === '0411') {
      setIsLocked(false)
      return true
    }
    alert('비밀번호가 틀렸습니다.')
    return false
  }, [])

  const lockFinance = useCallback(() => {
    setIsLocked(true)
  }, [])

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
    if (isLocked) {
      alert('잠금 상태에서는 초기화할 수 없습니다. 먼저 잠금을 해제해주세요.')
      return
    }
    setClients([])
    setProjects([])
    setExpenses([])
    setLedger([])
    await saveData({ clients: [], projects: [], expenses: [], ledger: [] })
  }, [isLocked, saveData])

  const addClient = useCallback(
    (c: NewClient) => {
      if (isLocked) return alert('잠금 상태입니다. 편집 모드로 전환해주세요.')
      const newClient: Client = { id: uid('c'), ...c }
      const next = [...clients, newClient]
      setClients(next)
      saveData({ clients: next })
    },
    [isLocked, clients, saveData],
  )

  const updateClient = useCallback(
    (id: string, c: NewClient) => {
      if (isLocked) return alert('잠금 상태입니다. 편집 모드로 전환해주세요.')
      const next = clients.map((item) => (item.id === id ? { ...item, ...c } : item))
      setClients(next)
      saveData({ clients: next })
    },
    [isLocked, clients, saveData],
  )

  const deleteClient = useCallback(
    (id: string) => {
      if (isLocked) return alert('잠금 상태입니다. 편집 모드로 전환해주세요.')
      const nextClients = clients.filter((item) => item.id !== id)
      const nextProjects = projects.filter((item) => item.clientId !== id)
      setClients(nextClients)
      setProjects(nextProjects)
      saveData({ clients: nextClients, projects: nextProjects })
    },
    [isLocked, clients, projects, saveData],
  )

  const buildStages = (supplyAmount: number, ratios: Record<StageKey, number>) =>
    (['advance', 'interim', 'balance'] as StageKey[]).map((key) => ({
      key,
      amount: Math.round((supplyAmount * ratios[key]) / 100),
      paid: false,
    }))

  const addProject = useCallback(
    (p: NewProject) => {
      if (isLocked) return alert('잠금 상태입니다. 편집 모드로 전환해주세요.')
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
    [isLocked, projects, saveData],
  )

  const updateProject = useCallback(
    (id: string, p: NewProject) => {
      if (isLocked) return alert('잠금 상태입니다. 편집 모드로 전환해주세요.')
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
    [isLocked, projects, saveData],
  )

  const deleteProject = useCallback(
    (id: string) => {
      if (isLocked) return alert('잠금 상태입니다. 편집 모드로 전환해주세요.')
      const next = projects.filter((item) => item.id !== id)
      setProjects(next)
      saveData({ projects: next })
    },
    [isLocked, projects, saveData],
  )

  const toggleStage = useCallback(
    (projectId: string, stageKey: StageKey) => {
      if (isLocked) return alert('잠금 상태입니다. 편집 모드로 전환해주세요.')
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
    [isLocked, projects, saveData],
  )

  const addLedger = useCallback(
    (e: NewLedger) => {
      if (isLocked) return alert('잠금 상태입니다. 편집 모드로 전환해주세요.')
      const newEntry: LedgerEntry = { id: uid('l'), ...e }
      const next = [newEntry, ...ledger]
      setLedger(next)
      saveData({ ledger: next })
    },
    [isLocked, ledger, saveData],
  )

  const updateLedger = useCallback(
    (id: string, e: NewLedger) => {
      if (isLocked) return alert('잠금 상태입니다. 편집 모드로 전환해주세요.')
      const next = ledger.map((item) => (item.id === id ? { ...item, ...e } : item))
      setLedger(next)
      saveData({ ledger: next })
    },
    [isLocked, ledger, saveData],
  )

  const deleteLedger = useCallback(
    (id: string) => {
      if (isLocked) return alert('잠금 상태입니다. 편집 모드로 전환해주세요.')
      const next = ledger.filter((item) => item.id !== id)
      setLedger(next)
      saveData({ ledger: next })
    },
    [isLocked, ledger, saveData],
  )

  const addExpense = useCallback(
    (e: NewExpense) => {
      if (isLocked) return alert('잠금 상태입니다. 편집 모드로 전환해주세요.')
      const newExpense: Expense = { id: uid('e'), ...e }
      const next = [newExpense, ...expenses]
      setExpenses(next)
      saveData({ expenses: next })
    },
    [isLocked, expenses, saveData],
  )

  const updateExpense = useCallback(
    (id: string, e: NewExpense) => {
      if (isLocked) return alert('잠금 상태입니다. 편집 모드로 전환해주세요.')
      const next = expenses.map((item) =>
        item.id === id ? { ...item, ...e } : item,
      )
      setExpenses(next)
      saveData({ expenses: next })
    },
    [isLocked, expenses, saveData],
  )

  const deleteExpense = useCallback(
    (id: string) => {
      if (isLocked) return alert('잠금 상태입니다. 편집 모드로 전환해주세요.')
      const next = expenses.filter((item) => item.id !== id)
      setExpenses(next)
      saveData({ expenses: next })
    },
    [isLocked, expenses, saveData],
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
      isLocked,
      unlockFinance,
      lockFinance,
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
      isLocked,
      unlockFinance,
      lockFinance,
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
