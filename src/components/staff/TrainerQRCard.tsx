'use client'
import { useEffect, useState } from 'react'
import { generateTrainerQR } from '@/lib/qr'
import { Button } from '@/components/ui/button'

export function TrainerQRCard({ qrToken, name }: { qrToken: string; name: string }) {
    const [dataUrl, setDataUrl] = useState('')

    useEffect(() => {
        generateTrainerQR(qrToken).then(setDataUrl)
    }, [qrToken])

    function download() {
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `qr-${name.toLowerCase().replace(/\s+/g, '-')}.png`
        a.click()
    }

    if (!dataUrl) return <div style={{ width: 160, height: 160, background: 'var(--color-background-secondary)', borderRadius: 8 }} />

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <img src={dataUrl} alt={`QR ${name}`} style={{ width: 140, height: 140, borderRadius: 8, border: '0.5px solid var(--color-border-tertiary)' }} />
            <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Attendance QR</p>
            <Button variant="outline" size="sm" onClick={download}>Download</Button>
        </div>
    )
}