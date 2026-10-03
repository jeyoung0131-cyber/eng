"use client";

import React, { useState, useEffect } from "react";

// 품목 행 인터페이스 정의
export interface ItemRow {
  id: string;
  date: string;
  itemName: string;
  spec: string;
  qty: number | "";
  price: number | "";
  supplyPrice: number | "";
  tax: number | "";
  note: string;
}

export function StatementView() {
  // 공급받는자 / 담당사원
  const [customerName, setCustomerName] = useState("");
  const [manager, setManager] = useState("");

  // 품목 데이터
  const [items, setItems] = useState<ItemRow[]>([
    {
      id: "1",
      date: "",
      itemName: "",
      spec: "",
      qty: "",
      price: "",
      supplyPrice: "",
      tax: "",
      note: "",
    },
  ]);

  // 미수금 및 참고사항
  const [unpaidAmount, setUnpaidAmount] = useState<number | "">("");
  const [remarks, setRemarks] = useState("");

  // 저장된 Extra Info 불러오기
  useEffect(() => {
    const savedData = localStorage.getItem("statement_extra_info");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.manager !== undefined) setManager(parsed.manager);
        if (parsed.unpaidAmount !== undefined) setUnpaidAmount(parsed.unpaidAmount);
        if (parsed.remarks !== undefined) setRemarks(parsed.remarks);
        if (parsed.customerName !== undefined) setCustomerName(parsed.customerName);
      } catch (e) {
        console.error("데이터 복원 실패", e);
      }
    }
  }, []);

  // 담당사원, 미수금, 참고사항 저장
  const handleSaveExtraInfo = () => {
    const dataToSave = {
      customerName,
      manager,
      unpaidAmount,
      remarks,
    };
    localStorage.setItem("statement_extra_info", JSON.stringify(dataToSave));
    alert("담당사원, 미수금 및 참고사항이 성공적으로 저장되었습니다!");
  };

  // 품목 행 추가
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        date: "",
        itemName: "",
        spec: "",
        qty: "",
        price: "",
        supplyPrice: "",
        tax: "",
        note: "",
      },
    ]);
  };

  // 품목 데이터 변경
  const handleItemChange = (
    index: number,
    field: keyof ItemRow,
    value: string | number
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white shadow rounded-md">
      <h1 className="text-2xl font-bold mb-6 text-center">거래명세표</h1>

      {/* 상단 기본 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">상호 (공급받는자)</label>
          <input
            type="text"
            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="상호명 입력"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">담당사원</label>
          <input
            type="text"
            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={manager}
            onChange={(e) => setManager(e.target.value)}
            placeholder="담당사원 성함"
          />
        </div>
      </div>

      {/* 품목 입력 테이블 */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full border-collapse border text-sm">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="border p-2">품목명</th>
              <th className="border p-2">규격</th>
              <th className="border p-2 w-20">수량</th>
              <th className="border p-2 w-24">단가</th>
              <th className="border p-2 w-28">공급가액</th>
              <th className="border p-2 w-24">세액</th>
              <th className="border p-2">비고</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id} className="border-b">
                <td className="border p-1">
                  <input
                    type="text"
                    className="w-full p-1 border rounded"
                    value={item.itemName}
                    onChange={(e) => handleItemChange(idx, "itemName", e.target.value)}
                  />
                </td>
                <td className="border p-1">
                  <input
                    type="text"
                    className="w-full p-1 border rounded"
                    value={item.spec}
                    onChange={(e) => handleItemChange(idx, "spec", e.target.value)}
                  />
                </td>
                <td className="border p-1">
                  <input
                    type="number"
                    className="w-full p-1 border rounded text-right"
                    value={item.qty}
                    onChange={(e) =>
                      handleItemChange(
                        idx,
                        "qty",
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                  />
                </td>
                <td className="border p-1">
                  <input
                    type="number"
                    className="w-full p-1 border rounded text-right"
                    value={item.price}
                    onChange={(e) =>
                      handleItemChange(
                        idx,
                        "price",
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                  />
                </td>
                <td className="border p-1">
                  <input
                    type="number"
                    className="w-full p-1 border rounded text-right"
                    value={item.supplyPrice}
                    onChange={(e) =>
                      handleItemChange(
                        idx,
                        "supplyPrice",
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                  />
                </td>
                <td className="border p-1">
                  <input
                    type="number"
                    className="w-full p-1 border rounded text-right"
                    value={item.tax}
                    onChange={(e) =>
                      handleItemChange(
                        idx,
                        "tax",
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                  />
                </td>
                <td className="border p-1">
                  <input
                    type="text"
                    className="w-full p-1 border rounded"
                    value={item.note}
                    onChange={(e) => handleItemChange(idx, "note", e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={handleAddItem}
          className="mt-2 text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
        >
          + 품목 행 추가
        </button>
      </div>

      {/* 하단 미수금 및 참고사항 */}
      <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">미수금</label>
          <input
            type="number"
            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={unpaidAmount}
            onChange={(e) =>
              setUnpaidAmount(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="미수금 금액 입력"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">참고사항</label>
          <textarea
            rows={3}
            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="참고사항 입력"
          />
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="mt-6 text-right">
        <button
          onClick={handleSaveExtraInfo}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow"
        >
          담당사원 / 미수금 / 참고사항 저장
        </button>
      </div>
    </div>
  );
}

export default StatementView;
