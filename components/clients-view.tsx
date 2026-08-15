'use client'

import { useState } from 'react'
import {
  Check,
  CircleDashed,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { GaugeBar } from '@/components/gauge-bar'
import { useFinance } from '@/components/finance-provider'
import {
  STAGE_LABELS,
  VAT_RATE,
  formatWon,
  projectOutstanding,
  projectProgress,
  projectReceived,
  projectTotal,
  type Client,
  type SaleProject,
  type StageKey,
} from '@/lib/finance'

const inputCls =
  'h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40'

export function ClientsView() {
  const { clients, projects } = useFinance()

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ClientForm />
        <ProjectForm />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>거래처 &amp; 대금 진행 현황</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              등록된 거래처가 없습니다. 위에서 거래처를 추가해 주세요.
            </p>
          ) : (
            clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                clientProjects={projects.filter((p) => p.clientId === client.id)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ClientCard({
  client,
  clientProjects,
}: {
  client: Client
  clientProjects: SaleProject[]
}) {
  const { updateClient, deleteClient } = useFinance()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(client.name)
  const [bizNumber, setBizNumber] = useState(client.bizNumber)
  const [contact, setContact] = useState(client.contact)

  const startEdit = () => {
    setName(client.name)
    setBizNumber(client.bizNumber)
    setContact(client.contact)
    setEditing(true)
  }

  const save = () => {
    if (!name.trim()) return
    updateClient(client.id, {
      name: name.trim(),
      bizNumber: bizNumber.trim() || '-',
      contact: contact.trim() || '-',
    })
    setEditing(false)
  }

  const remove = () => {
    const msg =
      clientProjects.length > 0
        ? `'${client.name}' 거래처와 등록된 거래 ${clientProjects.length}건을 함께 삭제할까요?`
        : `'${client.name}' 거래처를 삭제할까요?`
    if (confirm(msg)) deleteClient(client.id)
  }

  return (
    <div className="rounded-xl border border-border p-4">
      {editing ? (
        <div className="mb-3 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="거래처명">
              <input
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="사업자등록번호">
              <input
                className={inputCls}
                value={bizNumber}
                onChange={(e) => setBizNumber(e.target.value)}
              />
            </Field>
            <Field label="연락처">
              <input
                className={inputCls}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} data-icon="inline-start">
              <Check /> 저장
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(false)}
              data-icon="inline-start"
            >
              <X /> 취소
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-semibold">{client.name}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {client.bizNumber} · {client.contact}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-1 text-xs text-muted-foreground">
              거래 {clientProjects.length}건
            </span>
            <IconButton label="거래처 수정" onClick={startEdit}>
              <Pencil className="size-4" />
            </IconButton>
            <IconButton label="거래처 삭제" onClick={remove} danger>
              <Trash2 className="size-4" />
            </IconButton>
          </div>
        </div>
      )}

      {clientProjects.length === 0 ? (
        <p className="text-sm text-muted-foreground">등록된 거래가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {clientProjects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project: p }: { project: SaleProject }) {
  const { clients, toggleStage, updateProject, deleteProject } = useFinance()
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <ProjectEditForm
        project={p}
        clients={clients}
        onCancel={() => setEditing(false)}
        onSave={(data) => {
          updateProject(p.id, data)
          setEditing(false)
        }}
      />
    )
  }

  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{p.title}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            계약 {formatWon(projectTotal(p))} (부가세 포함)
          </span>
          <IconButton label="거래 수정" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" />
          </IconButton>
          <IconButton
            label="거래 삭제"
            danger
            onClick={() => {
              if (confirm(`'${p.title}' 거래를 삭제할까요?`)) deleteProject(p.id)
            }}
          >
            <Trash2 className="size-3.5" />
          </IconButton>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {p.stages.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => toggleStage(p.id, s.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              s.paid
                ? 'border-success/40 bg-success/15 text-success'
                : 'border-border bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            {s.paid ? (
              <Check className="size-3.5" />
            ) : (
              <CircleDashed className="size-3.5" />
            )}
            {STAGE_LABELS[s.key]} {formatWon(Math.round(s.amount * (1 + VAT_RATE)))}
          </button>
        ))}
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

      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs">
        <span className="text-success">입금 {formatWon(projectReceived(p))}</span>
        <span
          className={
            projectOutstanding(p) > 0
              ? 'font-medium text-destructive'
              : 'text-muted-foreground'
          }
        >
          미수금 {formatWon(projectOutstanding(p))}
        </span>
      </div>
    </div>
  )
}

type ProjectFormData = {
  clientId: string
  title: string
  date: string
  supplyAmount: number
  stageRatios: Record<StageKey, number>
}

