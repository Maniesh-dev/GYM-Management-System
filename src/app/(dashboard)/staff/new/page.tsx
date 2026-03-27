'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select'

const schema = z.object({
    name: z.string().min(2, 'Name required'),
    email: z.string().email('Enter valid email'),
    password: z.string().min(6, 'Minimum 6 characters'),
    role: z.enum(['TRAINER', 'RECEPTION']),
    phone: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function NewStaffPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { role: 'TRAINER' },
    })

    async function onSubmit(values: FormValues) {
        setSaving(true)
        setError('')
        const res = await fetch('/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        })
        const data = await res.json()
        if (!res.ok) {
            setError(data.error ?? 'Failed to add staff')
            setSaving(false)
        } else {
            router.push('/dashboard/staff')
            router.refresh()
        }
    }

    const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
    const err: React.CSSProperties = { fontSize: 12, color: 'var(--color-text-danger)' }
    const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }

    return (
        <div style={{ padding: '28px 32px', maxWidth: 560 }}>
            <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 28 }}>Add staff member</h1>

            <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div style={grid2}>
                    <div style={field}>
                        <Label>Full name *</Label>
                        <Input {...form.register('name')} placeholder="Amit Singh" />
                        {form.formState.errors.name && (
                            <p style={err}>{form.formState.errors.name.message}</p>
                        )}
                    </div>
                    <div style={field}>
                        <Label>Role *</Label>
                        <Select
                            defaultValue="TRAINER"
                            onValueChange={v => form.setValue('role', v as FormValues['role'])}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TRAINER">Trainer</SelectItem>
                                <SelectItem value="RECEPTION">Reception</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div style={field}>
                    <Label>Email *</Label>
                    <Input {...form.register('email')} type="email" placeholder="amit@Fight Club.com" />
                    {form.formState.errors.email && (
                        <p style={err}>{form.formState.errors.email.message}</p>
                    )}
                </div>

                <div style={grid2}>
                    <div style={field}>
                        <Label>Password *</Label>
                        <Input {...form.register('password')} type="password" placeholder="Min 6 characters" />
                        {form.formState.errors.password && (
                            <p style={err}>{form.formState.errors.password.message}</p>
                        )}
                    </div>
                    <div style={field}>
                        <Label>Phone</Label>
                        <Input {...form.register('phone')} placeholder="9876543210" maxLength={10} />
                    </div>
                </div>

                {/* Info box */}
                <div style={{
                    background: 'var(--color-background-secondary)',
                    border: '0.5px solid var(--color-border-tertiary)',
                    borderRadius: 8, padding: '12px 14px', fontSize: 13,
                    color: 'var(--color-text-secondary)',
                }}>
                    A QR code will be auto-generated for this staff member. Trainers can scan it at the kiosk to clock in and out.
                </div>

                {error && <p style={err}>{error}</p>}

                <div style={{ display: 'flex', gap: 12 }}>
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Adding...' : 'Add staff member'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                </div>

            </form>
        </div>
    )
}