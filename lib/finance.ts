export const VAT_RATE = 0.1 // 부가세 10%
export const WITHHOLDING_RATE = 0.033 // 원천징수 3.3%

export type StageKey = 'advance' | 'interim' | 'balance'

export const STAGE_LABELS: Record<StageKey, string> = {
  advance: '선수금',
  interim: '중도금',
  balance: '잔금',
}

export type PaymentStage = {
  key: StageKey
  amount: number // 공급가액 기준 단계 금액
  paid: boolean
  paidDate?: string
}

export type Client = {
  id: string
  name: string
  bizNumber: string
  contact: string
}

// 매출 프로젝트 (거래처별 계약 + 단계별 대금)
export type SaleProject = {
  id: string
  clientId: string
  title: string
  date: string
  supplyAmount: number // 공급가액
  stages: PaymentStage[]
}

// 간편 장부 항목 (매출/지출 직접 입력)
export type LedgerKind = 'sale' | 'expense'

// 결제 / 입금 수단 타입 및 표기 라벨
export type PaymentMethod = 'transfer' | 'card' | 'cash' | 'other'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  transfer: '계좌이체',
  card: '카드',
  cash: '현금',
  other: '기타',
}

export type LedgerEntry = {
  id: string
  date: string
  party: string // 거래처명 / 공급자
  kind: LedgerKind
  amount: number // 사용자가 입력한 금액
  vatIncluded: boolean // true면 amount가 부가세 포함 금액
  taxable?: boolean // false면 비과세(개인 이체·단순 출금 등) — 부가세 미적용
  paymentMethod?: PaymentMethod // 결제 / 입금 수단
  memo: string
  projectId?: string // 연동용 프로젝트 ID
  stageKey?: StageKey // 연동용 단계 Key
}

export const LEDGER_KIND_LABELS: Record<LedgerKind, string> = {
  sale: '매출',
  expense: '지출',
}

/** 과세 대상 여부 (기존 데이터 호환: 미지정이면 과세로 간주) */
export function ledgerTaxable(e: LedgerEntry) {
  return e.taxable !== false
}

/** 입력 금액 기준 공급가액 (부가세 포함이면 역산, 비과세면 전액) */
export function ledgerSupply(e: LedgerEntry) {
  if (!ledgerTaxable(e)) return e.amount
  return e.vatIncluded ? Math.round(e.amount / (1 + VAT_RATE)) : e.amount
}

/** 부가세액 (비과세면 0) */
export function ledgerVat(e: LedgerEntry) {
  if (!ledgerTaxable(e)) return 0
  return Math.round(ledgerSupply(e) * VAT_RATE)
}

/** 합계 (비과세면 입력액 그대로) */
export function ledgerTotal(e: LedgerEntry) {
  return ledgerSupply(e) + ledgerVat(e)
}

// 지출 카테고리 타입 (기타 포함 확장)
export type ExpenseCategory =
  | '원자재'
  | '외주가공'
  | '인건비'
  | '경비'
  | '식비·접대비'
  | '임차료·관리비'
  | '차량·유류비'
  | '소모품·집기'
  | '통신·공과금'
  | '기타'

export type Expense = {
  id: string
  date: string
  vendor: string
  description: string
  category: ExpenseCategory
  supplyAmount: number // 공급가액
  withholding: boolean // 원천징수(3.3%) 대상 여부
}

// ---------- 계산 헬퍼 ----------

export function projectVat(p: SaleProject) {
  return Math.round(p.supplyAmount * VAT_RATE)
}

export function projectTotal(p: SaleProject) {
  return p.supplyAmount + projectVat(p)
}

/** 입금 완료된 단계의 공급가액 합 */
export function projectPaidSupply(p: SaleProject) {
  return p.stages.filter((s) => s.paid).reduce((sum, s) => sum + s.amount, 0)
}

