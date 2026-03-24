'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export function RevenueChart({ data }: { data: { month: string; amount: number }[] }) {
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" fontSize={11} tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis
                    fontSize={11}
                    tick={{ fill: '#888' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                    formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e0e0e0' }}
                />
                <Bar dataKey="amount" fill="#534AB7" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}