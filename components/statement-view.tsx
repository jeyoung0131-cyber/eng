'use client'

import { useState } from 'react'
import { Printer, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ItemRow = {
  id: string
  code: string
  name: string
  spec: string
  qty: number
  price: number
}

export function StatementView() {
  const [date, setDate] = useState('2026-10-03')
  const [docNo, setDocNo] = useState('1')

  // 공급자 정보 (기본값)
  const [supplier, setSupplier] = useState({
    bizNo: '123-45-67890',
    name: '한전열이엔지',
    owner: '홍길동',
    address: '부산광역시 강서구 유통단지1로',
    bizType: '제조',
    bizItem: '전열기구 및 파이프',
  })

  // 공급받는자 정보
  const [receiver, setReceiver] = useState({
    bizNo: '',
    name: '신성기공',
    owner: '김철수',
    address: '부산광역시 사상구 사상로',
    bizType: '제조',
    bizItem: '기계부품',
  })

  // 품목 목록 (기본 10줄 맞춤)
  const [items, setItems] = useState<ItemRow[]>([
    { id: '1', code: '100000001', name: '히타', spec: '220V', qty: 500, price: 5000 },
  ])

  const [prevBalance, setPrevBalance] = useState(0)
  const [todayDeposit, setTodayDeposit] = useState(0)

  // 품목 추가
  const addItem = () => {
    if (items.length >= 10) {
      alert('한 페이지에 최대 10개 품목까지 입력 가능합니다.')
      return
    }
    setItems([
      ...items,
      { id: Date.now().toString(), code: '', name: '', spec: '', qty: 1, price: 0 },
    ])
  }

  // 품목 삭제
  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  // 품목 수정
  const updateItem = (id: string, field: keyof ItemRow, value: string | number) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  // 계산 로직
  const totalAmount = items.reduce((sum, item) => sum + (item.qty || 0) * (item.price || 0), 0)
  const totalVat = Math.round(totalAmount * 0.1)
  const grandTotal = totalAmount + totalVat
  const todayBalance = prevBalance + grandTotal - todayDeposit

  const handlePrint = () => {
    window.print()
  }

  const dateParts = date.split('-')
  const year = dateParts[0] || '2026'
  const month = dateParts[1] || '10'
  const day = dateParts[2] || '03'

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* 화면 조작용 컨트롤 바 (인쇄 시 숨김) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h2 className="text-lg font-bold">거래명세표 발행 및 출력</h2>
          <p className="text-xs text-muted-foreground">
            입력 후 [인쇄 / PDF 저장] 버튼을 누르면 A4 표준 양식으로 출력됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={addItem} className="gap-1.5 text-xs">
            <Plus className="size-3.5" /> 품목 추가
          </Button>
          <Button onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer className="size-3.5" /> 인쇄 / PDF 저장
          </Button>
        </div>
      </div>

      {/* 화면 입력용 폼 (인쇄 시 숨김) */}
      <div className="print:hidden grid gap-4 sm:grid-cols-2 bg-card p-4 rounded-xl border border-border">
        <div className="space-y-2">
          <label className="text-xs font-semibold">출고일자 &amp; 일련번호</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <input
              type="text"
              value={docNo}
              onChange={(e) => setDocNo(e.target.value)}
              className="flex h-9 w-24 rounded-md border border-input bg-transparent px-3 py-1 text-xs text-center shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="호수"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold">공급받는자 (거래처명)</label>
          <input
            type="text"
            value={receiver.name}
            onChange={(e) => setReceiver({ ...receiver, name: e.target.value })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="상호입력"
          />
        </div>
      </div>

      {/* 실사 출력용 A4 양식 (인쇄 메인 영역) */}
      <div className="print-area bg-white text-black p-4 space-y-6 select-none border rounded-lg print:border-none print:p-0">
        {/* 1. 상단 (공급받는자 보관용 - 파란색) */}
        <StatementSheet
          color="#1e40af"
          typeTitle="(공급받는자보관용)"
          year={year}
          month={month}
          day={day}
          docNo={docNo}
          supplier={supplier}
          receiver={receiver}
          items={items}
          totalAmount={totalAmount}
          totalVat={totalVat}
          grandTotal={grandTotal}
          prevBalance={prevBalance}
          todayDeposit={todayDeposit}
          todayBalance={todayBalance}
        />

        <div className="border-b border-dashed border-gray-300 my-4 print:my-2"></div>

        {/* 2. 하단 (공급자 보관용 - 빨간색) */}
        <StatementSheet
          color="#dc2626"
          typeTitle="(공급자 보관용)"
          year={year}
          month={month}
          day={day}
          docNo={docNo}
          supplier={supplier}
          receiver={receiver}
          items={items}
          totalAmount={totalAmount}
          totalVat={totalVat}
          grandTotal={grandTotal}
          prevBalance={prevBalance}
          todayDeposit={todayDeposit}
          todayBalance={todayBalance}
        />
      </div>

      {/* A4 인쇄 전용 Style */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>
    </div>
  )
}

interface StatementSheetProps {
  color: string
  typeTitle: string
  year: string
  month: string
  day: string
  docNo: string
  supplier: {
    bizNo: string
    name: string
    owner: string
    address: string
    bizType: string
    bizItem: string
  }
  receiver: {
    bizNo: string
    name: string
    owner: string
    address: string
    bizType: string
    bizItem: string
  }
  items: ItemRow[]
  totalAmount: number
  totalVat: number
  grandTotal: number
  prevBalance: number
  todayDeposit: number
  todayBalance: number
}

function StatementSheet({
  color,
  typeTitle,
  year,
  month,
  day,
  docNo,
  supplier,
  receiver,
  items,
  totalAmount,
  totalVat,
  grandTotal,
  prevBalance,
  todayDeposit,
  todayBalance,
}: StatementSheetProps) {
  const emptyRowCount = Math.max(0, 10 - items.length)
  const emptyRows = Array.from({ length: emptyRowCount })

  return (
    <div className="w-full text-[11px] leading-tight font-sans" style={{ color }}>
      {/* 타이틀 및 날짜 헤더 */}
      <div className="flex items-end justify-between mb-1">
        <div className="border border-current px-2 py-0.5 text-[11px] font-bold">
          출고일자 &nbsp; {year} 년 &nbsp; {month} 월 &nbsp; {day} 일 &nbsp; - &nbsp; {docNo}
        </div>
        <div className="text-center flex-1">
          <h1 className="text-2xl font-black tracking-[0.6em] underline decoration-2 underline-offset-4 pl-6">
            거 래 명 세 표
          </h1>
        </div>
        <div className="text-[11px] font-semibold">{typeTitle}</div>
      </div>

      {/* 공급자 / 공급받는자 정보 테이블 */}
      <table className="w-full border-collapse border border-current text-center mb-1">
        <tbody>
          <tr>
            <td rowSpan={4} className="border border-current w-5 font-bold">
              공<br />급<br />자
            </td>
            <td className="border border-current w-12 font-semibold">등록번호</td>
            <td colSpan={3} className="border border-current font-bold text-sm text-left px-1">
              {supplier.bizNo}
            </td>
            <td rowSpan={4} className="border border-current w-5 font-bold">
              공<br />급<br />받<br />는<br />자
            </td>
            <td className="border border-current w-12 font-semibold">등록번호</td>
            <td colSpan={3} className="border border-current font-bold text-sm text-left px-1">
              {receiver.bizNo}
            </td>
          </tr>
          <tr>
            <td className="border border-current font-semibold">상호</td>
            <td className="border border-current text-left px-1 font-bold">{supplier.name}</td>
            <td className="border border-current w-8 font-semibold">성명</td>
            <td className="border border-current text-left px-1">{supplier.owner}</td>
            <td className="border border-current font-semibold">상호</td>
            <td className="border border-current text-left px-1 font-bold">{receiver.name}</td>
            <td className="border border-current w-8 font-semibold">성명</td>
            <td className="border border-current text-left px-1">{receiver.owner}</td>
          </tr>
          <tr>
            <td className="border border-current font-semibold">주소</td>
            <td colSpan={3} className="border border-current text-left px-1 text-[10px]">
              {supplier.address}
            </td>
            <td className="border border-current font-semibold">주소</td>
            <td colSpan={3} className="border border-current text-left px-1 text-[10px]">
              {receiver.address}
            </td>
          </tr>
          <tr>
            <td className="border border-current font-semibold">업태</td>
            <td className="border border-current text-left px-1">{supplier.bizType}</td>
            <td className="border border-current font-semibold">종목</td>
            <td className="border border-current text-left px-1">{supplier.bizItem}</td>
            <td className="border border-current font-semibold">업태</td>
            <td className="border border-current text-left px-1">{receiver.bizType}</td>
            <td className="border border-current font-semibold">종목</td>
            <td className="border border-current text-left px-1">{receiver.bizItem}</td>
          </tr>
        </tbody>
      </table>

      {/* 품목 리스트 테이블 */}
      <table className="w-full border-collapse border border-current text-center mb-1">
        <thead>
          <tr className="font-semibold h-6">
            <th className="border border-current w-8">순번</th>
            <th className="border border-current w-20">품 목 번 호</th>
            <th className="border border-current">품 명 &nbsp; / &nbsp; 규 격</th>
            <th className="border border-current w-12">수 량</th>
            <th className="border border-current w-16">단 가</th>
            <th className="border border-current w-20">금 액</th>
            <th className="border border-current w-16">부 가 세</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: ItemRow, idx: number) => {
            const amount = (item.qty || 0) * (item.price || 0)
            const vat = Math.round(amount * 0.1)
            return (
              <tr key={item.id} className="h-5">
                <td className="border border-current">{idx + 1}</td>
                <td className="border border-current font-mono text-[10px]">{item.code}</td>
                <td className="border border-current text-left px-1.5 font-medium">
                  {item.name} {item.spec &amp;&amp; `(${item.spec})`}
                </td>
                <td className="border border-current text-right px-1">{(item.qty || 0).toLocaleString()}</td>
                <td className="border border-current text-right px-1">{(item.price || 0).toLocaleString()}</td>
                <td className="border border-current text-right px-1 font-semibold">{amount.toLocaleString()}</td>
                <td className="border border-current text-right px-1">{vat.toLocaleString()}</td>
              </tr>
            )
          })}
          {emptyRows.map((_, idx) => (
            <tr key={`empty-${idx}`} className="h-5">
              <td className="border border-current"></td>
              <td className="border border-current"></td>
              <td className="border border-current"></td>
              <td className="border border-current"></td>
              <td className="border border-current"></td>
              <td className="border border-current"></td>
              <td className="border border-current"></td>
            </tr>
          ))}
          {/* 소계 행 */}
          <tr className="h-5 font-semibold">
            <td colSpan={3} className="border border-current">합 &nbsp; &nbsp; 계</td>
            <td colSpan={2} className="border border-current"></td>
            <td className="border border-current text-right px-1 font-bold">{totalAmount.toLocaleString()}</td>
            <td className="border border-current text-right px-1 font-bold">{totalVat.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      {/* 하단 집계 및 잔액/인수자 테이블 */}
      <table className="w-full border-collapse border border-current text-center">
        <tbody>
          <tr className="h-6 font-bold">
            <td className="border border-current w-20">합 계 금 액</td>
            <td className="border border-current w-20">당 일 출 고</td>
            <td className="border border-current w-20">당 일 입 금</td>
            <td className="border border-current w-20">전 일 잔 액</td>
            <td className="border border-current w-20">당 일 잔 액</td>
            <td rowSpan={2} className="border border-current w-16 font-semibold">인수자</td>
            <td rowSpan={2} className="border border-current text-right pr-2 text-muted-foreground font-normal">
              ( 인 )
            </td>
          </tr>
          <tr className="h-6 font-bold tabular-nums">
            <td className="border border-current">{grandTotal.toLocaleString()}</td>
            <td className="border border-current">{grandTotal.toLocaleString()}</td>
            <td className="border border-current">{todayDeposit.toLocaleString()}</td>
            <td className="border border-current">{prevBalance.toLocaleString()}</td>
            <td className="border border-current">{todayBalance.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
