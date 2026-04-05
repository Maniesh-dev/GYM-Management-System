'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const VAL_TO_NUM: Record<string, string> = {
    'THIS MONTH': '0',
    'LAST MONTH': '1',
    'LAST 3 MONTHS': '3',
    'LAST 6 MONTHS': '6',
    'LAST 12 MONTHS': '12',
    'ALL TIME': 'ALL',
}

const NUM_TO_VAL: Record<string, string> = {
    '0': 'THIS MONTH',
    '1': 'LAST MONTH',
    '3': 'LAST 3 MONTHS',
    '6': 'LAST 6 MONTHS',
    '12': 'LAST 12 MONTHS',
    'ALL': 'ALL',
}

export function MemberLifecycleTrendFilter({ currentMonths }: { currentMonths: number | string }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const handleValueChange = (val: string | null) => {
        if (!val) return;
        const numVal = VAL_TO_NUM[val]
        if (!numVal) return

        const params = new URLSearchParams(searchParams.toString())
        if (numVal === '6') {
            params.delete('memberMonths')
        } else {
            params.set('memberMonths', numVal)
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const selectValue = NUM_TO_VAL[currentMonths.toString()] || 'LAST_6'

    return (
        <Select value={selectValue} onValueChange={handleValueChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs font-semibold focus:ring-1 focus:ring-ring border-border bg-background">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="THIS MONTH" className="text-xs font-medium">This Month</SelectItem>
                <SelectItem value="LAST MONTH" className="text-xs font-medium">Last Month</SelectItem>
                <SelectItem value="LAST 3 MONTHS" className="text-xs font-medium">Last 3 Months</SelectItem>
                <SelectItem value="LAST 6 MONTHS" className="text-xs font-medium">Last 6 Months</SelectItem>
                <SelectItem value="LAST 12 MONTHS" className="text-xs font-medium">Last 12 Months</SelectItem>
                <SelectItem value="ALL TIME" className="text-xs font-medium">All Time</SelectItem>
            </SelectContent>
        </Select>
    )
}
