'use client'
import { useEffect, useState } from 'react'
import { generateMemberQR }    from '@/lib/qr'

interface MemberQRCardProps {
  memberId:   string
  memberName: string
  qrToken:    string
}

export function MemberQRCard({
  memberId,
  memberName,
  qrToken,
}: MemberQRCardProps) {
  const [dataUrl,  setDataUrl]  = useState('')
  const [loading,  setLoading]  = useState(true)
  const [regen,    setRegen]    = useState(false)
  const [copied,   setCopied]   = useState(false)

  useEffect(() => {
    generateMemberQR(qrToken)
      .then(url => {
        setDataUrl(url)
        setLoading(false)
      })
  }, [qrToken])

  async function regenerate() {
    if (!confirm('Regenerate QR code? The old QR will stop working immediately.')) return
    setRegen(true)
    const res  = await fetch(`/api/members/${memberId}/qr`, { method: 'POST' })
    const data = await res.json()
    if (data.dataUrl) setDataUrl(data.dataUrl)
    setRegen(false)
  }

  function download() {
    const a    = document.createElement('a')
    a.href     = dataUrl
    a.download = `qr-${memberName.toLowerCase().replace(/\s+/g, '-')}.png`
    a.click()
  }

  function print() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>QR — ${memberName}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: sans-serif;
            }
            img { width: 260px; height: 260px; }
            h2  { font-size: 20px; margin: 16px 0 4px; }
            p   { font-size: 14px; color: #888; margin: 0; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
          <h2>${memberName}</h2>
          <p>Scan at kiosk for gym entry</p>
        </body>
      </html>
    `)
    win.document.close()
    win.print()
  }

  async function share() {
    try {
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], `qr-${memberName.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' })
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${memberName} QR Code`,
          text: 'Scan at kiosk for gym entry',
        })
      } else {
        alert('Sharing is not supported on this device/browser.')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to share')
    }
  }

  if (loading) {
    return (
      <div style={{
        width:        200,
        height:       200,
        borderRadius: 12,
        background:   '#f8f8f7',
        border:       '0.5px solid #e8e5dd',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        color:        '#aaa',
        fontSize:     13,
      }}>
        Loading...
      </div>
    )
  }

  const btnStyle: React.CSSProperties = {
    padding:      '7px 14px',
    borderRadius: 7,
    fontSize:     12,
    fontWeight:   500,
    border:       '0.5px solid #d0cdc5',
    background:   '#fff',
    cursor:       'pointer',
    color:        '#444',
    transition:   'background .1s',
  }

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      gap:            12,
    }}>
      {/* QR Image */}
      <div style={{
        padding:      12,
        borderRadius: 16,
        border:       '0.5px solid #e8e5dd',
        background:   '#fff',
      }}>
        <img
          src={dataUrl}
          alt={`QR code for ${memberName}`}
          style={{
            width:       200,
            height:      200,
            display:     'block',
            borderRadius: 8,
          }}
        />
      </div>

      {/* Name label */}
      <p style={{
        fontSize:  13,
        fontWeight: 600,
        color:     '#1a1a1a',
        margin:    0,
        textAlign: 'center',
      }}>
        {memberName}
      </p>

      <p style={{ fontSize: 11, color: '#aaa', margin: 0, textAlign: 'center' }}>
        Scan at kiosk for entry
      </p>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={download} style={btnStyle}>
          Download
        </button>
        <button onClick={print} style={btnStyle}>
          Print
        </button>
        <button onClick={share} style={btnStyle}>
          Share
        </button>
        <button
          onClick={regenerate}
          disabled={regen}
          style={{
            ...btnStyle,
            color:       '#c0392b',
            borderColor: '#fca5a5',
            cursor:      regen ? 'not-allowed' : 'pointer',
          }}
        >
          {regen ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>

      {regen === false && (
        <p style={{ fontSize: 11, color: '#aaa', margin: 0, textAlign: 'center', maxWidth: 220 }}>
          Regenerating creates a new QR. Share the new one with the member.
        </p>
      )}
    </div>
  )
}