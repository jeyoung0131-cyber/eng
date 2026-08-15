'use client'

import { formatCompactWon, type MonthlyPoint } from '@/lib/finance'

export function MonthlyChart({ data }: { data: MonthlyPoint[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.sales, d.expenses]))

  return (
    <div>
      <div className="flex items-end gap-6 overflow-x-auto pb-2">
        {data.map((d) => {
          const label = d.month.replace('-', '.')
          return (
            <div key={d.month} className="flex min-w-14 flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full items-end justify-center gap-1.5">
                <Bar value={d.sales} max={max} color="bg-chart-1" />
                <Bar value={d.expenses} max={max} color="bg-chart-3" />
              </div>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <Legend color="bg-chart-1" label="매출" />
        <Legend color="bg-chart-3" label="지출" />
      </div>
    </div>
  )
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const h = Math.max(4, Math.round((value / max) * 100))
  return (
    <div className="group relative flex h-full w-5 flex-col items-center justify-end">
      <span className="mb-1 whitespace-nowrap text-[10px] font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
        {formatCompactWon(value)}
      </span>
      <div
        className={`w-full rounded-t-sm ${color} transition-all`}
        style={{ height: `${h}%` }}
      />
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block size-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  )
}
