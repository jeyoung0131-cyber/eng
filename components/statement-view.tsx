"use client";

import React, { useState, useEffect } from "react";

interface ItemRow {
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

export default function StatementView() {
  // 기본 입력 정보 상태
  const [customerName, setCustomerName] = useState("");
  const [manager, setManager] = useState(""); // 담당사원
  const [items, setItems] = useState<ItemRow[]>([]);
  const [unpaidAmount, setUnpaidAmount] = useState<number | "">(""); // 미수금
  const [remarks, setRemarks] = useState(""); // 참고사항

  // 페이지 로드 시 저장된 데이터 불러오기
  useEffect(() => {
    const savedData = localStorage.getItem("statement_extra_info");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.manager !== undefined) setManager(parsed.manager);
        if (parsed.unpaidAmount !== undefined) setUnpaidAmount(parsed.unpaidAmount);
        if (parsed.remarks !== undefined) setRemarks(parsed.remarks);
      } catch (e) {
        console.error("저장된 데이터를 불러오는 중 오류가 발생했습니다.", e);
      }
    }
  }, []);

  // 저장 함수
  const handleSaveExtraInfo = () => {
    const dataToSave = {
      manager,
      unpaidAmount,
      remarks,
    };
    localStorage.setItem("statement_extra_info", JSON.stringify(dataToSave));
    alert("담당사원, 미수금 및 참고사항이 성공적으로 저장되었습니다!");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow rounded-md">
      <h1 className="text-2xl font-bold mb-4 text-center">거래명세서</h1>

      {/* 상단 기본 정보 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">상호(공급받는자)</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="거래처명 입력"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">담당사원</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={manager}
            onChange={(e) => setManager(e.target.value)}
            placeholder="담당사원 이름 입력"
          />
        </div>
      </div>

      {/* 품목 입력 테이블 영역 (생략 가능/필요에 따라 유지) */}
      <div className="mb-6 border-t pt-4">
        <p className="text-sm text-gray-500 mb-2">* 품목 명세서 입력란</p>
        {/* 품목 테이블 로직 위치 */}
      </div>

      {/* 하단 미수금 및 참고사항 */}
      <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">미수금</label>
          <input
            type="number"
            className="w-full border p-2 rounded"
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
            className="w-full border p-2 rounded"
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
