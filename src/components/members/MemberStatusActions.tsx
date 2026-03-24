'use client'
import { useState }  from 'react'
import { useRouter } from 'next/navigation'

type MemberStatus = 'ACTIVE' | 'FROZEN' | 'CANCELLED' | 'EXPIRED'

interface MemberStatusActionsProps {
  memberId:      string
  currentStatus: MemberStatus
}

export function MemberStatusActions({
  memberId,
  currentStatus,
}: MemberStatusActionsProps) {
  const router  = useRouter()
  const [saving,       setSaving]       = useState(false)
  const [showFreeze,   setShowFreeze]   = useState(false)
  const [showCancel,   setShowCancel]   = useState(false)
  const [freezeUntil,  setFreezeUntil]  = useState('')

  if (currentStatus === 'CANCELLED') return null

  async function updateStatus(
    status:       'ACTIVE' | 'FROZEN' | 'CANCELLED',
    frozenUntil?: string
  ) {
    setSaving(true)
    await fetch(`/api/members/${memberId}/status`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status, frozenUntil }),
    })
    setSaving(false)
    setShowFreeze(false)
    setShowCancel(false)
    router.refresh()
  }

  const btn: React.CSSProperties = {
    padding:      '9px 16px',
    borderRadius: 8,
    fontSize:     13,
    fontWeight:   500,
    border:       '0.5px solid #d0cdc5',
    background:   '#fff',
    cursor:       'pointer',
    color:        '#444',
  }

  const overlay: React.CSSProperties = {
    position:        'fixed',
    inset:           0,
    background:      'rgba(0,0,0,0.5)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          1000,
    padding:         20,
  }

  const modal: React.CSSProperties = {
    background:     '#fff',
    borderRadius:   16,
    padding:        '28px 32px',
    width:          400,
    maxWidth:       '100%',
    display:        'flex',
    flexDirection:  'column',
    gap:            16,
  }

  const inp: React.CSSProperties = {
    width:        '100%',
    padding:      '9px 13px',
    borderRadius: 8,
    border:       '0.5px solid #d0cdc5',
    fontSize:     14,
    outline:      'none',
    background:   '#fff',
    color:        '#1a1a1a',
    boxSizing:    'border-box' as any,
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>

        {/* Freeze / Unfreeze */}
        {currentStatus === 'FROZEN' ? (
          <button
            onClick={() => updateStatus('ACTIVE')}
            disabled={saving}
            style={btn}
          >
            {saving ? '...' : 'Unfreeze'}
          </button>
        ) : (
          <button
            onClick={() => setShowFreeze(true)}
            style={btn}
          >
            Freeze
          </button>
        )}

        {/* Cancel */}
        <button
          onClick={() => setShowCancel(true)}
          style={{
            ...btn,
            color:       '#c0392b',
            borderColor: '#fca5a5',
          }}
        >
          Cancel membership
        </button>

      </div>

      {/* Freeze modal */}
      {showFreeze && (
        <div style={overlay} onClick={() => setShowFreeze(false)}>
          <div style={modal} onClick={e => e.stopPropagation()}>

            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>
                Freeze membership
              </h3>
              <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.6 }}>
                The membership will be paused. The expiry date will extend automatically when unfrozen.
              </p>
            </div>

            <div>
              <label style={{
                fontSize:     13,
                fontWeight:   500,
                color:        '#444',
                display:      'block',
                marginBottom: 6,
              }}>
                Freeze until (optional)
              </label>
              <input
                type="date"
                value={freezeUntil}
                onChange={e => setFreezeUntil(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={inp}
              />
              <p style={{ fontSize: 11, color: '#aaa', marginTop: 5 }}>
                Leave blank to freeze indefinitely until manually unfrozen.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => updateStatus('FROZEN', freezeUntil || undefined)}
                disabled={saving}
                style={{
                  flex:         1,
                  padding:      '10px 0',
                  borderRadius: 8,
                  border:       'none',
                  background:   saving ? '#ccc' : '#1a1a1a',
                  color:        '#fff',
                  fontSize:     14,
                  fontWeight:   600,
                  cursor:       saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Freeze membership'}
              </button>
              <button
                onClick={() => setShowFreeze(false)}
                style={btn}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Cancel modal */}
      {showCancel && (
        <div style={overlay} onClick={() => setShowCancel(false)}>
          <div style={modal} onClick={e => e.stopPropagation()}>

            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>
                Cancel membership?
              </h3>
              <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.6 }}>
                This member will be marked as cancelled and lose gym access. You can reactivate them by recording a new payment.
              </p>
            </div>

            <div style={{
              padding:      '12px 16px',
              borderRadius: 10,
              background:   '#fef2f2',
              border:       '0.5px solid #fca5a5',
              fontSize:     13,
              color:        '#991b1b',
            }}>
              This action is reversible — recording a new payment will reactivate the member.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => updateStatus('CANCELLED')}
                disabled={saving}
                style={{
                  flex:         1,
                  padding:      '10px 0',
                  borderRadius: 8,
                  border:       'none',
                  background:   saving ? '#ccc' : '#E24B4A',
                  color:        '#fff',
                  fontSize:     14,
                  fontWeight:   600,
                  cursor:       saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Cancelling...' : 'Yes, cancel membership'}
              </button>
              <button
                onClick={() => setShowCancel(false)}
                style={btn}
              >
                Keep active
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}