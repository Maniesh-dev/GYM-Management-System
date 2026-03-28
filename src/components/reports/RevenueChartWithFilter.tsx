'use client'
import { useState, useMemo } from 'react'
import { RevenueChart } from '@/components/reports/RevenueChart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Payment {
    amount: number
    paidAt: Date
}

interface RevenueChartWithFilterProps {
    monthlyPayments: Payment[]
}

type TimeRange = '3M' | '6M' | '12M' | 'ALL'

export function RevenueChartWithFilter({ monthlyPayments }: RevenueChartWithFilterProps) {
    const [timeRange, setTimeRange] = useState<TimeRange>('6M')

    const revenueData = useMemo(() => {
        const now = new Date()
        let monthsToInclude = 6

        switch (timeRange) {
            case '3M': monthsToInclude = 3; break;
            case '6M': monthsToInclude = 6; break;
            case '12M': monthsToInclude = 12; break;
            case 'ALL':
                // Find oldest payment, but limit to max 60 months (5 years) for sanity
                if (monthlyPayments.length === 0) monthsToInclude = 6;
                else {
                    const oldest = new Date(Math.min(...monthlyPayments.map(p => new Date(p.paidAt).getTime())))
                    const monthDiff = (now.getFullYear() - oldest.getFullYear()) * 12 + now.getMonth() - oldest.getMonth()
                    monthsToInclude = Math.min(Math.max(monthDiff + 1, 6), 60) // At least 6, max 60
                }
                break;
        }

        const monthBuckets: Record<string, number> = {}
        
        // Initialize buckets in chronological order
        for (let i = monthsToInclude - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
            monthBuckets[key] = 0
        }

        // Only count payments that fall within our buckets
        monthlyPayments.forEach((p) => {
            const date = new Date(p.paidAt)
            const key = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
            if (key in monthBuckets) {
                monthBuckets[key] += p.amount
            }
        })

        return Object.entries(monthBuckets).map(([month, amount]) => ({ month, amount }))
    }, [monthlyPayments, timeRange])

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-sm font-bold text-foreground opacity-80 uppercase tracking-tight m-0">
                    Monthly Revenue
                </h3>
                <Select value={timeRange} onValueChange={(val) => setTimeRange(val as TimeRange)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs font-semibold focus:ring-1 focus:ring-ring border-border bg-background">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="3M" className="text-xs font-medium">Last 3 Months</SelectItem>
                        <SelectItem value="6M" className="text-xs font-medium">Last 6 Months</SelectItem>
                        <SelectItem value="12M" className="text-xs font-medium">Last 12 Months</SelectItem>
                        <SelectItem value="ALL" className="text-xs font-medium">All Time</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex-1 min-h-[220px] w-full mt-auto">
                <RevenueChart data={revenueData} />
            </div>
        </div>
    )
}
