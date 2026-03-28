'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function TerminateButton({ staffId, staffName }: { staffId: string, staffName: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleTerminate() {
        if (!confirm(`Are you sure you want to terminate ${staffName}?\nThey will immediately lose access to the system, but their past records will be kept.`)) {
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`/api/staff/${staffId}/terminate`, {
                method: 'DELETE'
            })
            if (res.ok) {
                router.refresh()
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to terminate staff')
            }
        } catch (error) {
            console.error('Termination error:', error)
            alert('A network error occurred.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleTerminate}
            disabled={loading}
            className="mt-4 sm:mt-0 w-full sm:w-auto px-4 py-2 border border-red-500/30 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
            {loading ? 'Terminating...' : 'Terminate Staff'}
        </button>
    )
}
