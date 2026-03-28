'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMemo, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Point = {
  label: string
  hours: number
}

interface TrainerReportChartProps {
  weekly: Point[]
  lastMonth: Point[]
  last3Months: Point[]
  last6Months: Point[]
}

type Range = 'WEEKLY' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'LAST_6_MONTHS'

export function TrainerReportChart({ weekly, lastMonth, last3Months, last6Months }: TrainerReportChartProps) {
  const [range, setRange] = useState<Range>('WEEKLY')

  const chartData = useMemo(() => {
    if (range === 'LAST_MONTH') return lastMonth
    if (range === 'LAST_3_MONTHS') return last3Months
    if (range === 'LAST_6_MONTHS') return last6Months
    return weekly
  }, [range, weekly, lastMonth, last3Months, last6Months])

  const subLabel =
    range === 'LAST_MONTH'
      ? 'Day-wise hours (last month)'
      : range === 'LAST_3_MONTHS'
        ? 'Day-wise hours (last 3 months)'
        : range === 'LAST_6_MONTHS'
          ? 'Day-wise hours (last 6 months)'
          : 'Day-wise hours (last 7 days)'

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider m-0">
          {subLabel}
        </h3>
        <Select value={range} onValueChange={(v) => setRange(v as Range)}>
          <SelectTrigger className="w-[150px] h-8 text-xs font-semibold border-border bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WEEKLY" className="text-xs">Weekly</SelectItem>
            <SelectItem value="LAST_MONTH" className="text-xs">Last month</SelectItem>
            <SelectItem value="LAST_3_MONTHS" className="text-xs">Last 3 months</SelectItem>
            <SelectItem value="LAST_6_MONTHS" className="text-xs">Last 6 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="label" fontSize={11} tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
            <YAxis
              allowDecimals={false}
              fontSize={11}
              tick={{ fill: '#888' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}h`}
            />
            <Tooltip formatter={(v: number) => [`${Number(v).toFixed(2)} hrs`, 'Worked']} />
            <Line type="monotone" dataKey="hours" stroke="#1D9E75" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
