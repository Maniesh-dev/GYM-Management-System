'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type MemberStatus = 'ACTIVE' | 'FROZEN' | 'CANCELLED' | 'EXPIRED'

interface MemberStatusActionsProps {
  memberId: string
  currentStatus: MemberStatus
}

export function MemberStatusActions({
  memberId,
  currentStatus,
}: MemberStatusActionsProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [showFreeze, setShowFreeze] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [freezeUntil, setFreezeUntil] = useState('')

  if (currentStatus === 'CANCELLED') return null

  async function updateStatus(
    status: 'ACTIVE' | 'FROZEN' | 'CANCELLED',
    frozenUntil?: string
  ) {
    setSaving(true)
    await fetch(`/api/members/${memberId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, frozenUntil }),
    })
    setSaving(false)
    setShowFreeze(false)
    setShowCancel(false)
    router.refresh()
  }

  const overlayClass = "fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-5 backdrop-blur-sm"
  const modalClass = "bg-card border border-border rounded-2xl p-7 w-full max-w-[420px] shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200"
  const inputClass = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm outline-none bg-background text-foreground focus:ring-2 focus:ring-ring"
  const btnClass = "h-10 px-4 py-2 rounded-lg text-sm font-semibold border border-border shadow-sm flex-1 flex items-center justify-center transition-all active:scale-[0.98]"

  return (
    <>
      <div className="flex gap-2 w-full h-10">

        {/* Freeze / Unfreeze */}
        {currentStatus === 'FROZEN' ? (
          <button
            onClick={() => updateStatus('ACTIVE')}
            disabled={saving}
            className={`${btnClass} bg-background text-foreground border-border hover:bg-muted`}
          >
            {saving ? '...' : 'Unfreeze'}
          </button>
        ) : (
          <button
            onClick={() => setShowFreeze(true)}
            className={`${btnClass} bg-background text-foreground border-border hover:bg-muted`}
          >
            Freeze
          </button>
        )}

        {/* Cancel */}
        <button
          onClick={() => setShowCancel(true)}
          className={`${btnClass} bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20`}
        >
          Cancel
        </button>

      </div>

      {/* Freeze modal */}
      {showFreeze && (
        <div className={overlayClass} onClick={() => setShowFreeze(false)}>
          <div className={modalClass} onClick={e => e.stopPropagation()}>

            <div>
              <h3 className="text-lg font-black text-foreground mb-1">
                Freeze membership
              </h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                The membership will be paused. The expiry date will extend automatically when unfrozen.
              </p>
            </div>

            <div>
              <label className="text-[13px] font-bold text-foreground mb-1.5 block">
                Freeze until (optional)
              </label>
              <input
                type="date"
                value={freezeUntil}
                onChange={e => setFreezeUntil(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={inputClass}
              />
              <p className="text-[11px] text-muted-foreground mt-2 opacity-80">
                Leave blank to freeze indefinitely until manually unfrozen.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => updateStatus('FROZEN', freezeUntil || undefined)}
                disabled={saving}
                className="flex-1 font-bold h-11"
              >
                {saving ? 'Saving...' : 'Freeze membership'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFreeze(false)}
                className="h-11 font-semibold"
              >
                Cancel
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* Cancel modal */}
      {showCancel && (
        <div className={overlayClass} onClick={() => setShowCancel(false)}>
          <div className={modalClass} onClick={e => e.stopPropagation()}>

            <div>
              <h3 className="text-lg font-black text-rose-600 mb-1">
                Cancel membership?
              </h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                This member will be marked as cancelled and lose gym access. You can reactivate them by recording a new payment.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-xs font-medium leading-relaxed">
              This action is reversible — recording a new payment will reactivate the member.
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="destructive"
                onClick={() => updateStatus('CANCELLED')}
                disabled={saving}
                className="flex-1 font-bold h-11"
              >
                {saving ? 'Cancelling...' : 'Yes, cancel'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCancel(false)}
                className="h-11 font-semibold"
              >
                Keep active
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}