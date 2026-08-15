import { cn } from '@/lib/utils'

type Segment = { key: string; label: string; value: number; active: boolean }

type Props = {
  progress: number // 0~1
  segments?: Segment[]
  className?: string
}

/** 미수금/입금 진행 게이지 바 (단계별 세그먼트 지원) */
export function GaugeBar({ progress, segments, className }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100)

  if (segments && segments.length) {
    const total = segments.reduce((s, seg) => s + seg.value, 0) || 1
    return (
      <div className={cn('flex h-3 w-full overflow-hidden rounded-full bg-muted', className)}>
        {segments.map((seg, i) => (
          <div
            key={seg.key}
            className={cn(
              'h-full transition-colors',
              i > 0 && 'border-l border-background',
              seg.active ? 'bg-success' : 'bg-transparent',
            )}
            style={{ width: `${(seg.value / total) * 100}%` }}
            title={`${seg.label} · ${seg.active ? '입금완료' : '미입금'}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('h-3 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all',
          pct >= 100 ? 'bg-success' : 'bg-primary',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
