import Link from 'next/link'

export default function UnauthorizedPage() {
    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexDirection: 'column', gap: 16,
            background: 'var(--color-background-tertiary)',
        }}>
            <p style={{ fontSize: 72, fontWeight: 700, color: 'var(--color-border-secondary)', lineHeight: 1 }}>
                403
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 500 }}>Access denied</h1>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                You do not have permission to view this page.
            </p>
            <Link href="/dashboard" style={{
                padding: '10px 20px', borderRadius: 8, fontSize: 14,
                background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
                textDecoration: 'none', fontWeight: 500,
            }}>
                Back to dashboard
            </Link>
        </div>
    )
}