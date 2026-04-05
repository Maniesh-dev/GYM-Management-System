'use client'
import { useEffect, useState } from 'react'
import { generateTrainerQR } from '@/lib/qr'
import { Button } from '@/components/ui/button'

export function TrainerQRCard({ qrToken, name, staffId }: { qrToken: string; name: string; staffId: string }) {
    const [dataUrl, setDataUrl] = useState('')
    const [regen, setRegen] = useState(false)

    useEffect(() => {
        generateTrainerQR(qrToken).then(setDataUrl)
    }, [qrToken])

    async function regenerate() {
        if (!confirm('Regenerate QR code? The old QR will stop working immediately.')) return
        setRegen(true)
        try {
            const res  = await fetch(`/api/staff/${staffId}/qr`, { method: 'POST' })
            const data = await res.json()
            if (data.dataUrl) setDataUrl(data.dataUrl)
        } catch (err) {
            console.error('Failed to regenerate QR', err)
            alert('Failed to regenerate QR')
        }
        setRegen(false)
    }

    async function share() {
        try {
            const res = await fetch(dataUrl)
            const blob = await res.blob()
            const file = new File([blob], `qr-${name.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' })
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `${name} QR Code`,
                    text: 'Attendance QR',
                })
            } else {
                alert('Sharing is not supported on this device/browser.')
            }
        } catch (err) {
            console.error(err)
            alert('Failed to share')
        }
    }

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
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button variant="outline" size="sm" onClick={download}>Download</Button>
                <Button variant="outline" size="sm" onClick={share}>Share</Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={regenerate} 
                    disabled={regen}
                    style={regen ? { opacity: 0.5, cursor: 'not-allowed' } : { color: '#c0392b', borderColor: '#fca5a5' }}
                >
                    {regen ? 'Regenerating...' : 'Regenerate'}
                </Button>
            </div>
        </div>
    )
}