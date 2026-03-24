'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export function ReceiptButton({ paymentId }: { paymentId: string }) {
    const [loading, setLoading] = useState(false)

    async function download() {
        setLoading(true)
        try {
            toast.loading('Generating receipt...')
            const res = await fetch(`/api/payments/${paymentId}/receipt`)
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `receipt-${paymentId}.pdf`
            a.click()
            URL.revokeObjectURL(url)
        } finally {
            toast.dismiss()
            setLoading(false)
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={download} disabled={loading}>
            {loading ? '...' : 'PDF'}
        </Button>
    )
}