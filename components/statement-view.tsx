'use client'

import { useState, useEffect } from 'react'
import { Printer, Plus, Trash2, Save, Settings, Edit3, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ItemRow = {
  id: string
  nameSpec: string // 품명 - 규격
  unit: string     // 단위 (기본 EA)
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
  const [memo, setMemo] = useState('') // 미수금 및 참고사항 메모

  // 공급자 정보 (내 회사)
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

  // 공급받는자 정보 (거래처)
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

  // 명세표 품목 목록 (기본 단위: EA, 공란 2줄)
  const [items, setItems] = useState<ItemRow[]>([
    { id: '1', nameSpec: '', unit: 'EA', qty: 0, price: 0 },
    { id: '2', nameSpec: '', unit: 'EA', qty: 0, price: 0 },
  ])

  const [deposit, setDeposit] = useState<number>(0)       // 입금액
  const [prevBalance, setPrevBalance] = useState<number>(0) // 전잔액

  // --- 저장소 (LocalStorage) 관련 상태 ---
  const [savedReceivers, setSavedReceivers] = useState<CompanyInfo[]>([])
  const [savedItems, setSavedItems] = useState<SavedItem[]>([])
  const [selectedReceiverName, setSelectedReceiverName] = useState('')

  // 모달 상태
  const [isReceiverModalOpen, setIsReceiverModalOpen] = useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)

  // 수정용 임시 상태
  const [editingReceiver, setEditingReceiver] = useState<CompanyInfo | null>(null)
  const [editingItem, setEditingItem] = useState<SavedItem | null>(null)

  // 첫 로드 시 브라우저에 저장된 데이터 불러오기
  useEffect(() => {
    const loadedSupplier = localStorage.getItem('my_supplier_info')
    if (loadedSupplier) {
      try { setSupplier(JSON.parse(loadedSupplier)) } catch (e) {}
    }

    const loadedReceivers = localStorage.getItem('saved_receivers')
    if (loadedReceivers) {
      try { setSavedReceivers(JSON.parse(loadedReceivers)) } catch (e) {}
    }

    const loadedItems = localStorage.getItem('saved_master_items')
    if (loadedItems) {
      try { setSavedItems(JSON.parse(loadedItems)) } catch (e) {}
    }
  }, [])

  // 1. 내 회사 정보 저장
  const saveSupplierInfo = () => {
    localStorage.setItem('my_supplier_info', JSON.stringify(supplier))
    alert('공급자(내 회사) 정보가 저장되었습니다.')
  }

  // 2. 거래처 저장 / 수정 / 삭제
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

  const handleSelectReceiver = (name: string) => {
    setSelectedReceiverName(name)
    const found = savedReceivers.find((r) => r.name === name)
    if (found) setReceiver(found)
  }

  const deleteReceiver = (name: string) => {
    if (!confirm(`[${name}] 거래처를 삭제하시겠습니까?`)) return
    const updated = savedReceivers.filter((r) => r.name !== name)
    setSavedReceivers(updated)
    localStorage.setItem('saved_receivers', JSON.stringify(updated))
    if (selectedReceiverName === name) setSelectedReceiverName('')
    if (editingReceiver?.name === name) setEditingReceiver(null)
  }

  const updateReceiverInModal = () => {
    if (!editingReceiver) return
    const updated = savedReceivers.map((r) =>
      r.name === editingReceiver.name ? editingReceiver : r
    )
    setSavedReceivers(updated)
    localStorage.setItem('saved_receivers', JSON.stringify(updated))
    if (receiver.name === editingReceiver.name) setReceiver(editingReceiver)
    setEditingReceiver(null)
    alert('거래처 정보가 수정되었습니다.')
  }

  // 3. 품목 마스터 저장 / 수정 / 삭제
  const saveToItemMaster = (item: ItemRow) => {
    if (!item.nameSpec) {
      alert('품명-규격을 입력해주세요.')
      return
    }
    const filtered = savedItems.filter((i) => i.nameSpec !== item.nameSpec)
    const newItem: SavedItem = {
      id: Date.now().toString(),
      nameSpec: item.nameSpec,
      unit: item.unit || 'EA',
      price: item.price,
    }
    const updated = [...filtered, newItem]
    setSavedItems(updated)
    localStorage.setItem('saved_master_items', JSON.stringify(updated))
    alert(`[${item.nameSpec}] 품목이 등록되었습니다.`)
  }

  const loadMasterItemToRow = (rowId: string, masterItemName: string) => {
    const master = savedItems.find((i) => i.nameSpec === masterItemName)
    if (!master) return
    setItems(
      items.map((item) =>
        item.id === rowId
          ? { ...item, nameSpec: master.nameSpec, unit: master.unit || 'EA', price: master.price }
          : item
      )
    )
  }

  const deleteMasterItem = (id: string) => {
    if (!confirm('해당 품목을 목록에서 삭제하시겠습니까?')) return
    const updated = savedItems.filter((i) => i.id !== id)
    setSavedItems(updated)
    localStorage.setItem('saved_master_items', JSON.stringify(updated))
    if (editingItem?.id === id) setEditingItem(null)
  }

  const updateMasterItemInModal = () => {
    if (!editingItem) return
    const updated = savedItems.map((i) => (i.id === editingItem.id ? editingItem : i))
    setSavedItems(updated)
    localStorage.setItem('saved_master_items', JSON.stringify(updated))
    setEditingItem(null)
    alert('품목 정보가 수정되었습니다.')
  }

  // 明細 행 관리
  const addItemRow = () => {
    if (items.length >= 8) {
      alert('한 양식당 최대 8개 품목까지 입력 가능합니다.')
      return
    }
    setItems([
      ...items,
      { id: Date.now().toString(), nameSpec: '', unit: 'EA', qty: 0, price: 0 },
    ])
  }

  const removeItemRow = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const updateItemRow = (id: string, field: keyof ItemRow, value: string | number) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  // 금액 자동 계산
  const totalSupplyValue = items.reduce((sum, item) => sum + (item.qty || 0) * (item.price || 0), 0)
  const totalTax = Math.round(totalSupplyValue * 0.1)
  const grandTotal = totalSupplyValue + totalTax
  const currentBalance = prevBalance + grandTotal - deposit

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-2 sm:p-4 text-xs">
      {/* 컨트롤 바 */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h2 className="text-base font-bold">거래명세서 작성 및 관리</h2>
          <p className="text-xs text-muted-foreground">
            저장된 거래처 및 품목을 불러오거나 관리 모달에서 언제든지 수정/삭제할 수 있습니다.
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
            <div className="flex items-center justify-between border-b pb-1 gap-1">
              <h3 className="font-bold text-blue-600 whitespace-nowrap">공급받는자 (거래처)</h3>
              <div className="flex items-center gap-1">
                {savedReceivers.length > 0 && (
                  <select
                    value={selectedReceiverName}
                    onChange={(e) => handleSelectReceiver(e.target.value)}
                    className="h-6 text-[11px] px-1 border rounded bg-background max-w-[120px]"
                  >
                    <option value="">-- 거래처 선택 --</option>
                    {savedReceivers.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}
                <Button size="sm" variant="outline" onClick={saveCurrentReceiver} className="h-6 text-[11px] gap-1 px-1.5">
                  <Save className="size-3" /> 저장
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setIsReceiverModalOpen(true)} className="h-6 text-[11px] gap-1 px-1.5">
                  <Settings className="size-3" /> 관리
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

        {/* 품목 작성 및 관리 */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-foreground">품목 입력 명세</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setIsItemModalOpen(true)} className="h-7 text-xs gap-1">
                <Settings className="size-3.5" /> 자주 쓰는 품목 목록 관리
              </Button>
              <Button variant="outline" size="sm" onClick={addItemRow} className="h-7 gap-1 text-xs">
                <Plus className="size-3.5" /> 품목 줄 추가
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.id} className="flex flex-wrap items-center gap-2 bg-muted/30 p-2 rounded border">
                <span className="w-5 text-center font-bold">{idx + 1}</span>

                {/* 자주 쓰는 품목 불러오기 선택 */}
                {savedItems.length > 0 && (
                  <select
                    onChange={(e) => loadMasterItemToRow(item.id, e.target.value)}
                    className="h-8 text-xs border rounded bg-background px-1 max-w-[120px]"
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

                {/* 단위: 기본 EA 고정 및 셀렉트 박스 */}
                <select
                  value={item.unit || 'EA'}
                  onChange={(e) => updateItemRow(item.id, 'unit', e.target.value)}
                  className="w-16 h-8 px-1 border rounded bg-background text-center font-semibold"
                >
                  <option value="EA">EA</option>
                  <option value="M">M</option>
                  <option value="SET">SET</option>
                  <option value="BOX">BOX</option>
                  <option value="KG">KG</option>
                </select>

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
                  title="자주 쓰는 품목 리스트에 추가"
                  onClick={() => saveToItemMaster(item)}
                  className="h-8 px-2 text-xs gap-1"
                >
                  <Save className="size-3.5" /> 등록
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

        {/* 입금액, 잔액 및 미수금/참고사항 입력 */}
        <div className="space-y-4 pt-2 border-t">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-muted-foreground font-semibold">입금액</label>
              <input
                type="number"
                value={deposit || ''}
                onChange={(e) => setDeposit(Number(e.target.value))}
                className="w-full h-8 px-2 border rounded bg-background text-right font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground font-semibold">전잔액</label>
              <input
                type="number"
                value={prevBalance || ''}
                onChange={(e) => setPrevBalance(Number(e.target.value))}
                className="w-full h-8 px-2 border rounded bg-background text-right font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground font-semibold">합계액(공급가+세액)</label>
              <div className="h-8 px-2 border rounded bg-muted flex items-center justify-end font-bold text-foreground">
                {grandTotal.toLocaleString()}원
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground font-semibold">현잔액</label>
              <div className="h-8 px-2 border rounded bg-muted flex items-center justify-end font-bold text-foreground">
                {currentBalance.toLocaleString()}원
              </div>
            </div>
          </div>

          {/* 참고사항 입력란 */}
          <div className="space-y-1">
            <label className="font-bold text-foreground">미수금 및 참고사항</label>
            <textarea
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 계좌번호(국민 123-456-789), 출고 방식, 미수금 관련 메모 등 자유롭게 기재"
              className="w-full p-2 border rounded bg-background resize-none text-xs"
            />
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
          memo={memo}
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
          memo={memo}
          totalSupplyValue={totalSupplyValue}
          totalTax={totalTax}
          grandTotal={grandTotal}
          currentBalance={currentBalance}
        />
      </div>

      {/* --- 모달 1: 거래처 관리/수정/삭제 모달 --- */}
      {isReceiverModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl w-full max-w-lg p-4 space-y-4 shadow-lg">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-base">저장된 거래처 관리 및 수정</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsReceiverModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            {/* 거래처 목록 */}
            <div className="max-h-48 overflow-y-auto space-y-2 border-b pb-3">
              {savedReceivers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">저장된 거래처가 없습니다.</p>
              ) : (
                savedReceivers.map((r) => (
                  <div key={r.name} className="flex justify-between items-center bg-muted/40 p-2 rounded">
                    <div>
                      <span className="font-bold">{r.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({r.bizNo || '등록번호 없음'})</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setEditingReceiver(r)} className="h-7 text-xs gap-1">
                        <Edit3 className="size-3" /> 수정
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteReceiver(r.name)} className="h-7 text-xs">
                        삭제
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 거래처 수정 폼 */}
            {editingReceiver && (
              <div className="space-y-2 bg-muted/20 p-3 rounded border">
                <h4 className="font-bold text-xs text-primary">[{editingReceiver.name}] 정보 수정</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="등록번호" value={editingReceiver.bizNo} onChange={(e) => setEditingReceiver({ ...editingReceiver, bizNo: e.target.value })} className="h-8 px-2 border rounded bg-background" />
                  <input placeholder="대표자명" value={editingReceiver.owner} onChange={(e) => setEditingReceiver({ ...editingReceiver, owner: e.target.value })} className="h-8 px-2 border rounded bg-background" />
                  <input placeholder="전화" value={editingReceiver.tel} onChange={(e) => setEditingReceiver({ ...editingReceiver, tel: e.target.value })} className="h-8 px-2 border rounded bg-background" />
                  <input placeholder="팩스" value={editingReceiver.fax} onChange={(e) => setEditingReceiver({ ...editingReceiver, fax: e.target.value })} className="h-8 px-2 border rounded bg-background" />
                  <input placeholder="주소" value={editingReceiver.address} onChange={(e) => setEditingReceiver({ ...editingReceiver, address: e.target.value })} className="col-span-2 h-8 px-2 border rounded bg-background" />
                  <input placeholder="업태" value={editingReceiver.bizType} onChange={(e) => setEditingReceiver({ ...editingReceiver, bizType: e.target.value })} className="h-8 px-2 border rounded bg-background" />
                  <input placeholder="종목" value={editingReceiver.bizItem} onChange={(e) => setEditingReceiver({ ...editingReceiver, bizItem: e.target.value })} className="h-8 px-2 border rounded bg-background" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditingReceiver(null)}>취소</Button>
                  <Button size="sm" onClick={updateReceiverInModal}>수정 저장</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- 모달 2: 자주 쓰는 품목 관리/수정/삭제 모달 --- */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl w-full max-w-lg p-4 space-y-4 shadow-lg">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-base">자주 쓰는 품목 목록 관리 및 수정</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsItemModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            {/* 품목 목록 */}
            <div className="max-h-48 overflow-y-auto space-y-2 border-b pb-3">
              {savedItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">저장된 품목이 없습니다.</p>
              ) : (
                savedItems.map((m) => (
                  <div key={m.id} className="flex justify-between items-center bg-muted/40 p-2 rounded">
                    <div>
                      <span className="font-bold">{m.nameSpec}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        [{m.unit || 'EA'}] {(m.price || 0).toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setEditingItem(m)} className="h-7 text-xs gap-1">
                        <Edit3 className="size-3" /> 수정
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteMasterItem(m.id)} className="h-7 text-xs">
                        삭제
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 품목 수정 폼 */}
            {editingItem && (
              <div className="space-y-2 bg-muted/20 p-3 rounded border">
                <h4 className="font-bold text-xs text-primary">품목 정보 수정</h4>
                <div className="grid grid-cols-3 gap-2">
                  <input placeholder="품명-규격" value={editingItem.nameSpec} onChange={(e) => setEditingItem({ ...editingItem, nameSpec: e.target.value })} className="col-span-2 h-8 px-2 border rounded bg-background" />
                  <select
                    value={editingItem.unit || 'EA'}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="h-8 px-1 border rounded bg-background text-center font-semibold"
                  >
                    <option value="EA">EA</option>
                    <option value="M">M</option>
                    <option value="SET">SET</option>
                    <option value="BOX">BOX</option>
                    <option value="KG">KG</option>
                  </select>
                  <input type="number" placeholder="기본 단가" value={editingItem.price || ''} onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })} className="col-span-3 h-8 px-2 border rounded bg-background text-right" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}>취소</Button>
                  <Button size="sm" onClick={updateMasterItemInModal}>수정 저장</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
  memo: string
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
  memo,
  totalSupplyValue,
  totalTax,
  grandTotal,
  currentBalance,
}: StatementPaperProps) {
  const maxRows = 6
  const emptyRowsCount = Math.max(0, maxRows - items.length)
  const emptyRows = Array.from({ length: emptyRowsCount })

  return (
    <div className="w-full text-[11px] leading-snug font-sans select-none" style={{ color }}>
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

      {/* 공급자 / 공급받는자 헤더 테이블 */}
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
            <td className="border border-current font-semibold">종목</td>
            <td className="border border-current text-left px-1.5">{supplier.bizItem}</td>
            <td className="border border-current font-semibold">업태</td>
            <td className="border border-current text-left px-1.5">{receiver.bizType}</td>
            <td className="border border-current font-semibold">종목</td>
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

      {/* 품목 명세 테이블 */}
      <table className="w-full border-collapse border-2 border-current text-center mb-1">
        <thead>
          <tr style={{ backgroundColor: bgLight }}>
            <th className="border border-current py-1 w-8">NO</th>
            <th className="border border-current py-1">품명 및 규격</th>
            <th className="border border-current py-1 w-12">단위</th>
            <th className="border border-current py-1 w-16">수량</th>
            <th className="border border-current py-1 w-20">단가</th>
            <th className="border border-current py-1 w-24">공급가액</th>
            <th className="border border-current py-1 w-20">세액</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const rowSupply = (item.qty || 0) * (item.price || 0)
            const rowTax = Math.round(rowSupply * 0.1)
            return (
              <tr key={item.id} className="h-6">
                <td className="border border-current font-medium">{idx + 1}</td>
                <td className="border border-current text-left px-2 font-semibold">{item.nameSpec}</td>
                <td className="border border-current">{item.unit || 'EA'}</td>
                <td className="border border-current text-right px-1.5">{item.qty ? item.qty.toLocaleString() : ''}</td>
                <td className="border border-current text-right px-1.5">{item.price ? item.price.toLocaleString() : ''}</td>
                <td className="border border-current text-right px-1.5 font-semibold">{rowSupply ? rowSupply.toLocaleString() : ''}</td>
                <td className="border border-current text-right px-1.5">{rowTax ? rowTax.toLocaleString() : ''}</td>
              </tr>
            )
          })}
          {emptyRows.map((_, idx) => (
            <tr key={`empty-${idx}`} className="h-6">
              <td className="border border-current">{items.length + idx + 1}</td>
              <td className="border border-current"></td>
              <td className="border border-current"></td>
              <td className="border border-current"></td>
              <td className="border border-current"></td>
              <td className="border border-current"></td>
              <td className="border border-current"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 하단 요약 및 미수금/참고사항 테이블 */}
      <table className="w-full border-collapse border-2 border-current text-center">
        <tbody>
          <tr>
            <td className="border border-current w-16 font-semibold" style={{ backgroundColor: bgLight }}>공급가액</td>
            <td className="border border-current w-28 text-right px-2 font-bold">{totalSupplyValue.toLocaleString()}원</td>
            <td className="border border-current w-12 font-semibold" style={{ backgroundColor: bgLight }}>세액</td>
            <td className="border border-current w-24 text-right px-2 font-bold">{totalTax.toLocaleString()}원</td>
            <td className="border border-current w-16 font-semibold" style={{ backgroundColor: bgLight }}>계인등</td>
            <td className="border border-current text-left px-2" rowSpan={2}>
              <div className="text-[10px] text-gray-700 whitespace-pre-wrap leading-tight">
                {memo || '위 금액을 정히 영수(청구)함.'}
              </div>
            </td>
          </tr>
          <tr>
            <td className="border border-current font-semibold" style={{ backgroundColor: bgLight }}>합계금액</td>
            <td colSpan={3} className="border border-current text-right px-2 font-black text-sm">
              {grandTotal.toLocaleString()}원
            </td>
            <td className="border border-current font-semibold" style={{ backgroundColor: bgLight }}>잔액</td>
          </tr>
          <tr>
            <td className="border border-current font-semibold" style={{ backgroundColor: bgLight }}>전잔액</td>
            <td className="border border-current text-right px-2 font-medium">{prevBalance.toLocaleString()}원</td>
            <td className="border border-current font-semibold" style={{ backgroundColor: bgLight }}>입금액</td>
            <td className="border border-current text-right px-2 font-medium">{deposit.toLocaleString()}원</td>
            <td className="border border-current font-semibold" style={{ backgroundColor: bgLight }}>현잔액</td>
            <td className="border border-current text-right px-2 font-bold">{currentBalance.toLocaleString()}원</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