function ProjectEditForm({
  project: p,
  clients,
  onSave,
  onCancel,
}: {
  project: SaleProject
  clients: Client[]
  onSave: (data: ProjectFormData) => void
  onCancel: () => void
}) {
  const ratioOf = (key: StageKey) => {
    const stage = p.stages.find((s) => s.key === key)
    return p.supplyAmount > 0 && stage
      ? Math.round((stage.amount / p.supplyAmount) * 100)
      : 0
  }
  const [clientId, setClientId] = useState(p.clientId)
  const [title, setTitle] = useState(p.title)
  const [amount, setAmount] = useState(String(p.supplyAmount))
  const [date, setDate] = useState(p.date)
  const [ratios, setRatios] = useState<Record<StageKey, number>>({
    advance: ratioOf('advance'),
    interim: ratioOf('interim'),
    balance: ratioOf('balance'),
  })

  const ratioSum = ratios.advance + ratios.interim + ratios.balance
  const amountNum = Number(amount) || 0

  const save = () => {
    if (!clientId || !title.trim() || amountNum <= 0 || ratioSum !== 100) return
    onSave({
      clientId,
      title: title.trim(),
      date,
      supplyAmount: amountNum,
      stageRatios: ratios,
    })
  }

  return (
    <div className="rounded-lg border border-primary/40 bg-muted/40 p-3">
      <p className="mb-3 text-xs font-medium text-primary">거래 수정</p>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="거래처">
            <select
              className={inputCls}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="계약일">
            <input
              type="date"
              className={inputCls}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
        </div>
        <Field label="거래 내용">
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="공급가액 (원)">
          <input
            type="number"
            min={0}
            className={inputCls}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
            단계별 비율 (%)
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(['advance', 'interim', 'balance'] as StageKey[]).map((k) => (
              <div key={k} className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">
                  {STAGE_LABELS[k]}
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={inputCls}
                  value={ratios[k]}
                  onChange={(e) =>
                    setRatios((r) => ({ ...r, [k]: Number(e.target.value) || 0 }))
                  }
                />
              </div>
            ))}
          </div>
          <p
            className={`mt-1 text-xs ${ratioSum === 100 ? 'text-muted-foreground' : 'text-destructive'}`}
          >
            합계 {ratioSum}% {ratioSum !== 100 && '(100%가 되도록 맞춰주세요)'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={save}
            disabled={ratioSum !== 100 || amountNum <= 0 || !title.trim()}
            data-icon="inline-start"
          >
            <Check /> 저장
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            data-icon="inline-start"
          >
            <X /> 취소
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          수정 시 이미 입금 처리한 단계 상태는 유지됩니다.
        </p>
      </div>
    </div>
  )
}

function ClientForm() {
  const { addClient } = useFinance()
  const [name, setName] = useState('')
  const [bizNumber, setBizNumber] = useState('')
  const [contact, setContact] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addClient({
      name: name.trim(),
      bizNumber: bizNumber.trim() || '-',
      contact: contact.trim() || '-',
    })
    setName('')
    setBizNumber('')
    setContact('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="size-4 text-primary" /> 거래처 등록
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field label="거래처명">
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 한빛정밀기계"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="사업자등록번호">
              <input
                className={inputCls}
                value={bizNumber}
                onChange={(e) => setBizNumber(e.target.value)}
                placeholder="000-00-00000"
              />
            </Field>
            <Field label="연락처">
              <input
                className={inputCls}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="02-000-0000"
              />
            </Field>
          </div>
          <Button type="submit" data-icon="inline-start" className="mt-1 self-start">
            <Plus /> 거래처 추가
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ProjectForm() {
  const { clients, addProject } = useFinance()
  const [clientId, setClientId] = useState('')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [ratios, setRatios] = useState<Record<StageKey, number>>({
    advance: 30,
    interim: 40,
    balance: 30,
  })

  const ratioSum = ratios.advance + ratios.interim + ratios.balance
  const amountNum = Number(amount) || 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !title.trim() || amountNum <= 0) return
    addProject({
      clientId,
      title: title.trim(),
      date,
      supplyAmount: amountNum,
      stageRatios: ratios,
    })
    setTitle('')
    setAmount('')
    setDate('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="size-4 text-primary" /> 거래(대금) 등록
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="거래처">
              <select
                className={inputCls}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">선택하세요</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="계약일">
              <input
                type="date"
                className={inputCls}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          </div>
          <Field label="거래 내용">
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: CNC 가공 부품 납품"
            />
          </Field>
          <Field label="공급가액 (원)">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </Field>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              단계별 비율 (%)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['advance', 'interim', 'balance'] as StageKey[]).map((k) => (
                <div key={k} className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">
                    {STAGE_LABELS[k]}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={inputCls}
                    value={ratios[k]}
                    onChange={(e) =>
                      setRatios((r) => ({ ...r, [k]: Number(e.target.value) || 0 }))
                    }
                  />
                </div>
              ))}
            </div>
            <p
              className={`mt-1 text-xs ${ratioSum === 100 ? 'text-muted-foreground' : 'text-destructive'}`}
            >
              합계 {ratioSum}% {ratioSum !== 100 && '(100%가 되도록 맞춰주세요)'}
            </p>
          </div>

          <Button
            type="submit"
            data-icon="inline-start"
            disabled={ratioSum !== 100}
            className="mt-1 self-start"
          >
            <Plus /> 거래 추가
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex size-7 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:bg-muted ${
        danger ? 'hover:border-destructive/30 hover:text-destructive' : 'hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}
