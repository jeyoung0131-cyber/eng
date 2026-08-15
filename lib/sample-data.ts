import type { Client, Expense, LedgerEntry, SaleProject, StageKey } from './finance'

function stages(
  supply: number,
  ratios: [number, number, number],
  paid: [boolean, boolean, boolean],
  dates: [string?, string?, string?],
) {
  const keys: StageKey[] = ['advance', 'interim', 'balance']
  return keys.map((key, i) => ({
    key,
    amount: Math.round(supply * ratios[i]),
    paid: paid[i],
    paidDate: dates[i],
  }))
}

export const sampleClients: Client[] = [
  { id: 'c1', name: '한빛정밀기계', bizNumber: '123-45-67890', contact: '02-555-1234' },
  { id: 'c2', name: '대성전자부품', bizNumber: '221-81-33445', contact: '031-777-8899' },
  { id: 'c3', name: '동양금속가공', bizNumber: '312-86-11223', contact: '032-444-2211' },
  { id: 'c4', name: '미래산업', bizNumber: '514-88-90011', contact: '051-333-6677' },
]

export const sampleProjects: SaleProject[] = [
  {
    id: 'p1',
    clientId: 'c1',
    title: 'CNC 가공 부품 3,000EA 납품',
    date: '2026-06-12',
    supplyAmount: 48000000,
    stages: stages(48000000, [0.3, 0.4, 0.3], [true, true, false], ['2026-06-15', '2026-07-10']),
  },
  {
    id: 'p2',
    clientId: 'c2',
    title: '커넥터 하우징 금형 제작',
    date: '2026-06-28',
    supplyAmount: 32000000,
    stages: stages(32000000, [0.4, 0.3, 0.3], [true, false, false], ['2026-07-02']),
  },
  {
    id: 'p3',
    clientId: 'c3',
    title: '스테인리스 브라켓 대량 발주',
    date: '2026-07-05',
    supplyAmount: 21500000,
    stages: stages(21500000, [0.3, 0.4, 0.3], [true, true, true], ['2026-07-06', '2026-07-20', '2026-08-05']),
  },
  {
    id: 'p4',
    clientId: 'c4',
    title: '알루미늄 프로파일 절단·조립',
    date: '2026-07-22',
    supplyAmount: 15800000,
    stages: stages(15800000, [0.5, 0.25, 0.25], [true, false, false], ['2026-07-25']),
  },
  {
    id: 'p5',
    clientId: 'c1',
    title: '정밀 샤프트 시제품 개발',
    date: '2026-08-03',
    supplyAmount: 9200000,
    stages: stages(9200000, [0.5, 0, 0.5], [false, false, false], []),
  },
]

export const sampleExpenses: Expense[] = [
  { id: 'e1', date: '2026-06-05', vendor: '포스코강판', description: '냉연강판 원자재', category: '원자재', supplyAmount: 12500000, withholding: false },
  { id: 'e2', date: '2026-06-18', vendor: '정밀열처리', description: '외주 열처리 가공', category: '외주가공', supplyAmount: 4200000, withholding: false },
  { id: 'e3', date: '2026-06-25', vendor: '김도금(개인)', description: '표면처리 외주 (개인사업자)', category: '외주가공', supplyAmount: 3000000, withholding: true },
  { id: 'e4', date: '2026-07-01', vendor: '생산직 급여', description: '7월 생산직 인건비', category: '인건비', supplyAmount: 8800000, withholding: true },
  { id: 'e5', date: '2026-07-14', vendor: '삼성알루미늄', description: '알루미늄 빌렛', category: '원자재', supplyAmount: 6700000, withholding: false },
  { id: 'e6', date: '2026-07-30', vendor: '한국전력', description: '공장 전기요금', category: '경비', supplyAmount: 1900000, withholding: false },
  { id: 'e7', date: '2026-08-02', vendor: '이설계(개인)', description: '도면 설계 용역', category: '외주가공', supplyAmount: 2500000, withholding: true },
]

export const sampleLedger: LedgerEntry[] = [
  { id: 'l1', date: '2026-08-08', party: '신성기공', kind: 'sale', amount: 3300000, vatIncluded: true, memo: '단납 부품 현금 매출' },
  { id: 'l2', date: '2026-08-10', party: '동성공구', kind: 'expense', amount: 550000, vatIncluded: true, memo: '절삭공구 구매' },
]
