'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Plan {
    id: string; name: string; durationDays: number; price: number; isActive: boolean
}

export function PlanManager({ plans, gymId }: { plans: Plan[]; gymId: string }) {
    const router = useRouter()
    const [adding, setAdding] = useState(false)
    const [name, setName] = useState('')
    const [days, setDays] = useState('')
    const [price, setPrice] = useState('')
    const [saving, setSaving] = useState(false)

    async function addPlan() {
        if (!name || !days || !price) return
        setSaving(true)
        await fetch('/api/plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, durationDays: Number(days), price: Number(price) }),
        })
        setName(''); setDays(''); setPrice('')
        setAdding(false)
        setSaving(false)
        router.refresh()
    }

    async function deactivate(id: string) {
        await fetch(`/api/plans/${id}`, { method: 'DELETE' })
        router.refresh()
    }

    return (
        <div>
            {/* Plan list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {plans.filter(p => p.isActive).map(p => (
                    <div key={p.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 16px',
                        background: 'var(--color-background-secondary)',
                        borderRadius: 8,
                        border: '0.5px solid var(--color-border-tertiary)',
                    }}>
                        <div>
                            <span style={{ fontWeight: 500, fontSize: 14 }}>{p.name}</span>
                            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginLeft: 10 }}>
                                {p.durationDays} days
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <span style={{ fontWeight: 600, fontSize: 15 }}>₹{p.price}</span>
                            <button
                                onClick={() => deactivate(p.id)}
                                style={{
                                    background: 'none', border: 'none', fontSize: 12,
                                    color: 'var(--color-text-danger)', cursor: 'pointer', padding: '2px 6px',
                                }}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
                {plans.filter(p => p.isActive).length === 0 && (
                    <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>No plans yet</p>
                )}
            </div>

            {/* Add plan form */}
            {adding ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px', background: 'var(--color-background-secondary)', borderRadius: 10, border: '0.5px solid var(--color-border-tertiary)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <Label>Plan name</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Monthly" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <Label>Duration (days)</Label>
                            <Input type="number" value={days} onChange={e => setDays(e.target.value)} placeholder="30" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <Label>Price (₹)</Label>
                            <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="1500" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Button onClick={addPlan} disabled={saving} size="sm">
                            {saving ? 'Adding...' : 'Add plan'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setAdding(false)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <Button variant="outline" onClick={() => setAdding(true)}>
                    + Add plan
                </Button>
            )}
        </div>
    )
}