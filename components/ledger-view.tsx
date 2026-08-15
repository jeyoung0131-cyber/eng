'use client'

import { useMemo, useState } from 'react'
import { Check, Download, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useFinance } from '@/components/finance-provider'
import {
  LEDGER_KIND_LABELS,
  PAYMENT_METHOD_LABELS,
  expenseVat,
  expenseWithholding,
  formatWon,
  ledgerSupply,
  ledgerTaxable,
  ledgerTotal,
  ledgerVat,
  type Expense,
  type ExpenseCategory,
  type LedgerEntry,
  type LedgerKind,
  type PaymentMethod,
} from '@/lib/finance'

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  '원자재',
  '외주가공',
  '인건비',
  '경비',
  '식비·접대비',
  '임차료·관리비',
  '차량·유류비',
  '소모품·집기',
  '통신·공과금',
  '기타',
]

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'transfer', label: '계좌이체' },
  { value: 'card', label: '카드' },
  { value: 'cash', label: '현금' },
  { value: 'other', label: '기타' },
]

const today = () => new Date().toISOString().slice(0, 10)

// 숫자 추출 및 천단위 콤마 포맷팅 헬퍼
const formatNumberInput = (val: string) => {
  const nums = val.replace(/[^0-9]/g, '')
  return nums ? Number(nums).toLocaleString('ko-KR') : ''
}

const parseAmount = (val: string) => Number(val.replace(/[^0-9]/g, '')) || 0

type FormState = {
  date: string
  party: string
  kind: LedgerKind
  category: ExpenseCategory
  amount: string
  vatIncluded: boolean
  taxable: boolean
  withholding: boolean
  paymentMethod: PaymentMethod
  memo: string
}

const emptyForm = (): FormState => ({
  date: today(),
  party: '',
  kind: 'sale',
  category: '경비',
  amount: '',
  vatIncluded: true,
  taxable: true,
  withholding: false,
  paymentMethod: 'transfer',
  memo: '',
})

type VatMode = 'included' | 'excluded' | 'exempt'

const vatModeOf = (f: { taxable: boolean; vatIncluded: boolean }): VatMode =>
  !f.taxable ? 'exempt' : f.vatIncluded ? 'included' : 'excluded'

const applyVatMode = (mode: VatMode) => ({
  taxable: mode !== 'exempt',
  vatIncluded: mode === 'included',
})

const VAT_MODES: { value: VatMode; label: string }[] = [
  { value: 'included', label: '부가세 포함' },
  { value: 'excluded', label: '부가세 별도' },
  { value: 'exempt', label: '비과세' },
]

type LedgerFilter = 'all' | 'sale' | 'expense'

