'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Gym {
    id: string; name: string; phone: string | null; address: string | null
}

export function GymProfileForm({ gym }: { gym: Gym }) {
    const router = useRouter()
    const [name, setName] = useState(gym.name)
    const [phone, setPhone] = useState(gym.phone ?? '')
    const [address, setAddress] = useState(gym.address ?? '')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    async function handleSave() {
        setSaving(true)
        await fetch('/api/gym', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, address }),
        })
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        router.refresh()
    }

    const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={field}>
                    <Label>Gym name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div style={field}>
                    <Label>Phone number</Label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" />
                </div>
            </div>
            <div style={field}>
                <Label>Address</Label>
                <Textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} placeholder="Full address" />
            </div>
            <div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save changes'}
                </Button>
            </div>
        </div>
    )
}