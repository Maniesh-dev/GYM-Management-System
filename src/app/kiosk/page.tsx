'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import jsQR from 'jsqr'

type ScanStatus = 'SUCCESS' | 'EXPIRED' | 'FROZEN' | 'ALREADY_IN' | 'INVALID'

type ScanResult = {
    status: ScanStatus
    scanType?: 'MEMBER' | 'TRAINER'
    checkType?: 'IN' | 'OUT'
    name?: string
    plan?: string
    role?: string
    trainer?: string | null
    expiryDate?: string
    message?: string
}

type MemberStatus = 'ACTIVE' | 'EXPIRED' | 'FROZEN' | 'CANCELLED'

type FoundMember = {
    id: string
    name: string
    phone: string
    status: MemberStatus
    planName: string
    expiryDate: string
    daysLeft: number
    trainerName: string | null
    alreadyIn: boolean
    lastCheckin: string | null
}

const RESULT_CFG: Record<ScanStatus, { bg: string; border: string; text: string; icon: string }> = {
    SUCCESS: { bg: '#f0fdf4', border: '#4ade80', text: '#166534', icon: '✅' },
    EXPIRED: { bg: '#fef2f2', border: '#f87171', text: '#991b1b', icon: '❌' },
    FROZEN: { bg: '#eff6ff', border: '#60a5fa', text: '#1e40af', icon: '🔒' },
    ALREADY_IN: { bg: '#fefce8', border: '#facc15', text: '#854d0e', icon: '⚠️' },
    INVALID: { bg: '#fef2f2', border: '#f87171', text: '#991b1b', icon: '❓' },
}

const MEMBER_STATUS_CFG: Record<MemberStatus, { bg: string; border: string; text: string }> = {
    ACTIVE: { bg: '#f0fdf4', border: '#4ade80', text: '#166534' },
    EXPIRED: { bg: '#fef2f2', border: '#f87171', text: '#991b1b' },
    FROZEN: { bg: '#eff6ff', border: '#60a5fa', text: '#1e40af' },
    CANCELLED: { bg: '#f8fafc', border: '#cbd5e1', text: '#475569' },
}

type Tab = 'qr' | 'manual'