/** 입금 완료 금액(부가세 포함) */
export function projectReceived(p: SaleProject) {
  return Math.round(projectPaidSupply(p) * (1 + VAT_RATE))
}

/** 미수금 (총 계약금액 - 입금액, 부가세 포함) */
export function projectOutstanding(p: SaleProject) {
  return projectTotal(p) - projectReceived(p)
}

/** 입금 진행률 0~1 */
export function projectProgress(p: SaleProject) {
  const total = projectTotal(p)
  if (total <= 0) return 0
  return Math.min(1, projectReceived(p) / total)
}

export function expenseWithholding(e: Expense) {
  return e.withholding ? Math.round(e.supplyAmount * WITHHOLDING_RATE) : 0
}

export function expenseVat(e: Expense) {
  return Math.round(e.supplyAmount * VAT_RATE)
}

export type DashboardTotals = {
  sales: number // 총 매출 (공급가액)
  expenses: number // 총 지출 (공급가액)
  salesVat: number // 매출세액
  purchaseVat: number // 매입세액
  vatPayable: number // 납부예상 부가세
  withholding: number // 원천징수 합계
  outstanding: number // 미수금 합계
  received: number // 총 입금액(부가세 포함)
  netCash: number // 실통장 잔액 (통장 입금액 - 총지출)
}

/**
 * 이중 합산 제거된 정확한 대시보드 집계
 * - 매출/지출/부가세/실통장잔액: 오직 장부 작성(ledger) 기준
 * - 미수금: 프로젝트(projects) 계약 잔액 기준
 */
export function computeTotals(
  projects: SaleProject[],
  expenses: Expense[],
  ledger: LedgerEntry[] = [],
): DashboardTotals {
  const ledgerSales = ledger.filter((e) => e.kind === 'sale')
  const ledgerExpenses = ledger.filter((e) => e.kind === 'expense')

  // 1. 총 매출 공급가액 (오직 장부 기준)
  const sales = ledgerSales.reduce((s, e) => s + ledgerSupply(e), 0)

  // 2. 매출 세액 (오직 장부 기준)
  const salesVat = ledgerSales.reduce((s, e) => s + ledgerVat(e), 0)

  // 3. 미수금 합계 (프로젝트 계약 잔액 기준)
  const outstanding = projects.reduce((s, p) => s + projectOutstanding(p), 0)

  // 4. 총 통장 입금액 (통장에 찍힌 실 입금액: 15,400,000원)
  const received = ledgerSales.reduce((s, e) => s + ledgerTotal(e), 0)

  // 5. 총 지출 공급가액 (14,875,160원)
  const expensesTotal =
    expenses.reduce((s, e) => s + e.supplyAmount, 0) +
    ledgerExpenses.reduce((s, e) => s + ledgerSupply(e), 0)

  // 6. 매입 세액
  const purchaseVat =
    expenses.reduce((s, e) => s + expenseVat(e), 0) +
    ledgerExpenses.reduce((s, e) => s + ledgerVat(e), 0)

  // 7. 원천징수 합계
  const withholding = expenses.reduce((s, e) => s + expenseWithholding(e), 0)

  // 8. 납부 예상 부가세
  const vatPayable = salesVat - purchaseVat

  // 9. 실보유 순자금 (통장 입금액 15,400,000원 - 지출 14,875,160원 = 524,840원)
  const netCash = received - expensesTotal

  return {
    sales,
    expenses: expensesTotal,
    salesVat,
    purchaseVat,
    vatPayable,
    withholding,
    outstanding,
    received,
    netCash,
  }
}

// ---------- 포맷 ----------

export function formatWon(n: number) {
  const sign = n < 0 ? '-' : ''
  return `${sign}₩${new Intl.NumberFormat('ko-KR').format(Math.abs(Math.round(n)))}`
}

