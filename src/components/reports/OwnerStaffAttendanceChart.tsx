'use client'

import { useMemo, useState } from 'react'
import {
    PolarAngleAxis,
    RadialBar,
    RadialBarChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type StaffUser = {
    id: string
    name: string
    role: 'TRAINER' | 'RECEPTION'
}

type AttendanceLog = {
    userId: string
    checkedAt: string
    type: string
}

type Filter = 'TODAY' | 'WEEK' | 'MONTH' | 'LAST_MONTH' | 'LAST_3' | 'LAST_6' | 'SELECT_MONTH'

interface OwnerStaffAttendanceChartProps {
    staff: StaffUser[]
    logs: AttendanceLog[]
}

const IST_TIMEZONE = 'Asia/Kolkata'
const STAFF_COLORS = [
    '#2563eb',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
    '#84cc16',
    '#ec4899',
    '#14b8a6',
    '#f97316',
]

function toISTDateKey(date: Date) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: IST_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date)
}

function addDays(dateKey: string, delta: number) {
    const [y, m, d] = dateKey.split('-').map(Number)
    const base = new Date(Date.UTC(y, m - 1, d))
    base.setUTCDate(base.getUTCDate() + delta)
    const yy = base.getUTCFullYear()
    const mm = String(base.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(base.getUTCDate()).padStart(2, '0')
    return `${yy}-${mm}-${dd}`
}

function shiftMonthStart(todayKey: string, deltaMonths: number) {
    const [y, m] = todayKey.split('-').map(Number)
    const shifted = new Date(Date.UTC(y, m - 1 + deltaMonths, 1))
    const yy = shifted.getUTCFullYear()
    const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0')
    return `${yy}-${mm}-01`
}

function endOfMonthKey(monthKey: string) {
    const [y, m] = monthKey.split('-').map(Number)
    const last = new Date(Date.UTC(y, m, 0))
    const dd = String(last.getUTCDate()).padStart(2, '0')
    return `${monthKey}-${dd}`
}

function monthLabel(monthKey: string) {
    const [y, m] = monthKey.split('-').map(Number)
    const d = new Date(Date.UTC(y, m - 1, 1))
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: IST_TIMEZONE })
}