export default function KioskPage() {
    const [activeTab, setActiveTab] = useState<Tab>('qr')

    return (
        <>
            <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0f172a; height: 100%; }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(10px) scale(.97); }
          to   { opacity:1; transform:translateY(0)    scale(1);   }
        }
        @keyframes slideIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0);   }
        }
        @keyframes scanMove {
          0%,100% { top:10%; }
          50%     { top:85%; }
        }
        @keyframes pulse {
          0%,100% { opacity:1;  }
          50%     { opacity:.4; }
        }
        @keyframes spin {
          to { transform:rotate(360deg); }
        }
        .scan-line {
          position:absolute; left:8%; right:8%; height:2px;
          background:linear-gradient(90deg,transparent,#22d3ee 30%,#22d3ee 70%,transparent);
          animation:scanMove 2s ease-in-out infinite;
          border-radius:2px; pointer-events:none;
        }
        .pulse-dot {
          width:8px; height:8px; border-radius:50%;
          background:#22d3ee;
          animation:pulse 1s ease-in-out infinite;
        }
      `}</style>

            <div style={{
                minHeight: '100vh',
                background: '#0f172a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '28px 20px 40px',
                gap: 20,
            }}>

                {/* Header */}
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 800, letterSpacing: -.5, margin: '0 0 4px' }}>
                        FitZone
                    </p>
                    <p style={{ color: '#475569', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', margin: 0 }}>
                        Entry Scanner
                    </p>
                </div>

                {/* Tab switcher */}
                <div style={{
                    display: 'flex',
                    background: '#1e293b',
                    borderRadius: 12,
                    padding: 4,
                    gap: 4,
                    width: 300,
                }}>
                    {(['qr', 'manual'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                flex: 1,
                                padding: '9px 0',
                                borderRadius: 9,
                                border: 'none',
                                background: activeTab === tab ? '#fff' : 'transparent',
                                color: activeTab === tab ? '#1a1a1a' : '#64748b',
                                fontSize: 13,
                                fontWeight: activeTab === tab ? 700 : 400,
                                cursor: 'pointer',
                                transition: 'all .15s',
                            }}
                        >
                            {tab === 'qr' ? 'QR Scan' : 'Manual Entry'}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                {activeTab === 'qr'
                    ? <QRScanTab />
                    : <ManualEntryTab />
                }

            </div>
        </>
    )
}

// ── QR SCAN TAB ───────────────────────────────────────────────────────
function QRScanTab() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const scanningRef = useRef(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const lastScanned = useRef('')

    const [result, setResult] = useState<ScanResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [camErr, setCamErr] = useState(false)
    const [camErrMsg, setCamErrMsg] = useState('')
    const [cameraReady, setCameraReady] = useState(false)

    const processScan = useCallback(async (token: string, type: string) => {
        const key = `${token}-${type}`
        if (key === lastScanned.current) return
        lastScanned.current = key
        setTimeout(() => { lastScanned.current = '' }, 4000)

        setLoading(true)
        setResult(null)
        try {
            const res = await fetch('/api/checkins/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, type }),
            })
            const data: ScanResult = await res.json()
            setResult(data)
            setTimeout(() => setResult(null), 5000)
        } catch {
            setResult({ status: 'INVALID', message: 'Network error.' })
            setTimeout(() => setResult(null), 3000)
        } finally {
            setLoading(false)
        }
    }, [])

    // URL params
    useEffect(() => {
        const p = new URLSearchParams(window.location.search)
        const token = p.get('token')
        const type = p.get('type')
        if (token && type) {
            window.history.replaceState({}, '', '/kiosk')
            processScan(token, type)
        }
    }, [])

    // Camera start
    useEffect(() => {
        async function start() {
            try {
                let stream: MediaStream
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                        audio: false,
                    })
                } catch {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                }
                streamRef.current = stream
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play()
                            .then(() => setCameraReady(true))
                            .catch(() => { setCamErr(true); setCamErrMsg('Could not start video.') })
                    }
                }
            } catch (err: any) {
                setCamErr(true)
                setCamErrMsg(
                    err.name === 'NotAllowedError' ? 'Camera permission denied.' :
                        err.name === 'NotFoundError' ? 'No camera found.' :
                            'Could not access camera.'
                )
            }
        }
        start()
        return () => {
            streamRef.current?.getTracks().forEach(t => t.stop())
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [])

    // jsQR scan loop
    useEffect(() => {
        if (!cameraReady) return
        intervalRef.current = setInterval(() => {
            const video = videoRef.current
            const canvas = canvasRef.current
            if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return
            if (scanningRef.current) return
            const ctx = canvas.getContext('2d', { willReadFrequently: true })
            if (!ctx) return
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            })
            if (!code) return
            try {
                const url = new URL(code.data)
                const token = url.searchParams.get('token')
                const type = url.searchParams.get('type')
                if (token && type) {
                    scanningRef.current = true
                    processScan(token, type)
                    setTimeout(() => { scanningRef.current = false }, 3500)
                }
            } catch { /* not a valid URL */ }
        }, 400)
        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [cameraReady, processScan])

    const cfg = result ? RESULT_CFG[result.status] : null

    return (
        <>
            {/* Camera frame */}
            <div style={{
                width: 300, height: 300, borderRadius: 20,
                overflow: 'hidden', border: '2px solid #1e293b',
                position: 'relative', background: '#1e293b', flexShrink: 0,
            }}>
                {camErr ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', gap: 10 }}>
                        <p style={{ fontSize: 32 }}>📷</p>
                        <p style={{ color: '#f87171', fontSize: 13, fontWeight: 700 }}>Camera unavailable</p>
                        <p style={{ color: '#64748b', fontSize: 12, lineHeight: 1.6 }}>{camErrMsg}</p>
                        <p style={{ color: '#475569', fontSize: 11 }}>Switch to Manual Entry tab</p>
                    </div>
                ) : (
                    <>
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        {cameraReady && <div className="scan-line" />}
                        {[
                            { top: 12, left: 12, borderTop: '2.5px solid #22d3ee', borderLeft: '2.5px solid #22d3ee' },
                            { top: 12, right: 12, borderTop: '2.5px solid #22d3ee', borderRight: '2.5px solid #22d3ee' },
                            { bottom: 12, left: 12, borderBottom: '2.5px solid #22d3ee', borderLeft: '2.5px solid #22d3ee' },
                            { bottom: 12, right: 12, borderBottom: '2.5px solid #22d3ee', borderRight: '2.5px solid #22d3ee' },
                        ].map((s, i) => (
                            <div key={i} style={{ position: 'absolute', width: 24, height: 24, ...s } as React.CSSProperties} />
                        ))}
                        {!cameraReady && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #22d3ee', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
                                <p style={{ color: '#94a3b8', fontSize: 12 }}>Starting camera...</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Scan status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 22 }}>
                {!result && !loading && cameraReady && !camErr && (
                    <><div className="pulse-dot" /><p style={{ color: '#64748b', fontSize: 13 }}>Scanning — point QR at camera</p></>
                )}
                {loading && <p style={{ color: '#94a3b8', fontSize: 13 }}>Validating...</p>}
                {!cameraReady && !camErr && <p style={{ color: '#475569', fontSize: 13 }}>Initialising camera...</p>}
            </div>

            {/* Result card */}
            {result && cfg && (
                <div style={{ width: 300, borderRadius: 16, border: `2px solid ${cfg.border}`, background: cfg.bg, padding: '22px 20px', textAlign: 'center', animation: 'slideUp .25s ease', flexShrink: 0 }}>
                    <div style={{ fontSize: 40, marginBottom: 10, lineHeight: 1 }}>
                        {result.scanType === 'TRAINER' && result.status === 'SUCCESS'
                            ? result.checkType === 'OUT' ? '👋' : '💪'
                            : cfg.icon}
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: cfg.text, opacity: .7, margin: '0 0 8px' }}>
                        {result.scanType === 'TRAINER'
                            ? `Trainer ${result.checkType === 'OUT' ? 'Clock-out' : 'Clock-in'}`
                            : result.status === 'SUCCESS' ? 'Welcome!'
                                : result.status === 'EXPIRED' ? 'Membership expired'
                                    : result.status === 'FROZEN' ? 'Membership frozen'
                                        : result.status === 'ALREADY_IN' ? 'Already checked in'
                                            : 'Invalid QR code'}
                    </p>
                    <p style={{ fontSize: 22, fontWeight: 800, color: cfg.text, margin: '0 0 10px' }}>
                        {result.name ?? '—'}
                    </p>
                    {result.scanType === 'MEMBER' && result.status === 'SUCCESS' && (
                        <div style={{ fontSize: 13, color: cfg.text, opacity: .75, lineHeight: 1.9 }}>
                            {result.plan && <div>Plan: <strong>{result.plan}</strong></div>}
                            {result.trainer && <div>Trainer: {result.trainer}</div>}
                        </div>
                    )}
                    {result.scanType === 'TRAINER' && result.status === 'SUCCESS' && (
                        <p style={{ fontSize: 13, color: cfg.text, opacity: .75, margin: 0 }}>{result.role}</p>
                    )}
                    {result.status === 'EXPIRED' && result.expiryDate && (
                        <p style={{ fontSize: 12, color: cfg.text, opacity: .65, marginTop: 6 }}>
                            Expired: {new Date(result.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                    )}
                    {result.message && (
                        <p style={{ fontSize: 12, color: cfg.text, opacity: .65, marginTop: 6 }}>{result.message}</p>
                    )}
                </div>
            )}
        </>
    )
}

// ── MANUAL ENTRY TAB ──────────────────────────────────────────────────
function ManualEntryTab() {
    const inputRef = useRef<HTMLInputElement>(null)
    const [phone, setPhone] = useState('')
    const [searching, setSearching] = useState(false)
    const [member, setMember] = useState<FoundMember | null>(null)
    const [searchError, setSearchError] = useState('')
    const [confirming, setConfirming] = useState(false)
    const [checkinDone, setCheckinDone] = useState(false)

    async function search(e: React.FormEvent) {
        e.preventDefault()
        if (!phone.trim()) return
        setSearching(true)
        setSearchError('')
        setMember(null)
        setCheckinDone(false)

        const res = await fetch(`/api/checkins/manual?phone=${encodeURIComponent(phone.trim())}`)
        const data = await res.json()

        if (!res.ok) {
            setSearchError(data.error ?? 'Member not found')
        } else {
            setMember(data)
        }
        setSearching(false)
    }

    async function confirm() {
        if (!member) return
        setConfirming(true)
        const res = await fetch('/api/checkins/manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId: member.id }),
        })
        if (res.ok) {
            setCheckinDone(true)
            setMember(prev => prev ? { ...prev, alreadyIn: true } : null)
        }
        setConfirming(false)
    }

    function reset() {
        setPhone('')
        setMember(null)
        setSearchError('')
        setCheckinDone(false)
        setTimeout(() => inputRef.current?.focus(), 50)
    }

    const cfg = member ? MEMBER_STATUS_CFG[member.status] : null
    const canCheckin = member?.status === 'ACTIVE' && !member?.alreadyIn && !checkinDone

    return (
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Phone input */}
            <div style={{ background: '#1e293b', borderRadius: 14, padding: '18px 20px' }}>
                <form onSubmit={search} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', margin: 0 }}>
                        Member phone number
                    </p>
                    <input
                        ref={inputRef}
                        type="tel"
                        value={phone}
                        onChange={e => { setPhone(e.target.value); setSearchError(''); if (member) { setMember(null); setCheckinDone(false) } }}
                        placeholder="Enter 10-digit number..."
                        maxLength={10}
                        autoFocus
                        style={{
                            padding: '11px 14px', borderRadius: 9,
                            border: '0.5px solid #334155', background: '#0f172a',
                            color: '#f1f5f9', fontSize: 15, outline: 'none',
                            letterSpacing: 1, width: '100%', boxSizing: 'border-box' as any,
                        }}
                    />
                    {searchError && (
                        <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>❌ {searchError}</p>
                    )}
                    <button
                        type="submit"
                        disabled={searching || !phone.trim()}
                        style={{
                            padding: '11px 0', borderRadius: 9, border: 'none',
                            background: searching || !phone.trim() ? '#334155' : '#22d3ee',
                            color: searching || !phone.trim() ? '#64748b' : '#0f172a',
                            fontSize: 13, fontWeight: 700,
                            cursor: searching || !phone.trim() ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {searching ? 'Searching...' : 'Find member'}
                    </button>
                </form>
            </div>

            {/* Member result */}
            {member && cfg && (
                <div style={{
                    background: cfg.bg,
                    border: `2px solid ${cfg.border}`,
                    borderRadius: 14,
                    padding: '18px 20px',
                    animation: 'slideIn .2s ease',
                }}>

                    {/* Success banner */}
                    {checkinDone && (
                        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#166634', border: 'none', marginBottom: 14, fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>✅</span> Checked in!
                        </div>
                    )}

                    {/* Member info */}
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <p style={{ fontSize: 18, fontWeight: 800, color: cfg.text, margin: 0 }}>{member.name}</p>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(0,0,0,.08)', color: cfg.text }}>
                                {member.status}
                            </span>
                        </div>
                        <p style={{ fontSize: 13, color: cfg.text, opacity: .7, margin: '0 0 12px' }}>{member.phone}</p>

                        <div style={{ fontSize: 13, lineHeight: 2, color: cfg.text, opacity: .8 }}>
                            <div>Plan: <strong>{member.planName}</strong></div>
                            <div>
                                Expires:{' '}
                                <strong>
                                    {new Date(member.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </strong>
                            </div>
                            {member.status === 'ACTIVE' && (
                                <div>
                                    Days left:{' '}
                                    <strong style={{ color: member.daysLeft <= 7 ? '#c0392b' : cfg.text }}>
                                        {member.daysLeft === 0 ? 'Expires today' : `${member.daysLeft} days`}
                                    </strong>
                                </div>
                            )}
                            {member.trainerName && <div>Trainer: <strong>{member.trainerName}</strong></div>}
                        </div>
                    </div>

                    {/* Warnings */}
                    {member.alreadyIn && !checkinDone && (
                        <div style={{ padding: '9px 12px', borderRadius: 8, background: 'rgba(0,0,0,.08)', fontSize: 12, color: cfg.text, marginBottom: 12 }}>
                            ⚠️ Already checked in within the last hour
                            {member.lastCheckin && ` (${new Date(member.lastCheckin).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })})`}
                        </div>
                    )}
                    {member.status === 'EXPIRED' && (
                        <div style={{ padding: '9px 12px', borderRadius: 8, background: 'rgba(0,0,0,.08)', fontSize: 12, color: cfg.text, marginBottom: 12 }}>
                            ❌ Membership expired — direct to billing counter
                        </div>
                    )}
                    {member.status === 'FROZEN' && (
                        <div style={{ padding: '9px 12px', borderRadius: 8, background: 'rgba(0,0,0,.08)', fontSize: 12, color: cfg.text, marginBottom: 12 }}>
                            🔒 Membership is frozen
                        </div>
                    )}
                    {member.status === 'ACTIVE' && member.daysLeft <= 7 && member.daysLeft > 0 && !checkinDone && (
                        <div style={{ padding: '9px 12px', borderRadius: 8, background: 'rgba(0,0,0,.08)', fontSize: 12, color: cfg.text, marginBottom: 12 }}>
                            ⏰ Expires in {member.daysLeft} day{member.daysLeft !== 1 ? 's' : ''} — remind to renew
                        </div>
                    )}

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        {checkinDone ? (
                            <button
                                onClick={reset}
                                style={{ flex: 1, padding: '11px 0', borderRadius: 9, border: 'none', background: '#166634', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                            >
                                Next member →
                            </button>
                        ) : (
                            <>
                                {canCheckin && (
                                    <button
                                        onClick={confirm}
                                        disabled={confirming}
                                        style={{ flex: 1, padding: '11px 0', borderRadius: 9, border: 'none', background: confirming ? '#ccc' : '#166534', color: '#fff', fontSize: 13, fontWeight: 700, cursor: confirming ? 'not-allowed' : 'pointer' }}
                                    >
                                        {confirming ? 'Saving...' : '✓ Confirm check-in'}
                                    </button>
                                )}
                                <button
                                    onClick={reset}
                                    style={{ padding: '11px 16px', borderRadius: 9, border: '0.5px solid rgba(0,0,0,.15)', background: 'rgba(0,0,0,.08)', fontSize: 13, cursor: 'pointer', color: cfg.text, fontWeight: 500 }}
                                >
                                    Clear
                                </button>
                            </>
                        )}
                    </div>

                </div>
            )}

        </div>
    )
}