export function formatCompactWon(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 100000000) return `${sign}${(abs / 100000000).toFixed(1)}억`
  if (abs >= 10000) return `${sign}${Math.round(abs / 10000).toLocaleString('ko-KR')}만`
  return formatWon(n)
}

// ---------- 월별 집계 (차트용: 이중 합산 완전 제거) ----------

export type MonthlyPoint = { month: string; sales: number; expenses: number }

export function monthlySeries(
  projects: SaleProject[],
  expenses: Expense[],
  ledger: LedgerEntry[] = [],
): MonthlyPoint[] {
  const map = new Map<string, MonthlyPoint>()
  const ensure = (m: string) => {
    if (!map.has(m)) map.set(m, { month: m, sales: 0, expenses: 0 })
    return map.get(m)!
  }

  // 장부(ledger) 기준 월별 매출 & 지출
  for (const e of ledger) {
    if (!e.date) continue
    const m = e.date.slice(0, 7)
    if (e.kind === 'sale') {
      ensure(m).sales += ledgerSupply(e)
    } else {
      ensure(m).expenses += ledgerSupply(e)
    }
  }

  // 직접 등록된 지출 항목(expenses)
  for (const e of expenses) {
    if (!e.date) continue
    const m = e.date.slice(0, 7)
    ensure(m).expenses += e.supplyAmount
  }

  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month))
}

// ---------- XLSX (엑셀 저장용) ----------

export function buildTransactionsCsv(
  clients: Client[],
  projects: SaleProject[],
  expenses: Expense[],
  ledger: LedgerEntry[] = [],
): string {
  const clientName = (id: string) =>
    clients.find((c) => c.id === id)?.name ?? '-'

  const headers = [
    '구분',
    '일자',
    '거래처/공급자',
    '결제수단',
    '내용',
    '공급가액',
    '부가세',
    '원천징수',
    '합계',
    '입금액',
    '미수금',
    '상태',
  ]

  const rows: (string | number)[][] = []

  for (const p of projects) {
    rows.push([
      '매출계약',
      p.date,
      clientName(p.clientId),
      '계좌이체',
      p.title,
      p.supplyAmount,
      projectVat(p),
      0,
      projectTotal(p),
      projectReceived(p),
      projectOutstanding(p),
      projectOutstanding(p) === 0 ? '완납' : '진행중',
    ])
  }

  for (const e of expenses) {
    rows.push([
      '지출',
      e.date,
      e.vendor,
      '계좌이체',
      `[${e.category}] ${e.description}`,
      e.supplyAmount,
      expenseVat(e),
      expenseWithholding(e),
      e.supplyAmount + expenseVat(e) - expenseWithholding(e),
      e.supplyAmount + expenseVat(e) - expenseWithholding(e),
      0,
      '지급',
    ])
  }

  for (const e of ledger) {
    const isSale = e.kind === 'sale'
    const methodLabel = PAYMENT_METHOD_LABELS[e.paymentMethod || 'transfer']
    rows.push([
      LEDGER_KIND_LABELS[e.kind],
      e.date,
      e.party,
      methodLabel,
      e.memo || (isSale ? '매출 입력' : '지출 입력'),
      ledgerSupply(e),
      ledgerVat(e),
      0,
      ledgerTotal(e),
      ledgerTotal(e),
      0,
      isSale ? '입금' : '지급',
    ])
  }

  rows.sort((a, b) => String(a[1]).localeCompare(String(b[1])))

  const tableRows = [headers, ...rows]
    .map(
      (r) =>
        `<tr>${r.map((cell) => `<td>${String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</td>`).join('')}</tr>`,
    )
    .join('')

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"/><style>td { mso-number-format:"\\@"; }</style></head>
<body><table>${tableRows}</table></body></html>`
}

export function downloadCsv(filename: string, content: string) {
  const xlsxFilename = filename.endsWith('.csv')
    ? filename.replace(/\.csv$/, '.xlsx')
    : filename

  const blob = new Blob([content], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = xlsxFilename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
