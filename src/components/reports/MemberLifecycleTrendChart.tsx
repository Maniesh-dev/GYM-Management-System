'use client'

import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

type TrendPoint = {
    month: string
    newMembers: number
    missingMembers: number
    expiredMembers: number
}

export function MemberLifecycleTrendChart({ data }: { data: TrendPoint[] }) {
    return (
        <div className="w-full h-full min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                        dataKey="month"
                        fontSize={11}
                        tick={{ fill: '#888' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        allowDecimals={false}
                        fontSize={11}
                        tick={{ fill: '#888' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            fontSize: 12,
                            borderRadius: 10,
                            border: '0.5px solid #e5e7eb',
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Line
                        type="monotone"
                        dataKey="newMembers"
                        name="New members"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="missingMembers"
                        name="Missing members"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="expiredMembers"
                        name="Expired members"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
