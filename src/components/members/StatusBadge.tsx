type MemberStatus = 'ACTIVE' | 'EXPIRED' | 'FROZEN' | 'CANCELLED'

const STATUS_CONFIG: Record<MemberStatus, { bg: string; color: string; label: string }> = {
  ACTIVE:    { bg: '#f0fdf4', color: '#166534', label: 'Active'    },
  EXPIRED:   { bg: '#fef2f2', color: '#991b1b', label: 'Expired'   },
  FROZEN:    { bg: '#eff6ff', color: '#1e40af', label: 'Frozen'    },
  CANCELLED: { bg: '#f1f5f9', color: '#475569', label: 'Cancelled' },
}

interface StatusBadgeProps {
  status: MemberStatus
  size?:  'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.CANCELLED

  return (
    <span style={{
      display:      'inline-block',
      background:   cfg.bg,
      color:        cfg.color,
      fontSize:     size === 'sm' ? 10 : 12,
      fontWeight:   700,
      padding:      size === 'sm' ? '2px 8px' : '4px 12px',
      borderRadius: 20,
      letterSpacing: '.02em',
    }}>
      {cfg.label}
    </span>
  )
}