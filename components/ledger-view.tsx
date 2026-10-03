'use client'

import { useMemo, useState } from 'react'
import { Check, Download, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react'
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
  formatWon,
  type LedgerEntry,
  type LedgerKind,
  type PaymentMethod,
} from '@/lib/finance'

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'transfer', label: '계좌이체' },
  { value: 'card', label: '카드' },
  { value: 'cash', label: '현금' },
  { value: 'other', label: '기타' },
]

const ITEMS_PER_PAGE = 10

const today = () => new Date().toISOString().slice(0, 10)

const formatNumberInput = (val: string) => {
  const nums = val.replace(/[^0-9]/g, '')
  return nums ? Number(nums).toLocaleString('ko-KR') : ''
}

const parseAmount = (val: string) => Number(val.replace(/[^0-9]/g, '')) || 0

type FormState = {
  date: string
  party: string
  kind: LedgerKind
  amount: string
  paymentMethod: PaymentMethod
  memo: string
}

const emptyForm = (): FormState => ({
  date: today(),
  party: '',
  kind: 'sale',
  amount: '',
  paymentMethod: 'transfer',
  memo: '',
})

type LedgerFilter = 'all' | 'sale' | 'expense'

export function LedgerView() {
  const { ledger, addLedger } = useFinance()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [filter, setFilter] = useState<LedgerFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const parsedAmount = parseAmount(form.amount)
  const canSubmit = form.party.trim().length > 0 && parsedAmount > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    addLedger({
      date: form.date || today(),
      party: form.party.trim(),
      kind: form.kind,
      amount: parsedAmount,
      paymentMethod: form.paymentMethod,
      memo: form.memo.trim(),
    })

    setForm(emptyForm())
  }

  const sorted = useMemo(
    () => [...ledger].sort((a, b) => b.date.localeCompare(a.date)),
    [ledger],
  )

  const filteredSorted = useMemo(() => {
    if (filter === 'all') return sorted
    return sorted.filter((entry) => entry.kind === filter)
  }, [sorted, filter])

  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / ITEMS_PER_PAGE))
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredSorted.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredSorted, currentPage])

  const handleFilterChange = (newFilter: LedgerFilter) => {
    setFilter(newFilter)
    setCurrentPage(1)
  }

  const handleDownloadCsv = () => {
    if (filteredSorted.length === 0) return

    const headers = ['구분', '일자', '거래처명', '결제수단', '금액', '메모']

    const rows = filteredSorted.map((entry) => [
      LEDGER_KIND_LABELS[entry.kind],
      entry.date,
      `"${(entry.party || '').replace(/"/g, '""')}"`,
      PAYMENT_METHOD_LABELS[entry.paymentMethod || 'transfer'],
      entry.amount,
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
    <div className="flex flex-col gap-6 w-full max-w-full overflow-hidden">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr] items-start w-full min-w-0">
        {/* 입력 폼 카드 */}
        <Card className="w-full min-w-0 h-fit lg:sticky lg:top-32">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>매출 / 지출 입력</CardTitle>
            <CardDescription>
              등록하면 대시보드 숫자에 즉시 반영됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full min-w-0">
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
                  className="input w-full min-w-0"
                />
              </Field>

              <Field label="거래처명">
                <input
                  type="text"
                  required
                  placeholder="예: 신성기공"
                  value={form.party}
                  onChange={(e) => setForm((f) => ({ ...f, party: e.target.value }))}
                  className="input w-full min-w-0"
                />
              </Field>

              <Field label="결제 / 입금 수단">
                <select
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, paymentMethod: e.target.value as PaymentMethod }))
                  }
                  className="input w-full min-w-0"
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
                  className="input text-right tabular-nums w-full min-w-0"
                />
              </Field>

              <Field label="메모">
                <textarea
                  rows={2}
                  placeholder="선택 입력"
                  value={form.memo}
                  onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                  className="input resize-none w-full min-w-0"
                />
              </Field>

              <Button type="submit" disabled={!canSubmit} className="gap-2 w-full">
                <Plus className="size-4" /> 등록하기
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 내역 목록 카드 */}
        <Card className="w-full min-w-0 flex flex-col">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 pb-4">
            <div>
              <CardTitle>입력 내역</CardTitle>
              <CardDescription>총 {filteredSorted.length}건</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <div className="grid grid-cols-3 rounded-lg bg-muted/50 p-1 min-w-[150px]">
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
                    onClick={() => handleFilterChange(tab.value)}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition-colors text-center ${
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
                className="gap-1.5 shrink-0 text-xs px-2.5 h-8"
              >
                <Download className="size-3.5" /> CSV 다운로드
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 flex-1 flex flex-col">
            {filteredSorted.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                아직 입력한 내역이 없습니다.
              </p>
            ) : (
              <>
                <ul className="flex flex-col divide-y divide-border w-full min-w-0 min-h-[400px]">
                  {paginatedItems.map((entry) => (
                    <LedgerRow key={entry.id} entry={entry} />
                  ))}
                </ul>

                {/* 페이지네이션 콘트롤 */}
                {totalPages > 1 && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {currentPage} / {totalPages} 페이지
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const { updateLedger, deleteLedger } = useFinance()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<FormState>({
    date: entry.date,
    party: entry.party,
    kind: entry.kind,
    amount: Number(entry.amount).toLocaleString('ko-KR'),
    paymentMethod: entry.paymentMethod || 'transfer',
    memo: entry.memo || '',
  })

  const isSale = entry.kind === 'sale'

  const startEdit = () => {
    setDraft({
      date: entry.date,
      party: entry.party,
      kind: entry.kind,
      amount: Number(entry.amount).toLocaleString('ko-KR'),
      paymentMethod: entry.paymentMethod || 'transfer',
      memo: entry.memo || '',
    })
    setEditing(true)
  }

  if (editing) {
    const parsed = parseAmount(draft.amount)
    const save = () => {
      if (!draft.party.trim() || parsed <= 0) return
      updateLedger(entry.id, {
        date: draft.date,
        party: draft.party.trim(),
        kind: draft.kind,
        amount: parsed,
        paymentMethod: draft.paymentMethod,
        memo: draft.memo.trim(),
      })
      setEditing(false)
    }

    return (
      <li className="flex flex-col gap-3 py-4 w-full min-w-0">
        <div className="grid gap-2 sm:grid-cols-2 w-full min-w-0">
          <select
            value={draft.kind}
            onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as LedgerKind }))}
            className="input w-full min-w-0 text-xs sm:text-sm"
          >
            <option value="sale">매출</option>
            <option value="expense">지출</option>
          </select>
          <input
            type="date"
            value={draft.date}
            onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
            className="input w-full min-w-0 text-xs sm:text-sm"
          />
          <input
            type="text"
            value={draft.party}
            onChange={(e) => setDraft((d) => ({ ...d, party: e.target.value }))}
            className="input w-full min-w-0 text-xs sm:text-sm"
            placeholder="거래처명"
          />
          <select
            value={draft.paymentMethod}
            onChange={(e) =>
              setDraft((d) => ({ ...d, paymentMethod: e.target.value as PaymentMethod }))
            }
            className="input w-full min-w-0 text-xs sm:text-sm"
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
            className="input text-right tabular-nums sm:col-span-2 w-full min-w-0 text-xs sm:text-sm"
            placeholder="금액"
          />
          <input
            type="text"
            value={draft.memo}
            onChange={(e) => setDraft((d) => ({ ...d, memo: e.target.value }))}
            className="input sm:col-span-2 w-full min-w-0 text-xs sm:text-sm"
            placeholder="메모"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="gap-1.5 h-8 text-xs">
            <X className="size-3.5" /> 취소
          </Button>
          <Button size="sm" onClick={save} className="gap-1.5 h-8 text-xs">
            <Check className="size-3.5" /> 저장
          </Button>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-2 sm:gap-3 py-3.5 w-full min-w-0">
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
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
          <span className="truncate text-sm font-medium">{entry.party}</span>
          <span className="shrink-0 text-[11px] sm:text-xs text-muted-foreground">{entry.date}</span>
          <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {PAYMENT_METHOD_LABELS[entry.paymentMethod || 'transfer']}
          </span>
        </div>
        {entry.memo && (
          <p className="truncate text-xs text-muted-foreground mt-0.5">{entry.memo}</p>
        )}
      </div>
      <span
        className={`shrink-0 text-xs sm:text-sm font-semibold tabular-nums ${
          isSale ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
        }`}
      >
        {isSale ? '+' : '-'}
        {formatWon(entry.amount)}
      </span>
      <div className="flex shrink-0 gap-0.5 sm:gap-1">
        <button
          type="button"
          onClick={startEdit}
          aria-label="수정"
          className="rounded-md p-1 sm:p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Pencil className="size-3.5 sm:size-4" />
        </button>
        <button
          type="button"
          onClick={() => deleteLedger(entry.id)}
          aria-label="삭제"
          className="rounded-md p-1 sm:p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5 sm:size-4" />
        </button>
      </div>
    </li>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 w-full min-w-0">
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
      className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors w-full ${
        active
          ? activeClass
          : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
