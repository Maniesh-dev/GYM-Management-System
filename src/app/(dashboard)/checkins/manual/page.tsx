'use client'
import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'

type MemberStatus = 'ACTIVE' | 'EXPIRED' | 'FROZEN' | 'CANCELLED'

type FoundMember = {
    id: string
    name: string
    phone: string
    photoUrl: string | null
    status: MemberStatus
    planName: string
    expiryDate: string
    daysLeft: number
    trainerName: string | null
    alreadyIn: boolean
    lastCheckin: string | null
}

type FoundStaff = {
    id: string
    name: string
    phone: string | null
    role: string
    alreadyIn: boolean
    lastType: 'IN' | 'OUT'
    lastCheckin: string | null
}

type CheckinResult = 'success' | 'already_in' | 'pending' | null
type Mode = 'MEMBER' | 'STAFF'

const STATUS_CFG: Record<MemberStatus, { bg: string; border: string; text: string; label: string }> = {
    ACTIVE: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-400', label: 'Active' },
    EXPIRED: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', label: 'Expired' },
    FROZEN: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', label: 'Frozen' },
    CANCELLED: { bg: 'bg-zinc-50 dark:bg-zinc-900/20', border: 'border-zinc-200 dark:border-zinc-800', text: 'text-zinc-700 dark:text-zinc-400', label: 'Cancelled' },
}

