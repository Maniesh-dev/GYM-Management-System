'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

export function ApproveButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleApprove() {
        if (!confirm('Approve this manual check-in?')) return
        setLoading(true)

        try {
            const res = await fetch(`/api/staff/checkins/${id}/approve`, {
                method: 'POST'
            })
            if (res.ok) {
                toast.success('Approved successfully')
                router.refresh()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to approve')
            }
        } catch (err) {
            toast.error('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleApprove}
            disabled={loading}
            className={`
                px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all
                ${loading 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                    : 'bg-[#1D9E75] text-white hover:opacity-90 active:scale-95 shadow-sm'}
                ml-2
            `}
        >
            {loading ? '...' : 'Approve'}
        </button>
    )
}
