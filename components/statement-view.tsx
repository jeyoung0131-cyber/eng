'use client'

import { useState, useEffect } from 'react'
import { Printer, Plus, Trash2, Save, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ItemRow = {
  id: string
  nameSpec: string // 품명 - 규격
  unit: string     // 단위
  qty: number      // 수량
  price: number    // 단가
}

type CompanyInfo = {
  bizNo: string
  name: string
  owner: string
  address: string
  bizType: string
  bizItem: string
  tel: string
  fax: string
}

type SavedItem = {
  id: string
  nameSpec: string
  unit: string
  price: number
}

export function StatementView() {
  const [tradeDate, setTradeDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [manager, setManager] = useState('')

  // 공급자 정보 (기본 공란 / 저장 가능)
  const [supplier, setSupplier] = useState<CompanyInfo>({
    bizNo: '',
    name: '',
    owner: '',
    address: '',
    bizType: '',
    bizItem: '',
    tel: '',
    fax: '',
  })

  // 공급받는자 정보 (기본 공란)
  const [receiver, setReceiver] = useState<CompanyInfo>({
    bizNo: '',
    name: '',
    owner: '',
    address: '',
    bizType: '',
    bizItem: '',
    tel: '',
    fax: '',
  })

  // 품목 목록 (기본 공란 2줄)
  const [items, setItems] = useState<ItemRow[]>([
    { id: '1', nameSpec: '', unit: '', qty: 0, price: 0 },
    { id: '2', nameSpec: '', unit: '', qty: 0, price: 0 },
  ])

  const [deposit, setDeposit] = useState<number>(0)      // 입금액
  const [prevBalance, setPrevBalance] = useState<number>(0) // 전잔액

  // --- 저장소 (LocalStorage) 관련 상태 ---
  const [savedReceivers, setSavedReceivers] = useState<CompanyInfo[]>([])
  const [savedItems, setSavedItems] = useState<SavedItem[]>([])
  const [selectedReceiverName, setSelectedReceiverName] = useState('')

  // 첫 로드 시 브라우저에 저장된 데이터 불러오기
  useEffect(() => {
    // 1. 공급자(내 회사) 불러오기
    const loadedSupplier = localStorage.getItem('my_supplier_info')
    if (loadedSupplier) {
      try {
        setSupplier(JSON.parse(loadedSupplier))
      } catch (e) {}
    }

    // 2. 거래처 목록 불러오기
    const loadedReceivers = localStorage.getItem('saved_receivers')
    if (loadedReceivers) {
      try {
        setSavedReceivers(JSON.parse(loadedReceivers))
      } catch (e) {}
    }

    // 3. 품목 마스터 불러오기
    const loadedItems = localStorage.getItem('saved_master_items')
    if (loadedItems) {
      try {
        setSavedItems(JSON.parse(loadedItems))
      } catch (e) {}
    }
  }, [])

  // 공급자 정보 저장
  const saveSupplierInfo = () => {
    localStorage.setItem('my_supplier_info', JSON.stringify(supplier))
    alert('공급자(내 회사) 정보가 기본값으로 저장되었습니다.')
  }

  // 거래처(공급받는자) 목록에 저장
  const saveCurrentReceiver = () => {
    if (!receiver.name) {
      alert('거래처 상호명을 입력해주세요.')
      return
    }
    const filtered = savedReceivers.filter((r) => r.name !== receiver.name)
    const updated = [...filtered, receiver]
    setSavedReceivers(updated)
    localStorage.setItem('saved_receivers', JSON.stringify(updated))
    setSelectedReceiverName(receiver.name)
    alert(`[${receiver.name}] 거래처가 저장되었습니다.`)
  }

  // 거래처 선택시 불러오기
  const handleSelectReceiver = (name: string) => {
    setSelectedReceiverName(name)
    const found = savedReceivers.find((r) => r.name === name)
    if (found) {
      setReceiver(found)
    }
  }

  // 거래처 삭제
  const deleteReceiver = (name: string) => {
    const updated = savedReceivers.filter((r) => r.name !== name)
    setSavedReceivers(updated)
    localStorage.setItem('saved_receivers', JSON.stringify(updated))
    if (selectedReceiverName === name) {
      setSelectedReceiverName('')
    }
  }

  // 품목 관리: 현재 입력된 품목을 저장 마스터에 추가
  const saveToItemMaster = (item: ItemRow) => {
    if (!item.nameSpec) {
      alert('품명-규격을 입력해주세요.')
      return
    }
    const filtered = savedItems.filter((i) => i.nameSpec !== item.nameSpec)
    const newItem: SavedItem = {
      id: Date.now().toString(),
      nameSpec: item.nameSpec,
      unit: item.unit,
      price: item.price,
    }
    const updated = [...filtered, newItem]
    setSavedItems(updated)
    localStorage.setItem('saved_master_items', JSON.stringify(updated))
    alert(`[${item.nameSpec}] 품목이 자주쓰는 품목 리스트에 저장되었습니다.`)
  }

  // 자주 쓰는 품목을 명세표 줄에 불러오기
  const loadMasterItemToRow = (rowId: string, masterItemName: string) => {
    const master = savedItems.find((i) => i.nameSpec === masterItemName)
    if (!master) return
    setItems(
      items.map((item) =>
        item.id === rowId
          ? { ...item, nameSpec: master.nameSpec, unit: master.unit, price: master.price }
          : item
      )
    )
  }

  // 품목 삭제 (마스터)
  const deleteMasterItem = (id: string) => {
    const updated = savedItems.filter((i) => i.id !== id)
    setSavedItems(updated)
    localStorage.setItem('saved_master_items', JSON.stringify(updated))
  }

  // 명세표 품목 줄 추가
  const addItemRow = () => {
    if (items.length >= 8) {
      alert('한 양식당 최대 8개 품목까지 입력 가능합니다.')
      return
    }
    setItems([
      ...items,
      { id: Date.now().toString(), nameSpec: '', unit: '', qty: 0, price: 0 },
    ])
  }

  // 명세표 품목 줄 삭제
  const removeItemRow = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  // 명세표 품목 수정
  const updateItemRow = (id: string, field: keyof ItemRow, value: string | number) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  // 계산 로직
  const totalSupplyValue = items.reduce((sum, item) => sum + (item.qty || 0) * (item.price || 0), 0)
  const totalTax = Math.round(totalSupplyValue * 0.1)
  const grandTotal = totalSupplyValue + totalTax
  const currentBalance = prevBalance + grandTotal - deposit

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-2 sm:p-4 text-xs">
      {/* 상단 컨트롤 바 */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h2 className="text-base font-bold">거래명세서 작성 및 관리</h2>
          <p className="text-xs text-muted-foreground">
            공급자/거래처/품목을 저장해두고 편리하게 불러와 거래명세서를 작성하세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer className="size-4" /> 인쇄 / PDF 저장
          </Button>
        </div>
      </div>

      {/* 1. 입력 및 불러오기 관리 영역 (인쇄 시 숨김) */}
      <div className="print:hidden bg-card p-4 rounded-xl border border-border space-y-6">
        {/* 거래 기본 정보 */}
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

        {/* 공급자 & 공급받는자(거래처) 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t">
          {/* 공급자 (내 회사) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b pb-1">
              <h3 className="font-bold text-red-600">공급자 정보 (내 회사)</h3>
              <Button size="sm" variant="outline" onClick={saveSupplierInfo} className="h-6 text-[11px] gap-1">
                <Save className="size-3" /> 내 회사 정보 저장
              </Button>
            </div>
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

          {/* 공급받는자 (거래처) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b pb-1 gap-2">
              <h3 className="font-bold text-blue-600 whitespace-nowrap">공급받는자 (거래처)</h3>
              <div className="flex items-center gap-1.5 w-full justify-end">
                {/* 저장된 거래처 불러오기 드롭다운 */}
                {savedReceivers.length > 0 && (
                  <select
                    value={selectedReceiverName}
                    onChange={(e) => handleSelectReceiver(e.target.value)}
                    className="h-6 text-[11px] px-1 border rounded bg-background max-w-[140px]"
                  >
                    <option value="">-- 거래처 선택 --</option>
                    {savedReceivers.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}
                <Button size="sm" variant="outline" onClick={saveCurrentReceiver} className="h-6 text-[11px] gap-1 whitespace-nowrap">
                  <Save className="size-3" /> 거래처 저장
                </Button>
              </div>
            </div>
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

        {/* 품목 작성 및 불러오기 */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-foreground">품목 입력 명세</h3>
            <Button variant="outline" size="sm" onClick={addItemRow} className="h-7 gap-1 text-xs">
              <Plus className="size-3.5" /> 품목 줄 추가
            </Button>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.id} className="flex flex-wrap items-center gap-2 bg-muted/30 p-2 rounded border">
                <span className="w-5 text-center font-bold">{idx + 1}</span>

                {/* 자주 쓰는 품목 불러오기 선택 */}
                {savedItems.length > 0 && (
                  <select
                    onChange={(e) => loadMasterItemToRow(item.id, e.target.value)}
                    className="h-8 text-xs border rounded bg-background px-1 max-w-[130px]"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      불러오기
                    </option>
                    {savedItems.map((m) => (
                      <option key={m.id} value={m.nameSpec}>
                        {m.nameSpec}
                      </option>
                    ))}
                  </select>
                )}

                <input
                  placeholder="품명 - 규격"
                  value={item.nameSpec}
                  onChange={(e) => updateItemRow(item.id, 'nameSpec', e.target.value)}
                  className="flex-1 min-w-[140px] h-8 px-2 border rounded bg-background"
                />
                <input
                  placeholder="단위"
                  value={item.unit}
                  onChange={(e) => updateItemRow(item.id, 'unit', e.target.value)}
                  className="w-14 h-8 px-2 border rounded bg-background text-center"
                />
                <input
                  type="number"
                  placeholder="수량"
                  value={item.qty || ''}
                  onChange={(e) => updateItemRow(item.id, 'qty', Number(e.target.value))}
                  className="w-20 h-8 px-2 border rounded bg-background text-right"
                />
                <input
                  type="number"
                  placeholder="단가"
                  value={item.price || ''}
                  onChange={(e) => updateItemRow(item.id, 'price', Number(e.target.value))}
                  className="w-24 h-8 px-2 border rounded bg-background text-right"
                />
                <span className="w-24 text-right font-semibold pr-1">
                  {((item.qty || 0) * (item.price || 0)).toLocaleString()}원
                </span>

                <Button
                  size="sm"
                  variant="ghost"
                  title="자주 쓰는 품목으로 저장"
                  onClick={() => saveToItemMaster(item)}
                  className="h-8 px-2 text-xs gap-1"
                >
                  <Save className="size-3.5" /> 저장
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeItemRow(item.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* 입금액 및 잔액 */}
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
  supplier: CompanyInfo
  receiver: CompanyInfo
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
            <td rowSpan={5} className="border border-current w-5 font-bold" style={{ backgroundColor: bgLight }}>
              공<br />급<br />자
            </td>
            <td className="border border-current w-14 font-semibold">등록번호</td>
            <td colSpan={3} className="border border-current font-bold text-left px-1.5">{supplier.bizNo}</td>
            <td rowSpan={5} className="border border-current w-5 font-bold" style={{ backgroundColor: bgLight }}>
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

      {/* 품목 명세 표 */}
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

      {/* 하단 금액 및 잔액 표 */}
      <div className="flex border-2 border-current">
        <div className="flex-1 border-r border-current p-1 space-y-1">
          <div className="text-[10px]">미수금 / 참고사항 기록란</div>
        </div>
        <div className="w-72">
          <table className="w-full border-collapse text-center">
            <tbody>
              <tr className="border-b border-current h-5">
                <td className="border-r border-current w-16 font-semibold" style={{ backgroundColor: bgLight }}>입금액</td>
                <td className="border-r border-current text-right px-1 font-bold">{deposit ? deposit.toLocaleString() : ''}</td>
                <td className="border-r border-current w-16 font-semibold" style={{ backgroundColor: bgLight }}>합계액</td>
                <td className="text-right px-1 font-bold">{grandTotal ? grandTotal.toLocaleString() : ''}</td>
              </tr>
              <tr className="h-5">
                <td className="border-r border-current font-semibold" style={{ backgroundColor: bgLight }}>전잔액</td>
                <td className="border-r border-current text-right px-1 font-bold">{prevBalance ? prevBalance.toLocaleString() : ''}</td>
                <td className="border-r border-current font-semibold" style={{ backgroundColor: bgLight }}>현잔액</td>
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
