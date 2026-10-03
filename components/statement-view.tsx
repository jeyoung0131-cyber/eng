'use client'

import { useState } from 'react'
import { Printer, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ItemRow = {
  id: string
  nameSpec: string // 품명 - 규격
  unit: string     // 단위
  qty: number      // 수량
  price: number    // 단가
}

export function StatementView() {
  const [tradeDate, setTradeDate] = useState('2026-10-03')
  const [manager, setManager] = useState('')

  // 공급자 정보
  const [supplier, setSupplier] = useState({
    bizNo: '123-45-67890',
    name: '한전열이엔지',
    owner: '홍길동',
    address: '부산광역시 강서구 유통단지1로',
    bizType: '제조',
    bizItem: '전열기구 및 파이프',
    tel: '051-123-4567',
    fax: '051-123-4568',
  })

  // 공급받는자 정보
  const [receiver, setReceiver] = useState({
    bizNo: '987-65-43210',
    name: '신성기공',
    owner: '김철수',
    address: '부산광역시 사상구 사상로 100',
    bizType: '제조',
    bizItem: '기계부품',
    tel: '051-987-6543',
    fax: '051-987-6544',
  })

  // 품목 목록 (기본값)
  const [items, setItems] = useState<ItemRow[]>([
    { id: '1', nameSpec: '시스히타 220V 3KW', unit: 'EA', qty: 10, price: 25000 },
    { id: '2', nameSpec: '동파이프 15.88t', unit: 'M', qty: 50, price: 4500 },
  ])

  const [deposit, setDeposit] = useState<number>(0)      // 입금액
  const [prevBalance, setPrevBalance] = useState<number>(0) // 전잔액

  // 품목 추가
  const addItem = () => {
    if (items.length >= 8) {
      alert('한 양식당 최대 8개 품목까지 출력하기 적합합니다.')
      return
    }
    setItems([
      ...items,
      { id: Date.now().toString(), nameSpec: '', unit: 'EA', qty: 1, price: 0 },
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

  // 자동 계산
  const totalSupplyValue = items.reduce((sum, item) => sum + (item.qty || 0) * (item.price || 0), 0)
  const totalTax = Math.round(totalSupplyValue * 0.1)
  const grandTotal = totalSupplyValue + totalTax
  const currentBalance = prevBalance + grandTotal - deposit

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-2 sm:p-4 text-xs">
      {/* 상단 상시 컨트롤 바 */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h2 className="text-base font-bold">거래명세서 작성 및 인쇄</h2>
          <p className="text-xs text-muted-foreground">
            아래 입력란에서 거래처, 품목, 금액을 직접 수정하신 후 [인쇄 / PDF 저장]을 누르세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer className="size-4" /> 인쇄 / PDF 저장
          </Button>
        </div>
      </div>

      {/* 1. 데이터 입력/수정 영역 (인쇄 시 숨김) */}
      <div className="print:hidden bg-card p-4 rounded-xl border border-border space-y-6">
        {/* 기본 정보 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="font-bold text-foreground">거래일자</label>
            <input
              type="date"
              value={tradeDate}
              onChange={(e) => setTradeDate(e.target.value)}
              className="w-full h-8 px-2 border rounded bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-foreground">담당사원</label>
            <input
              type="text"
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              placeholder="담당자 이름"
              className="w-full h-8 px-2 border rounded bg-background"
            />
          </div>
        </div>

        {/* 공급자 & 공급받는자 수정 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t">
          {/* 공급자 */}
          <div className="space-y-2">
            <h3 className="font-bold text-red-600 border-b pb-1">공급자 정보 (내 회사)</h3>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="등록번호" value={supplier.bizNo} onChange={(e) => setSupplier({ ...supplier, bizNo: e.target.value })} className="h-8 px-2 border rounded bg-background" />
              <input placeholder="상호" value={supplier.name} onChange={(e) => setSupplier({ ...supplier, name: e.target.value })} className="h-8 px-2 border rounded bg-background" />
              <input placeholder="성명(대표)" value={supplier.owner} onChange={(e) => setSupplier({ ...supplier, owner: e.target.value })} className="h-8 px-2 border rounded bg-background" />
              <input placeholder="전화" value={supplier.tel} onChange={(e) => setSupplier({ ...supplier, tel: e.target.value })} className="h-8 px-2 border rounded bg-background" />
              <input placeholder="주소" value={supplier.address} onChange={(e) => setSupplier({ ...supplier, address: e.target.value })} className="col-span-2 h-8 px-2 border rounded bg-background" />
              <input placeholder="업태" value={supplier.bizType} onChange={(e) => setSupplier({ ...supplier, bizType: e.target.value })} className="h-8 px-2 border rounded bg-background" />
              <input placeholder="종목" value={supplier.bizItem} onChange={(e) => setSupplier({ ...supplier, bizItem: e.target.value })} className="h-8 px-2 border rounded bg-background" />
              <input placeholder="팩스" value={supplier.fax} onChange={(e) => setSupplier({ ...supplier, fax: e.target.value })} className="col-span-2 h-8 px-2 border rounded bg-background" />
            </div>
          </div>

          {/* 공급받는자 */}
          <div className="space-y-2">
            <h3 className="font-bold text-blue-600 border-b pb-1">공급받는자 정보 (거래처)</h3>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="등록번호" value={receiver.bizNo} onChange={(e) => setReceiver({ ...receiver, bizNo: e.target.value })} className="h-8 px-2 border rounded bg-background" />
              <input placeholder="상호" value={receiver.name} onChange={(e) => setReceiver({ ...receiver, name: e.target.value })} className="h-8 px-2 border rounded bg-background" />
              <input placeholder="성명(대표)" value={receiver.owner} onChange={(e) => setReceiver({ ...receiver, owner: e.target.value })} className="h-8 px-2 border rounded bg-background" />
              <input placeholder="전화" value={receiver.tel} onChange={(e) => setReceiver({ ...receiver, tel: e.target.value })} className="h-8 px-2 border rounded bg-background" />
              <input placeholder="주소" value={receiver.address} onChange={(e) => setReceiver({ ...receiver, address: e.target.value })} className="col-span-2 h-8 px-2 border rounded bg-background" />
              <input placeholder="업태" value={receiver.bizType} onChange={(e) => setReceiver({ ...receiver, bizType: e.target.value })} className="h-8 px-2 border rounded bg-background" />
              <input placeholder="종목" value={receiver.bizItem} onChange={(e) => setReceiver({ ...receiver, bizItem: e.target.value })} className="h-8 px-2 border rounded bg-background" />
              <input placeholder="팩스" value={receiver.fax} onChange={(e) => setReceiver({ ...receiver, fax: e.target.value })} className="col-span-2 h-8 px-2 border rounded bg-background" />
            </div>
          </div>
        </div>

        {/* 품목 입력 리스트 */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-foreground">품목 목록 입력</h3>
            <Button variant="outline" size="sm" onClick={addItem} className="h-7 gap-1 text-xs">
              <Plus className="size-3.5" /> 품목 추가
            </Button>
          </div>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 bg-muted/40 p-2 rounded border">
                <span className="w-5 text-center font-bold">{idx + 1}</span>
                <input
                  placeholder="품명 - 규격"
                  value={item.nameSpec}
                  onChange={(e) => updateItem(item.id, 'nameSpec', e.target.value)}
                  className="flex-1 h-8 px-2 border rounded bg-background"
                />
                <input
                  placeholder="단위"
                  value={item.unit}
                  onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                  className="w-16 h-8 px-2 border rounded bg-background text-center"
                />
                <input
                  type="number"
                  placeholder="수량"
                  value={item.qty || ''}
                  onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))}
                  className="w-20 h-8 px-2 border rounded bg-background text-right"
                />
                <input
                  type="number"
                  placeholder="단가"
                  value={item.price || ''}
                  onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                  className="w-24 h-8 px-2 border rounded bg-background text-right"
                />
                <span className="w-24 text-right font-semibold pr-1">
                  {((item.qty || 0) * (item.price || 0)).toLocaleString()}원
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* 잔액 및 입금액 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t">
          <div className="space-y-1">
            <label className="text-muted-foreground">입금액</label>
            <input
              type="number"
              value={deposit || ''}
              onChange={(e) => setDeposit(Number(e.target.value))}
              className="w-full h-8 px-2 border rounded bg-background text-right font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground">전잔액</label>
            <input
              type="number"
              value={prevBalance || ''}
              onChange={(e) => setPrevBalance(Number(e.target.value))}
              className="w-full h-8 px-2 border rounded bg-background text-right font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground">합계액(공급가+세액)</label>
            <div className="h-8 px-2 border rounded bg-muted flex items-center justify-end font-bold text-foreground">
              {grandTotal.toLocaleString()}원
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground">현잔액</label>
            <div className="h-8 px-2 border rounded bg-muted flex items-center justify-end font-bold text-foreground">
              {currentBalance.toLocaleString()}원
            </div>
          </div>
        </div>
      </div>

      {/* 2. 실제 A4 인쇄 양식 영역 */}
      <div className="bg-white p-4 print:p-0 space-y-6 rounded-lg border print:border-none">
        {/* 상단 (공급자 보관용 - 빨간색) */}
        <StatementPaper
          color="#ef4444"
          bgLight="#fef2f2"
          typeTitle="( 공급자 보관용 )"
          tradeDate={tradeDate}
          manager={manager}
          supplier={supplier}
          receiver={receiver}
          items={items}
          deposit={deposit}
          prevBalance={prevBalance}
          totalSupplyValue={totalSupplyValue}
          totalTax={totalTax}
          grandTotal={grandTotal}
          currentBalance={currentBalance}
        />

        {/* 절취선 */}
        <div className="border-b-2 border-dashed border-gray-400 my-2 print:my-1"></div>

        {/* 하단 (공급받는자 보관용 - 파란색) */}
        <StatementPaper
          color="#2563eb"
          bgLight="#eff6ff"
          typeTitle="( 공급받는자 보관용 )"
          tradeDate={tradeDate}
          manager={manager}
          supplier={supplier}
          receiver={receiver}
          items={items}
          deposit={deposit}
          prevBalance={prevBalance}
          totalSupplyValue={totalSupplyValue}
          totalTax={totalTax}
          grandTotal={grandTotal}
          currentBalance={currentBalance}
        />
      </div>
    </div>
  )
}

interface StatementPaperProps {
  color: string
  bgLight: string
  typeTitle: string
  tradeDate: string
  manager: string
  supplier: any
  receiver: any
  items: ItemRow[]
  deposit: number
  prevBalance: number
  totalSupplyValue: number
  totalTax: number
  grandTotal: number
  currentBalance: number
}

function StatementPaper({
  color,
  bgLight,
  typeTitle,
  tradeDate,
  manager,
  supplier,
  receiver,
  items,
  deposit,
  prevBalance,
  totalSupplyValue,
  totalTax,
  grandTotal,
  currentBalance,
}: StatementPaperProps) {
  // 표 채우기용 빈 줄 계산 (기본 6줄 고정)
  const maxRows = 6
  const emptyRows = Array.from({ length: Math.max(0, maxRows - items.length) })

  return (
    <div className="w-full text-[11px] leading-snug font-sans select-none" style={{ color }}>
      {/* 최상단 거래일자 및 타이틀 */}
      <div className="flex items-end justify-between mb-1">
        <div className="w-1/3">
          거래일자 : <span className="font-bold border-b border-current px-2">{tradeDate}</span>
        </div>
        <div className="w-1/3 text-center flex items-center justify-center gap-2">
          <span className="text-xl font-black border-2 border-current px-4 py-0.5 tracking-[0.4em]">
            거 래 명 세 서
          </span>
          <span className="text-[10px] font-bold">{typeTitle}</span>
        </div>
        <div className="w-1/3 text-right">
          담당사원 : <span className="font-bold border-b border-current px-2">{manager}</span>
        </div>
      </div>

      {/* 공급자 / 공급받는자 메인 표 */}
      <table className="w-full border-collapse border-2 border-current text-center mb-1">
        <tbody>
          <tr>
            <td rowSpan={5} className="border border-current w-5 font-bold bg-opacity-20" style={{ backgroundColor: bgLight }}>
              공<br />급<br />자
            </td>
            <td className="border border-current w-14 font-semibold">등록번호</td>
            <td colSpan={3} className="border border-current font-bold text-left px-1.5">{supplier.bizNo}</td>
            <td rowSpan={5} className="border border-current w-5 font-bold bg-opacity-20" style={{ backgroundColor: bgLight }}>
              공<br />급<br />받<br />는<br />자
            </td>
            <td className="border border-current w-14 font-semibold">등록번호</td>
            <td colSpan={3} className="border border-current font-bold text-left px-1.5">{receiver.bizNo}</td>
          </tr>
          <tr>
            <td className="border border-current font-semibold">상호</td>
            <td className="border border-current text-left px-1.5 font-bold">{supplier.name}</td>
            <td className="border border-current w-8 font-semibold">성명</td>
            <td className="border border-current text-left px-1.5">{supplier.owner}</td>
            <td className="border border-current font-semibold">상호</td>
            <td className="border border-current text-left px-1.5 font-bold">{receiver.name}</td>
            <td className="border border-current w-8 font-semibold">성명</td>
            <td className="border border-current text-left px-1.5">{receiver.owner}</td>
          </tr>
          <tr>
            <td className="border border-current font-semibold">주소</td>
            <td colSpan={3} className="border border-current text-left px-1.5 text-[10px]">{supplier.address}</td>
            <td className="border border-current font-semibold">주소</td>
            <td colSpan={3} className="border border-current text-left px-1.5 text-[10px]">{receiver.address}</td>
          </tr>
          <tr>
            <td className="border border-current font-semibold">업태</td>
            <td className="border border-current text-left px-1.5">{supplier.bizType}</td>
            <td className="border border-current w-8 font-semibold">종목</td>
            <td className="border border-current text-left px-1.5">{supplier.bizItem}</td>
            <td className="border border-current font-semibold">업태</td>
            <td className="border border-current text-left px-1.5">{receiver.bizType}</td>
            <td className="border border-current w-8 font-semibold">종목</td>
            <td className="border border-current text-left px-1.5">{receiver.bizItem}</td>
          </tr>
          <tr>
            <td className="border border-current font-semibold">전화</td>
            <td className="border border-current text-left px-1.5">{supplier.tel}</td>
            <td className="border border-current font-semibold">팩스</td>
            <td className="border border-current text-left px-1.5">{supplier.fax}</td>
            <td className="border border-current font-semibold">전화</td>
            <td className="border border-current text-left px-1.5">{receiver.tel}</td>
            <td className="border border-current font-semibold">팩스</td>
            <td className="border border-current text-left px-1.5">{receiver.fax}</td>
          </tr>
        </tbody>
      </table>

      {/* 품목 명세 표 (이미지와 똑같은 줄무늬 배경 적용) */}
      <table className="w-full border-collapse border-2 border-current text-center mb-1">
        <thead>
          <tr className="font-semibold h-6">
            <th className="border border-current w-8">No</th>
            <th className="border border-current">품 명 - 규 격</th>
            <th className="border border-current w-12">단위</th>
            <th className="border border-current w-14">수량</th>
            <th className="border border-current w-20">단가</th>
            <th className="border border-current w-24">공급가액</th>
            <th className="border border-current w-20">세액</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const supplyVal = (item.qty || 0) * (item.price || 0)
            const vatVal = Math.round(supplyVal * 0.1)
            const isEven = idx % 2 === 1
            return (
              <tr
                key={item.id}
                className="h-6"
                style={{ backgroundColor: isEven ? bgLight : 'transparent' }}
              >
                <td className="border border-current">{idx + 1}</td>
                <td className="border border-current text-left px-2 font-medium">{item.nameSpec}</td>
                <td className="border border-current">{item.unit}</td>
                <td className="border border-current text-right px-1">{item.qty ? item.qty.toLocaleString() : ''}</td>
                <td className="border border-current text-right px-1">{item.price ? item.price.toLocaleString() : ''}</td>
                <td className="border border-current text-right px-1 font-semibold">{supplyVal ? supplyVal.toLocaleString() : ''}</td>
                <td className="border border-current text-right px-1">{vatVal ? vatVal.toLocaleString() : ''}</td>
              </tr>
            )
          })}
          {emptyRows.map((_, idx) => {
            const isEven = (items.length + idx) % 2 === 1
            return (
              <tr
                key={`empty-${idx}`}
                className="h-6"
                style={{ backgroundColor: isEven ? bgLight : 'transparent' }}
              >
                <td className="border border-current"></td>
                <td className="border border-current"></td>
                <td className="border border-current"></td>
                <td className="border border-current"></td>
                <td className="border border-current"></td>
                <td className="border border-current"></td>
                <td className="border border-current"></td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* 하단 금액 및 잔액 표 (이미지 양식 구조) */}
      <div className="flex border-2 border-current">
        <div className="flex-1 border-r border-current p-1 space-y-1">
          <div className="text-[10px]">미수금 / 참고사항 기록란</div>
        </div>
        <div className="w-72">
          <table className="w-full border-collapse text-center">
            <tbody>
              <tr className="border-b border-current h-5">
                <td className="border-r border-current w-16 bg-opacity-10 font-semibold" style={{ backgroundColor: bgLight }}>입금액</td>
                <td className="border-r border-current text-right px-1 font-bold">{deposit ? deposit.toLocaleString() : ''}</td>
                <td className="border-r border-current w-16 bg-opacity-10 font-semibold" style={{ backgroundColor: bgLight }}>합계액</td>
                <td className="text-right px-1 font-bold">{grandTotal ? grandTotal.toLocaleString() : ''}</td>
              </tr>
              <tr className="h-5">
                <td className="border-r border-current bg-opacity-10 font-semibold" style={{ backgroundColor: bgLight }}>전잔액</td>
                <td className="border-r border-current text-right px-1 font-bold">{prevBalance ? prevBalance.toLocaleString() : ''}</td>
                <td className="border-r border-current bg-opacity-10 font-semibold" style={{ backgroundColor: bgLight }}>현잔액</td>
                <td className="text-right px-1 font-bold">{currentBalance ? currentBalance.toLocaleString() : ''}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 인수자 도장 칸 */}
      <div className="flex justify-end items-center gap-12 mt-1 px-4 text-xs font-semibold">
        <span>인수자</span>
        <span>(인)</span>
      </div>
    </div>
  )
}