export default function ManualCheckinPage() {
    const { data: session } = useSession()
    const inputRef = useRef<HTMLInputElement>(null)

    const [mode, setMode] = useState<Mode>('MEMBER')
    const [query, setQuery] = useState('')
    const [searching, setSearching] = useState(false)
    const [foundMember, setFoundMember] = useState<FoundMember | null>(null)
    const [foundStaff, setFoundStaff] = useState<FoundStaff | null>(null)
    const [searchError, setSearchError] = useState('')
    const [confirming, setConfirming] = useState(false)
    const [checkinResult, setCheckinResult] = useState<CheckinResult>(null)
    const [recordTime, setRecordTime] = useState<string | null>(null)

    const [staffType, setStaffType] = useState<'IN' | 'OUT'>('IN')

    useEffect(() => {
        if (foundStaff) {
            setStaffType(foundStaff.alreadyIn ? 'OUT' : 'IN')
        }
    }, [foundStaff])

    // ── Search ──────────────────────────────────────────────────────
    async function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        if (!query.trim()) return

        setSearching(true)
        setSearchError('')
        setFoundMember(null)
        setFoundStaff(null)
        setCheckinResult(null)
        setRecordTime(null)

        try {
            const endpoint = mode === 'MEMBER'
                ? `/api/checkins/manual?phone=${encodeURIComponent(query.trim())}`
                : `/api/staff/checkins/manual?q=${encodeURIComponent(query.trim())}`

            const res = await fetch(endpoint, { cache: 'no-store' })
            const data = await res.json()

            if (!res.ok) {
                const err = data.error ?? (mode === 'MEMBER' ? 'Member not found' : 'Staff not found')
                setSearchError(err)
                toast.error(err)
            } else {
                if (mode === 'MEMBER') {
                    setFoundMember(data)
                } else {
                    if (Array.isArray(data)) {
                        if (data.length === 0) {
                            setSearchError('No staff found')
                            toast.error('No staff found')
                        }
                        else setFoundStaff(data[0])
                    } else {
                        setFoundStaff(data)
                    }
                }
                toast.success(`${mode} found`)
            }
        } catch {
            toast.error('Search failed')
        } finally {
            setSearching(false)
        }
    }

    // ── Confirm check-in ────────────────────────────────────────────
    async function handleCheckin() {
        if (mode === 'MEMBER' && !foundMember) return
        if (mode === 'STAFF' && !foundStaff) return

        setConfirming(true)

        const endpoint = mode === 'MEMBER' ? '/api/checkins/manual' : '/api/staff/checkins/manual'
        const body = mode === 'MEMBER'
            ? { memberId: foundMember!.id }
            : { userId: foundStaff!.id, type: staffType }

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            const data = await res.json()

            if (res.ok) {
                const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                setRecordTime(now)

                if (data.needsApproval) {
                    setCheckinResult('pending')
                    toast.success('Recorded! Pending approval.')
                } else {
                    setCheckinResult('success')
                    toast.success('Recorded successfully!')
                }

                if (mode === 'MEMBER') {
                    setFoundMember(prev => prev ? { ...prev, alreadyIn: true } : null)
                } else {
                    setFoundStaff(prev => prev ? {
                        ...prev,
                        alreadyIn: staffType === 'IN',
                        lastType: staffType,
                        lastCheckin: new Date().toISOString(),
                    } : null)
                }
            } else {
                const err = data.error || 'Failed to record entry'
                toast.error(err)
            }
        } catch {
            toast.error('An error occurred')
        } finally {
            setConfirming(false)
        }
    }

    // ── Reset form ──────────────────────────────────────────────────
    function reset() {
        setQuery('')
        setFoundMember(null)
        setFoundStaff(null)
        setSearchError('')
        setCheckinResult(null)
        setRecordTime(null)
        setTimeout(() => inputRef.current?.focus(), 50)
    }

    const canCheckin = mode === 'MEMBER'
        ? (foundMember?.status === 'ACTIVE' && !foundMember?.alreadyIn && !checkinResult)
        : (foundStaff && !checkinResult)

    const cfg = foundMember ? STATUS_CFG[foundMember.status] : null
    const isSelfChecking = mode === 'STAFF' && foundStaff?.id === session?.user?.id && session?.user?.role === 'RECEPTION'
    const canManageStaffAttendance = session?.user?.role === 'OWNER' || session?.user?.role === 'RECEPTION'
    const disableStaffCheckIn = mode === 'STAFF' && !!foundStaff?.alreadyIn && !checkinResult && canManageStaffAttendance

    // ── Styles ──────────────────────────────────────────────────────
    const pageClass = "min-h-screen bg-background flex items-start justify-center py-10 px-5"
    const containerClass = "w-full max-w-[480px]"
    const cardClass = "bg-card border border-border rounded-2xl py-7 px-8 mb-4 shadow-sm"
    const inpClass = "w-full px-4 py-3 rounded-xl border border-border text-base outline-none bg-background text-foreground tracking-[1px] focus:ring-2 focus:ring-ring transition-all"
    const rowClass = "flex justify-between items-center py-2.5 border-b border-border text-sm"

    return (
        <div className={pageClass}>
            <div className={containerClass}>

                {/* Header */}
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-black mb-1.5 text-foreground">
                        {mode === 'STAFF' ? 'Check-in / Check-out' : 'Check-in'}
                    </h1>
                    <div className="flex justify-center gap-1.5 mt-4 bg-muted/50 p-1.5 rounded-full w-fit mx-auto border border-border">
                        <button
                            onClick={() => { setMode('MEMBER'); reset(); }}
                            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'MEMBER' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Member
                        </button>
                        <button
                            onClick={() => { setMode('STAFF'); reset(); }}
                            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'STAFF' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Staff
                        </button>
                    </div>
                </div>

                {/* Search form */}
                <div className={cardClass}>
                    <form onSubmit={handleSearch} className="flex flex-col gap-3.5">
                        <div>
                            <label className="text-[13px] text-muted-foreground block mb-2 px-1">
                                {mode === 'MEMBER' ? 'Member Phone' : 'Staff Name or Phone'}
                            </label>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => {
                                    setQuery(e.target.value)
                                    setSearchError('')
                                    setFoundMember(null)
                                    setFoundStaff(null)
                                    setCheckinResult(null)
                                }}
                                placeholder={mode === 'MEMBER' ? "10-digit number..." : "Enter name or phone..."}
                                maxLength={mode === 'MEMBER' ? 10 : 50}
                                autoFocus
                                className={inpClass}
                            />
                        </div>

                        {searchError && (
                            <div className="px-3.5 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-[13px] text-red-800 dark:text-red-400 flex items-center gap-2">
                                <span className="text-base">❌</span>
                                {searchError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={searching || !query.trim()}
                            className={`py-3 rounded-xl text-[15px] font-black transition-all ${searching || !query.trim() ? 'bg-muted/60 text-muted-foreground/60 cursor-not-allowed' : 'bg-foreground text-background cursor-pointer hover:opacity-90 active:scale-[0.98]'}`}
                        >
                            {searching ? 'Searching...' : `Search ${mode.toLowerCase()}`}
                        </button>
                    </form>
                </div>

                {/* Member result */}
                {foundMember && cfg && (
                    <div className={`${cardClass} border-2 ${cfg.border} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        {checkinResult === 'success' && (
                            <div className="p-4 mb-5 rounded-xl bg-[#1D9E7515] border border-[#1D9E7530] text-sm font-bold text-[#1D9E75] flex items-center gap-3">
                                <span className="text-xl">✅</span>
                                <div>
                                    Checked in at <span className="text-foreground">{recordTime}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl border-2 shrink-0 ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                                {foundMember.photoUrl ? <img src={foundMember.photoUrl} className="w-full h-full rounded-full object-cover" /> : foundMember.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-foreground">{foundMember.name}</h2>
                                <span className={`text-[10px] uppercase px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.label}</span>
                            </div>
                        </div>

                        <div className="mb-6 space-y-0.5">
                            <div className={rowClass}><span className="text-muted-foreground font-medium">Plan</span> <span className="text-foreground">{foundMember.planName}</span></div>
                            <div className={rowClass}><span className="text-muted-foreground font-medium">Expiry</span> <span className="text-foreground">{new Date(foundMember.expiryDate).toLocaleDateString()}</span></div>
                            <div className={`${rowClass} border-none`}><span className="text-muted-foreground font-medium">Days remaining</span> <span className={`font-black ${foundMember.daysLeft <= 7 ? 'text-red-600' : 'text-[#1D9E75]'}`}>{foundMember.daysLeft}</span></div>
                        </div>

                        {foundMember.alreadyIn && !checkinResult && (
                            <div className="p-3.5 mb-5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-[13px] text-[#BA7517]">⚠️ Already checked in within the last hour.</div>
                        )}

                        <div className="flex gap-2.5">
                            {checkinResult === 'success' ? (
                                <button onClick={reset} className="flex-1 py-3.5 rounded-xl bg-foreground text-background font-black cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all">Next Member</button>
                            ) : (
                                <>
                                    {canCheckin && <button onClick={handleCheckin} disabled={confirming} className="flex-1 py-3.5 rounded-xl bg-[#1D9E75] text-white font-black cursor-pointer hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all shadow-sm">{confirming ? 'Working...' : 'Confirm Entry'}</button>}
                                    <button onClick={reset} className="px-6 py-3.5 rounded-xl border border-border text-muted-foreground cursor-pointer hover:bg-muted/50 transition-all">Cancel</button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Staff result */}
                {foundStaff && (
                    <div className={`${cardClass} border-2 border-[#534AB7]20 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        {checkinResult === 'success' && (
                            <div className="p-4 mb-5 rounded-xl bg-[#1D9E7515] border border-[#1D9E7530] text-sm text-[#1D9E75] flex items-center gap-3">
                                <span className="text-xl">✅</span>
                                <div>
                                    {staffType} recorded at <span className="text-foreground">{recordTime}</span>
                                </div>
                            </div>
                        )}
                        {checkinResult === 'pending' && (
                            <div className="p-4 mb-5 rounded-xl bg-[#BA751715] border border-[#BA751730] text-[13px] text-[#BA7517] flex items-start gap-3 leading-relaxed">
                                <span className="text-xl mt-0.5">⏳</span>
                                <div>
                                    Recorded at <span className="text-foreground">{recordTime}</span>. Sent for <strong>Owner Approval</strong>.
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border">
                            <div className="w-14 h-14 rounded-full bg-[#534AB710] border-2 border-[#534AB730] text-[#534AB7] flex items-center justify-center font-black text-xl shrink-0">
                                {foundStaff.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-foreground">{foundStaff.name}</h2>
                                <span className="text-[10px] uppercase px-2.5 py-1 rounded-full bg-[#534AB715] text-[#534AB7] border border-[#534AB720]">{foundStaff.role}</span>
                            </div>
                        </div>

                        {!checkinResult && (
                            <div className="mb-6">
                                <div className="text-[11px] mb-3 text-muted-foreground uppercase tracking-wider px-1">Select action</div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            if (!disableStaffCheckIn) setStaffType('IN')
                                        }}
                                        disabled={disableStaffCheckIn}
                                        className={`flex-1 py-3 rounded-xl border font-black text-sm transition-all ${staffType === 'IN' ? 'bg-[#1D9E75] text-white border-[#1D9E75] shadow-sm shadow-emerald-100 dark:shadow-none' : 'bg-background text-foreground border-border hover:bg-muted/50'} ${disableStaffCheckIn ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        {disableStaffCheckIn ? 'Already checked IN' : 'Check In'}
                                    </button>
                                    <button
                                        onClick={() => setStaffType('OUT')}
                                        className={`flex-1 py-3 rounded-xl border font-black text-sm transition-all ${staffType === 'OUT' ? 'bg-[#185FA5] text-white border-[#185FA5] shadow-sm' : 'bg-background text-foreground border-border hover:bg-muted/50'}`}
                                    >
                                        Check Out
                                    </button>
                                </div>
                            </div>
                        )}

                        {foundStaff.lastCheckin && !checkinResult && (
                            <div className="mb-6 p-3.5 rounded-xl bg-muted/30 border border-border text-[11px] text-muted-foreground flex justify-between items-center">
                                <span className="font-medium uppercase tracking-wider">Yesterday & Previous</span>
                                <span className="text-foreground">Last: {foundStaff.lastType} · {new Date(foundStaff.lastCheckin).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}</span>
                            </div>
                        )}

                        {isSelfChecking && !checkinResult && (
                            <div className="mb-6 p-4 rounded-xl bg-[#BA751710] border border-[#BA751720] text-[13px] text-[#BA7517] leading-relaxed shadow-sm">
                                <strong>⚠️ Self-Recording:</strong> This entry requires approval from the <strong>Gym Owner</strong> to be counted for hours.
                            </div>
                        )}

                        <div className="flex gap-2.5">
                            {checkinResult ? (
                                <button onClick={reset} className="flex-1 py-3.5 rounded-xl bg-foreground text-background font-black cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all">Next Staff</button>
                            ) : (
                                <>
                                    <button onClick={handleCheckin} disabled={confirming} className="flex-1 py-3.5 rounded-xl bg-[#534AB7] text-white font-black cursor-pointer hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all shadow-md shadow-indigo-100 dark:shadow-none">
                                        {confirming ? 'Processing...' : 'Record Attendance'}
                                    </button>
                                    <button onClick={reset} className="px-6 py-3.5 rounded-xl border border-border text-muted-foreground cursor-pointer hover:bg-muted/50 transition-all">Cancel</button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