export function LedgerView() {
  const { ledger, addLedger, addExpense, expenses } = useFinance()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [filter, setFilter] = useState<LedgerFilter>('all')

  const parsedAmount = parseAmount(form.amount)
  const canSubmit = form.party.trim().length > 0 && parsedAmount > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    const ledgerDate = form.date || today()
    const partyName = form.party.trim()
    const memoText = form.memo.trim()

    // 1. 장부 작성 내역 추가 (전체 거래 기록)
    addLedger({
      date: ledgerDate,
      party: partyName,
      kind: form.kind,
      amount: parsedAmount,
      vatIncluded: form.vatIncluded,
      taxable: form.taxable,
      paymentMethod: form.paymentMethod,
      memo: memoText,
    })

    // 2. 지출이면서 과세 대상(부가세 발생)이거나 원천징수(3.3%) 대상인 경우 상세 지출 내역에 등록
    if (form.kind === 'expense') {
      const isTaxableOrWithholding = form.taxable || form.withholding

      if (isTaxableOrWithholding) {
        const supplyAmt = !form.taxable
          ? parsedAmount
          : form.vatIncluded
            ? Math.round(parsedAmount / 1.1)
            : parsedAmount

        addExpense({
          date: ledgerDate,
          vendor: partyName,
          category: form.category,
          supplyAmount: supplyAmt,
          description: memoText || `${form.category} 지출`,
          withholding: form.withholding,
        })
      }
    }

    setForm(emptyForm())
  }

  const sorted = useMemo(
    () => [...ledger].sort((a, b) => b.date.localeCompare(a.date)),
    [ledger],
  )

  // 입력 내역 필터링 적용 (전체 / 매출 / 지출)
  const filteredSorted = useMemo(() => {
    if (filter === 'all') return sorted
    return sorted.filter((entry) => entry.kind === filter)
  }, [sorted, filter])

  const sortedExpenses = useMemo(
    () => [...expenses].sort((a, b) => b.date.localeCompare(a.date)),
    [expenses],
  )

  // CSV 다운로드 처리 함수 (필터링된 목록 기준)
  const handleDownloadCsv = () => {
    if (filteredSorted.length === 0) return

    const headers = [
      '구분',
      '일자',
      '거래처명',
      '결제수단',
      '공급가액',
      '부가세',
      '합계금액',
      '비과세여부',
      '메모',
    ]

    const rows = filteredSorted.map((entry) => [
      LEDGER_KIND_LABELS[entry.kind],
      entry.date,
      `"${(entry.party || '').replace(/"/g, '""')}"`,
      PAYMENT_METHOD_LABELS[entry.paymentMethod || 'transfer'],
      ledgerSupply(entry),
      ledgerTaxable(entry) ? ledgerVat(entry) : 0,
      ledgerTotal(entry),
      ledgerTaxable(entry) ? '과세' : '비과세',
      `"${(entry.memo || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.setAttribute('download', `거래내역_${today()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit lg:sticky lg:top-32">
          <CardHeader>
            <CardTitle>매출 / 지출 입력</CardTitle>
            <CardDescription>
              등록하면 대시보드 숫자에 즉시 반영됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                <KindButton
                  active={form.kind === 'sale'}
                  onClick={() => setForm((f) => ({ ...f, kind: 'sale' }))}
                  variant="sale"
                >
                  매출
                </KindButton>
                <KindButton
                  active={form.kind === 'expense'}
                  onClick={() => setForm((f) => ({ ...f, kind: 'expense' }))}
                  variant="expense"
                >
                  지출
                </KindButton>
              </div>

              <Field label="날짜">
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="input"
                />
              </Field>

              <Field label="거래처명">
                <input
                  type="text"
                  required
                  placeholder="예: 신성기공"
                  value={form.party}
                  onChange={(e) => setForm((f) => ({ ...f, party: e.target.value }))}
                  className="input"
                />
              </Field>

              {/* 지출 선택 시 카테고리 옵션 */}
              {form.kind === 'expense' && (
                <Field label="지출 카테고리">
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))
                    }
                    className="input"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label="결제 / 입금 수단">
                <select
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, paymentMethod: e.target.value as PaymentMethod }))
                  }
                  className="input"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="금액 (원)">
                <input
                  inputMode="numeric"
                  required
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: formatNumberInput(e.target.value) }))
                  }
                  className="input text-right tabular-nums"
                />
              </Field>

              <Field label="부가세 처리">
                <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-muted/50 p-1">
                  {VAT_MODES.map((m) => {
                    const active = vatModeOf(form) === m.value
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, ...applyVatMode(m.value) }))}
                        className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {m.label}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  개인 이체·단순 출금 등 부가세가 없는 거래는 &lsquo;비과세&rsquo;를 선택하세요.
                </p>
              </Field>

              {/* 지출 선택 시 원천징수 대상 여부 선택 */}
              {form.kind === 'expense' && (
                <label className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-2.5 text-xs font-medium cursor-pointer hover:bg-muted/40">
                  <input
                    type="checkbox"
                    checked={form.withholding}
                    onChange={(e) => setForm((f) => ({ ...f, withholding: e.target.checked }))}
                    className="size-4 accent-primary"
                  />
                  <span>원천징수(3.3%) 대상 지출 (인건비/프리랜서 등)</span>
                </label>
              )}

              {parsedAmount > 0 && (
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>공급가액</span>
                    <span className="tabular-nums text-foreground">
                      {formatWon(
                        !form.taxable
                          ? parsedAmount
                          : form.vatIncluded
                            ? Math.round(parsedAmount / 1.1)
                            : parsedAmount,
                      )}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span>부가세 (10%)</span>
                    <span className="tabular-nums text-foreground">
                      {!form.taxable
                        ? '비과세'
                        : formatWon(
                            form.vatIncluded
                              ? parsedAmount - Math.round(parsedAmount / 1.1)
                              : Math.round(parsedAmount * 0.1),
                          )}
                    </span>
                  </div>
                </div>
              )}

              <Field label="메모">
                <textarea
                  rows={2}
                  placeholder="선택 입력"
                  value={form.memo}
                  onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                  className="input resize-none"
                />
              </Field>

              <Button type="submit" disabled={!canSubmit} className="gap-2">
                <Plus className="size-4" /> 등록하기
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
            <div>
              <CardTitle>입력 내역</CardTitle>
              <CardDescription>총 {filteredSorted.length}건</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {/* 전체 / 매출 / 지출 필터 탭 */}
              <div className="grid grid-cols-3 rounded-lg bg-muted/50 p-1">
                {(
                  [
                    { value: 'all', label: '전체' },
                    { value: 'sale', label: '매출' },
                    { value: 'expense', label: '지출' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setFilter(tab.value)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      filter === tab.value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCsv}
                disabled={filteredSorted.length === 0}
                className="gap-1.5 shrink-0"
              >
                <Download className="size-4" /> CSV 다운로드
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredSorted.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                아직 입력한 내역이 없습니다.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {filteredSorted.map((entry) => (
                  <LedgerRow key={entry.id} entry={entry} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>상세 지출 내역 (원천징수 · 매입세액 대상)</CardTitle>
          <CardDescription>
            총 {sortedExpenses.length}건 · 대시보드의 총 지출·매입세액·원천징수에 반영됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedExpenses.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              등록된 지출이 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {sortedExpenses.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

type ExpenseDraft = {
  date: string
  vendor: string
  description: string
  category: ExpenseCategory
  supplyAmount: string
  withholding: boolean
}

function ExpenseRow({ expense }: { expense: Expense }) {
  const { updateExpense, deleteExpense } = useFinance()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<ExpenseDraft>({
    date: expense.date,
    vendor: expense.vendor,
    description: expense.description,
    category: expense.category,
    supplyAmount: Number(expense.supplyAmount).toLocaleString('ko-KR'),
    withholding: expense.withholding,
  })

  if (editing) {
    const parsed = parseAmount(draft.supplyAmount)
    const save = () => {
      if (!draft.vendor.trim() || parsed <= 0) return
      updateExpense(expense.id, {
        date: draft.date,
        vendor: draft.vendor.trim(),
        description: draft.description.trim(),
        category: draft.category,
        supplyAmount: parsed,
        withholding: draft.withholding,
      })
      setEditing(false)
    }
    return (
      <li className="flex flex-col gap-3 py-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="date"
            value={draft.date}
            onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
            className="input"
          />
          <select
            value={draft.category}
            onChange={(e) =>
              setDraft((d) => ({ ...d, category: e.target.value as ExpenseCategory }))
            }
            className="input"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={draft.vendor}
            onChange={(e) => setDraft((d) => ({ ...d, vendor: e.target.value }))}
            className="input"
            placeholder="공급자"
          />
          <input
            inputMode="numeric"
            value={draft.supplyAmount}
            onChange={(e) =>
              setDraft((d) => ({ ...d, supplyAmount: formatNumberInput(e.target.value) }))
            }
            className="input text-right tabular-nums"
            placeholder="공급가액"
          />
          <input
            type="text"
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            className="input sm:col-span-2"
            placeholder="내용"
          />
          <label className="flex items-center gap-2 text-sm sm:col-span-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.withholding}
              onChange={(e) => setDraft((d) => ({ ...d, withholding: e.target.checked }))}
              className="size-4 accent-primary"
            />
            원천징수(3.3%) 대상
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="gap-1.5">
            <X className="size-4" /> 취소
          </Button>
          <Button size="sm" onClick={save} className="gap-1.5">
            <Check className="size-4" /> 저장
          </Button>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 py-3.5">
      <span className="inline-flex shrink-0 items-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
        {expense.category}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{expense.vendor}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{expense.date}</span>
          {expense.withholding && (
            <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              원천징수
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {expense.description}
          {' · 부가세 '}
          {formatWon(expenseVat(expense))}
          {expense.withholding && ` · 원천징수 ${formatWon(expenseWithholding(expense))}`}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-destructive">
        -{formatWon(expense.supplyAmount)}
      </span>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="수정"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => deleteExpense(expense.id)}
          aria-label="삭제"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  )
}

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const { updateLedger, deleteLedger } = useFinance()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<FormState>({
    date: entry.date,
    party: entry.party,
    kind: entry.kind,
    category: '경비',
    amount: Number(entry.amount).toLocaleString('ko-KR'),
    vatIncluded: entry.vatIncluded,
    taxable: entry.taxable !== false,
    withholding: false,
    paymentMethod: entry.paymentMethod || 'transfer',
    memo: entry.memo,
  })

  const isSale = entry.kind === 'sale'

  if (editing) {
    const parsed = parseAmount(draft.amount)
    const save = () => {
      if (!draft.party.trim() || parsed <= 0) return
      updateLedger(entry.id, {
        date: draft.date,
        party: draft.party.trim(),
        kind: draft.kind,
        amount: parsed,
        vatIncluded: draft.vatIncluded,
        taxable: draft.taxable,
        paymentMethod: draft.paymentMethod,
        memo: draft.memo.trim(),
      })
      setEditing(false)
    }
    return (
      <li className="flex flex-col gap-3 py-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            value={draft.kind}
            onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as LedgerKind }))}
            className="input"
          >
            <option value="sale">매출</option>
            <option value="expense">지출</option>
          </select>
          <input
            type="date"
            value={draft.date}
            onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
            className="input"
          />
          <input
            type="text"
            value={draft.party}
            onChange={(e) => setDraft((d) => ({ ...d, party: e.target.value }))}
            className="input"
            placeholder="거래처명"
          />
          <select
            value={draft.paymentMethod}
            onChange={(e) =>
              setDraft((d) => ({ ...d, paymentMethod: e.target.value as PaymentMethod }))
            }
            className="input"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <input
            inputMode="numeric"
            value={draft.amount}
            onChange={(e) =>
              setDraft((d) => ({ ...d, amount: formatNumberInput(e.target.value) }))
            }
            className="input text-right tabular-nums sm:col-span-2"
            placeholder="금액"
          />
          <input
            type="text"
            value={draft.memo}
            onChange={(e) => setDraft((d) => ({ ...d, memo: e.target.value }))}
            className="input sm:col-span-2"
            placeholder="메모"
          />
          <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-muted/50 p-1 sm:col-span-2">
            {VAT_MODES.map((m) => {
              const active = vatModeOf(draft) === m.value
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, ...applyVatMode(m.value) }))}
                  className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="gap-1.5">
            <X className="size-4" /> 취소
          </Button>
          <Button size="sm" onClick={save} className="gap-1.5">
            <Check className="size-4" /> 저장
          </Button>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 py-3.5">
      <span
        className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
          isSale
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            : 'bg-destructive/15 text-destructive'
        }`}
      >
        {LEDGER_KIND_LABELS[entry.kind]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{entry.party}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{entry.date}</span>
          <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {PAYMENT_METHOD_LABELS[entry.paymentMethod || 'transfer']}
          </span>
          {!ledgerTaxable(entry) && (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              비과세
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {entry.memo || (isSale ? '매출 입력' : '지출 입력')}
          {' · 공급가 '}
          {formatWon(ledgerSupply(entry))}
          {ledgerTaxable(entry) ? ` · 부가세 ${formatWon(ledgerVat(entry))}` : ' · 부가세 없음'}
        </p>
      </div>
      <span
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          isSale ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
        }`}
      >
        {isSale ? '+' : '-'}
        {formatWon(ledgerTotal(entry))}
      </span>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="수정"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => deleteLedger(entry.id)}
          aria-label="삭제"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}

function KindButton({
  active,
  onClick,
  variant,
  children,
}: {
  active: boolean
  onClick: () => void
  variant: 'sale' | 'expense'
  children: React.ReactNode
}) {
  const activeClass =
    variant === 'sale'
      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      : 'border-destructive bg-destructive/10 text-destructive'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
        active
          ? activeClass
          : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
