'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import toast from 'react-hot-toast'

interface Member { id: string; name: string; phone: string }

export function ManualCheckinButton({ members }: { members: Member[] }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [id, setId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [showSuggestions, setShowSuggestions] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    const filteredMembers = members.filter(m =>
        m.phone.includes(searchQuery) || m.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    async function checkin() {
        if (!id) return
        setSaving(true)
        await toast.promise(fetch('/api/checkins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId: id }),
        }), {
            loading: 'Checking in...',
            success: 'Check-in successful!',
            error: 'Failed to check-in.',
        })
        setSaving(false)
        setOpen(false)
        router.refresh()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
                <Button variant="default" className='border-zinc-900 cursor-pointer'>+ Manual check-in</Button>
            </DialogTrigger>
            <DialogContent style={{ maxWidth: 400 }}>
                <DialogHeader>
                    <DialogTitle>Manual check-in</DialogTitle>
                </DialogHeader>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                    <div className="relative w-full" ref={wrapperRef}>
                        <Input
                            placeholder="Type a name or phone number..."
                            value={searchQuery}
                            onFocus={() => setShowSuggestions(true)}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setId(null)
                                setShowSuggestions(true)
                            }}
                        />
                        {showSuggestions && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-md shadow-md max-h-60 overflow-auto">
                                {filteredMembers.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-zinc-500 text-center">No members found</div>
                                ) : (
                                    filteredMembers.map(m => (
                                        <div
                                            key={m.id}
                                            className="px-3 py-2 cursor-pointer hover:bg-zinc-100 text-sm flex justify-between items-center"
                                            onClick={() => {
                                                setId(m.id)
                                                setSearchQuery(`${m.name} — ${m.phone}`)
                                                setShowSuggestions(false)
                                            }}
                                        >
                                            <span className="font-medium text-zinc-900">{m.name}</span>
                                            <span className="text-zinc-500 text-xs">{m.phone}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    <Button onClick={checkin} disabled={saving || !id}>
                        {saving ? 'Checking in...' : 'Check in'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}