export function OwnerStaffAttendanceChart({ staff, logs }: OwnerStaffAttendanceChartProps) {
    const [filter, setFilter] = useState<Filter>('WEEK')

    const monthOptions = useMemo(() => {
        const currentMonth = toISTDateKey(new Date()).slice(0, 7)
        const set = new Set<string>([currentMonth])
        for (const l of logs) {
            set.add(toISTDateKey(new Date(l.checkedAt)).slice(0, 7))
        }
        return Array.from(set).sort((a, b) => (a < b ? 1 : -1))
    }, [logs])

    const [selectedMonth, setSelectedMonth] = useState<string>(
        monthOptions[0] ?? toISTDateKey(new Date()).slice(0, 7)
    )

    const dailyHoursByUser = useMemo(() => {
        const byUser = new Map<string, { checkedAt: Date; type: string }[]>()
        for (const l of logs) {
            if (!byUser.has(l.userId)) byUser.set(l.userId, [])
            byUser.get(l.userId)!.push({ checkedAt: new Date(l.checkedAt), type: l.type })
        }

        const hoursByUser = new Map<string, Map<string, number>>()
        for (const [userId, userLogs] of byUser) {
            userLogs.sort((a, b) => a.checkedAt.getTime() - b.checkedAt.getTime())
            let lastIn: Date | null = null
            const dayMap = new Map<string, number>()

            for (const l of userLogs) {
                if (l.type === 'IN') {
                    lastIn = l.checkedAt
                    continue
                }
                if (l.type === 'OUT' && lastIn) {
                    const workedMs = l.checkedAt.getTime() - lastIn.getTime()
                    if (workedMs > 0) {
                        const dayKey = toISTDateKey(lastIn)
                        dayMap.set(dayKey, (dayMap.get(dayKey) ?? 0) + workedMs / (1000 * 60 * 60))
                    }
                    lastIn = null
                }
            }
            hoursByUser.set(userId, dayMap)
        }
        return hoursByUser
    }, [logs])

    const { rangeStart, rangeEnd, subtitle } = useMemo(() => {
        const today = toISTDateKey(new Date())
        if (filter === 'TODAY') return { rangeStart: today, rangeEnd: today, subtitle: 'Today' }
        if (filter === 'WEEK') return { rangeStart: addDays(today, -6), rangeEnd: today, subtitle: 'This week' }
        if (filter === 'MONTH') return { rangeStart: `${today.slice(0, 7)}-01`, rangeEnd: today, subtitle: 'This month' }
        if (filter === 'LAST_MONTH') {
            const priorMonth = shiftMonthStart(today, -1).slice(0, 7)
            return { rangeStart: `${priorMonth}-01`, rangeEnd: endOfMonthKey(priorMonth), subtitle: 'Last month' }
        }
        if (filter === 'LAST_3') return { rangeStart: shiftMonthStart(today, -2), rangeEnd: today, subtitle: 'Last 3 months' }
        if (filter === 'LAST_6') return { rangeStart: shiftMonthStart(today, -5), rangeEnd: today, subtitle: 'Last 6 months' }
        return {
            rangeStart: `${selectedMonth}-01`,
            rangeEnd: endOfMonthKey(selectedMonth),
            subtitle: monthLabel(selectedMonth),
        }
    }, [filter, selectedMonth])

    const staffHoursData = useMemo(() => {
        const result = staff.map((s, idx) => {
            const dayMap = dailyHoursByUser.get(s.id) ?? new Map<string, number>()
            let total = 0
            for (const [day, hrs] of dayMap) {
                if (day >= rangeStart && day <= rangeEnd) total += hrs
            }
            const hours = Number(total.toFixed(2))
            return {
                userId: s.id,
                name: s.name,
                role: s.role,
                hours,
                status: hours > 0 ? 'Worked' : 'No work log',
                fill: STAFF_COLORS[idx % STAFF_COLORS.length],
            }
        })
        return result.sort((a, b) => b.hours - a.hours)
    }, [staff, dailyHoursByUser, rangeStart, rangeEnd])

    const totalHours = staffHoursData.reduce((sum, s) => sum + s.hours, 0)
    const maxHours = Math.max(...staffHoursData.map((s) => s.hours), 0)

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground opacity-80 uppercase tracking-tight m-0">
                        Staff Attendance Hours
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-1 mb-0">
                        {subtitle} - {totalHours.toFixed(1)} total hrs
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select
                        value={filter}
                        onValueChange={(value) => {
                            if (value) setFilter(value as Filter)
                        }}
                    >
                        <SelectTrigger className="w-[145px] h-8 text-xs font-semibold border-border bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TODAY" className="text-xs">Today</SelectItem>
                            <SelectItem value="WEEK" className="text-xs">This week</SelectItem>
                            <SelectItem value="MONTH" className="text-xs">This month</SelectItem>
                            <SelectItem value="LAST_MONTH" className="text-xs">Last month</SelectItem>
                            <SelectItem value="LAST_3" className="text-xs">Last 3 months</SelectItem>
                            <SelectItem value="LAST_6" className="text-xs">Last 6 months</SelectItem>
                            <SelectItem value="SELECT_MONTH" className="text-xs">Select month</SelectItem>
                        </SelectContent>
                    </Select>

                    {filter === 'SELECT_MONTH' && (
                        <Select
                            value={selectedMonth}
                            onValueChange={(value) => {
                                if (value) setSelectedMonth(value)
                            }}
                        >
                            <SelectTrigger className="w-[140px] h-8 text-xs font-semibold border-border bg-background">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {monthOptions.map((m) => (
                                    <SelectItem key={m} value={m} className="text-xs">
                                        {monthLabel(m)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {staffHoursData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-lg m-0">
                    No staff records found
                </p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
                    <div className="h-[340px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                                data={staffHoursData}
                                innerRadius="18%"
                                outerRadius="95%"
                                barSize={16}
                                startAngle={90}
                                endAngle={-270}
                            >
                                <PolarAngleAxis type="number" domain={[0, Math.max(maxHours, 1)]} tick={false} />
                                <RadialBar dataKey="hours" background cornerRadius={8} />
                                <Tooltip
                                    formatter={(value) => {
                                        const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? 0))
                                        const hours = Number.isFinite(parsed) ? parsed : 0
                                        return [`${hours.toFixed(2)} hrs`, 'Hours']
                                    }}
                                />
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-2 max-h-[340px] overflow-auto pr-1">
                        {staffHoursData.map((s) => (
                            <div key={s.userId} className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-border bg-muted/20">
                                <div className="min-w-0 flex items-start gap-2.5">
                                    <span className="mt-1 w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.fill }} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground m-0 break-words">{s.name}</p>
                                        <p className="text-[11px] text-muted-foreground m-0 mt-1">
                                            {s.role} - {s.status}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-foreground whitespace-nowrap mt-0.5">
                                    {s.hours.toFixed(2)} hrs
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
